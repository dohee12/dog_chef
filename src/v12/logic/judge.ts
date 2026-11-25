// 근거 데이터(dog-food-evidence.json)로 재료·레시피를 판정한다.
// 목업 v12 의 judge.js 를 그대로 옮겼다. 서버(Supabase Edge Function) 엔진의 원형이다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { josa } from "./josa";
export type Judge = ReturnType<typeof makeJudge>;

export function makeJudge(D: any) {
  // 재료 이름에서 양·단위(숫자로 시작하는 낱말)와 괄호를 뺀다. "3살인데 포도"처럼 숫자 뒤 낱말도 남긴다.
  function words(name: string) {
    name = name.replace(/\(.*?\)/g, " ");
    return name
      .split(/\s+/)
      .filter((w) => w && !/^[\d½¼¾/.,]/.test(w))
      .join(" ");
  }
  // 띄어쓰기가 달라도 같은 재료로 본다. 한 글자 낱말(배, 파, 소)은 exact_terms 로 낱말 단위로만 맞춘다.
  function hit(rule: any, n: string) {
    const flat = n.replace(/\s+/g, "");
    const inName = (t: string) => n.includes(t) || flat.includes(t.replace(/\s+/g, ""));
    if ((rule.except_terms || []).some(inName)) return false;
    const ex: string[] = rule.exact_terms || [];
    if ((rule.ko_terms || []).some((t: string) => !ex.includes(t) && inName(t))) return true;
    const toks = n.split(" ");
    return ex.some((t) => toks.includes(t));
  }
  function judgeIng(raw: string) {
    const n = words(raw);
    const tox = D.toxic_foods.filter((r: any) => hit(r, n));
    const danger = tox.find((r: any) => r.level === "danger");
    const cautions = tox.filter((r: any) => r.level === "caution");
    const safe = tox.length ? null : D.safe_foods.find((s: any) => hit(s, n));
    return {
      raw,
      n,
      level: (danger ? "danger" : cautions.length ? "caution" : safe ? "safe" : "unknown") as
        | "danger"
        | "caution"
        | "safe"
        | "unknown",
      rule: danger || cautions[0] || safe || null,
      extra: (danger ? [] : cautions.slice(1)) as any[],
      parts: D.part_hazards.items.filter((p: any) => hit(p, n)) as any[],
      allergens: D.allergens.items.filter((a: any) => hit(a, n)) as any[],
    };
  }
  // 품종 비교: "토이푸들" ⊃ "푸들"은 맞고, "개"처럼 짧은 말이 "진돗개"에 맞으면 안 된다.
  function breedMatch(list: string[], breed?: string) {
    breed = (breed || "").trim();
    if (!breed) return false;
    return (list || []).some((b) => b === breed || breed!.includes(b) || (breed!.length >= 3 && b.includes(breed!)));
  }
  // 등록한 병 + 품종 때문에 잘 걸리는 병. 품종 쪽은 byBreed 표시를 붙인다.
  function effectiveConditions(pet: any) {
    const reg: string[] = (pet && pet.conditions) || [];
    const out = D.health_conditions
      .filter((h: any) => reg.includes(h.id))
      .map((h: any) => ({ hc: h, byBreed: false }));
    for (const h of D.health_conditions)
      if (!reg.includes(h.id) && breedMatch(h.breeds_ko, pet && pet.breed)) out.push({ hc: h, byBreed: true });
    return out as { hc: any; byBreed: boolean }[];
  }
  // 재료 규칙이 없는 병(신장병, 요산·시스틴 결석, 구리 간질환)은 레시피 전체를 "주의(수의사와 상의)"로 둔다.
  const GENERAL_IDS = ["ckd", "urate-stones", "cystine-stones", "copper-hepatopathy"];
  const DAIRY_IDS = ["dairy"];
  function judgeRecipe(ingredients: string[], pet: any) {
    const items = ingredients.map(judgeIng);
    const blocks: any[] = [],
      warns: any[] = [],
      notes: any[] = [],
      unknown: any[] = [];
    const allergies: string[] = (pet && pet.allergies) || [];
    const conds = effectiveConditions(pet);
    for (const it of items) {
      if (it.level === "danger") blocks.push({ kind: "danger", ing: it, text: it.rule.label + ": " + it.rule.reason });
      if (it.level === "unknown") unknown.push(it);
      for (const a of it.allergens)
        if (allergies.includes(a.id)) blocks.push({ kind: "allergy", ing: it, text: a.label + " 알레르기" });
      for (const c of D.allergens.cross_reactivity) {
        if (c.pair.length !== 2) continue;
        for (const [mine, other] of [
          [c.pair[0], c.pair[1]],
          [c.pair[1], c.pair[0]],
        ])
          if (allergies.includes(mine) && it.allergens.some((a: any) => a.id === other))
            warns.push({ kind: "cross", ing: it, text: c.message, src: c });
      }
      if (it.level === "caution")
        for (const r of [it.rule, ...it.extra])
          warns.push({ kind: "caution", ing: it, text: r.label + ": " + r.reason, src: r });
      // 유당 민감: 우유·유제품 주의 재료에 이유를 덧붙인다. 락토프리는 제외.
      if (pet && pet.lactose_sensitive && it.rule && DAIRY_IDS.includes(it.rule.id))
        warns.push({
          kind: "lactose",
          ing: it,
          text: "유당 민감: 우유를 먹으면 배탈이 나는 아이예요. 유당이 든 유제품은 빼거나 락토프리로 바꿔 주세요.",
          src: it.rule,
        });
      for (const p of it.parts) notes.push({ kind: "part", ing: it, text: p.guide, src: p });
      for (const { hc, byBreed } of conds) {
        if (!it.rule || GENERAL_IDS.includes(hc.id)) continue;
        const ids = [...(hc.avoid_ids || []), ...(hc.avoid_safe_ids || [])];
        const fatty = hc.id === "pancreatitis" && /췌장염/.test((it.rule.reason || "") + (it.rule.conditions || ""));
        if (ids.includes(it.rule.id) || fatty)
          warns.push({
            kind: "condition",
            byBreed,
            ing: it,
            src: hc,
            text:
              (byBreed
                ? `${josa(pet.breed, "은/는")} ${hc.label.split(" (")[0]}에 잘 걸리는 품종이에요. `
                : hc.label.split(" (")[0] + ": ") + hc.message,
          });
      }
      for (const b of D.breed_sensitivities)
        if (it.rule && it.rule.id === b.toxic_id && breedMatch(b.breeds_ko, pet && pet.breed))
          blocks.push({ kind: "breed", ing: it, text: b.message, src: b });
    }
    for (const { hc, byBreed } of conds)
      if (!byBreed && GENERAL_IDS.includes(hc.id))
        warns.push({ kind: "general", ing: null, src: hc, text: hc.label.split(" (")[0] + ": " + hc.message });
    const status = (blocks.length ? "no" : warns.length ? "caution" : unknown.length ? "unknown" : "ok") as
      | "no"
      | "caution"
      | "unknown"
      | "ok";
    return { items, blocks, warns, notes, unknown, status };
  }
  function petRisks(pet: any) {
    return effectiveConditions(pet)
      .filter((c) => c.byBreed)
      .map((c) => c.hc);
  }
  return { words, hit, judgeIng, judgeRecipe, petRisks, breedMatch, effectiveConditions };
}
