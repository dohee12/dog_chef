// AI 멍셰프 (근거 데이터 검색형). 목업의 answer() 를 그대로 옮기고, HTML 대신 말풍선 조각 목록을 돌려준다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { bump, D, J, pet, SEED, showToast, state } from "../store";
import { CALC, computeCalc, LTITLE, openCalcWith, type Mode } from "./calc";

// 글 조각: **굵게**, 줄바꿈은 \n
export type ChatNode =
  | { t: "text"; s: string }
  | { t: "note"; s: string }
  | { t: "calc"; lv: number; s: string }
  | { t: "action"; label: string; ghost?: boolean; act: () => void }
  | { t: "chips"; ev: any[]; ctx?: string }
  | { t: "badge"; s: string };
export type ChatMsg = { who: "user" | "bot"; nodes: ChatNode[] };

export const chatMsgs: ChatMsg[] = [
  {
    who: "bot",
    nodes: [
      {
        t: "text",
        s: "안녕하세요! 저는 **AI 멍셰프**예요 🐾\n재료 이름을 물어보시면 **근거 자료에 있는 내용만** 출처와 함께 알려드려요. 자료에 없으면 \"확인 안 됨\"이라고 솔직하게 말씀드릴게요.",
      },
    ],
  },
];

const callAction = (): ChatNode => ({ t: "action", label: "📞 병원 전화", act: () => showToast("목업: 가까운 24시 동물병원 전화 연결") });
const COND_WORDS: Record<string, string[]> = {
  ckd: ["신장", "콩팥"], pancreatitis: ["췌장"], diabetes: ["당뇨"], "calcium-oxalate-stones": ["수산칼슘"],
  "urate-stones": ["요산"], "cystine-stones": ["시스틴"], "copper-hepatopathy": ["구리", "간질환"],
};
// 질문 속 양: "50g", "3알", "2조각", "1000mg"
function parseAmount(q: string) {
  const m = q.match(/(\d+(?:\.\d+)?)\s*(mg|g|그램|알|개|조각|쪽)/);
  if (!m) return null;
  const n = +m[1], u = m[2];
  return u === "mg" ? { mode: "gram" as Mode, n, mg: true } : u === "g" || u === "그램" ? { mode: "gram" as Mode, n, mg: false } : { mode: "count" as Mode, n, mg: false };
}
// 질문 속 낱말로 종류를 고른다. 모르면 null (계산기에서 고르게 한다).
const SUBKW: Record<string, [string, number][]> = {
  chocolate: [["화이트", 6], ["코코아", 5], ["베이킹", 4], ["무가당", 4], ["세미", 3], ["달콤", 3], ["다크", 2], ["밀크", 1]],
  allium: [["가루", 2], ["말린", 2], ["마늘", 1], ["양파", 0], ["부추", 0], ["파", 0]],
  "grapes-raisins": [["건포도", 1], ["포도", 0]],
};
function guessSub(id: string, q: string) {
  const m = (SUBKW[id] || []).find(([w]) => q.includes(w));
  return m ? m[1] : null;
}

export function answer(q: string): ChatNode[] {
  const out: ChatNode[] = [];
  const text = (s: string) => out.push({ t: "text", s });
  const clean = q.replace(/[?？!.,]/g, " ");
  let p: any = pet();
  const named = SEED.pets.find((x) => x.name && q.includes(x.name));
  // 반려견 이름(예: 초코)을 재료로 읽지 않게 빼고 판정
  const clean2 = SEED.pets.reduce((s, x) => (x.name ? s.split(x.name).join(" ") : s), clean);
  if (named && named.key !== state.pet) {
    state.pet = named.key;
    p = named;
    out.push({ t: "note", s: `${p.name} 기준으로 바꿔서 답할게요.` });
  }
  const qConds = Object.entries(COND_WORDS).filter(([, ws]) => ws.some((w) => q.includes(w))).map(([id]) => id);
  const pj = { ...p, conditions: [...new Set([...(p.conditions || []), ...qConds])] };
  const it = J.judgeIng(clean2);
  const j = J.judgeRecipe([clean2], pj);
  const ate = /먹었|삼켰|먹어 버|먹어버|주워 먹|집어 먹/.test(q);
  const ev: any[] = [];
  if (it.level === "unknown") {
    if (ate) {
      text("❔ **근거 자료에서 찾지 못했어요.**\n구토·설사·기운 없음 같은 증상이 있거나 걱정되면 동물병원에 전화해 주세요.");
      out.push(callAction(), { t: "badge", s: "확인 안 됨 · 근거 없음" });
      return out;
    }
    const condTxt = qConds
      .map((id) => D.health_conditions.find((x: any) => x.id === id))
      .map((hc: any) => `\n🩺 ${hc.label.split(" (")[0]}: ${hc.message}`)
      .join("");
    text(`❔ **근거 자료에서 그 재료를 찾지 못했어요.**\n그래서 먹여도 된다고도, 안 된다고도 말씀드릴 수 없어요. 처음 주는 재료라면 빼 주세요.${condTxt}`);
    out.push({ t: "badge", s: "확인 안 됨 · 근거 없음" });
    return out;
  }
  const r = it.rule;
  if (ate && (it.level === "danger" || it.level === "caution")) {
    text("🚨 **이미 먹었다면 바로 동물병원에 연락하세요.**");
    out.push(callAction());
    const amt = parseAmount(q);
    if (it.level === "danger" && CALC[r.id]) {
      if (amt) {
        const f = CALC[r.id], sub = guessSub(r.id, q), cac = q.match(/(\d+)\s*%/);
        // 질문의 단위를 계산기 단위로 바꾼다: 자일리톨은 mg, 나머지는 g
        let n = amt.n;
        if (amt.mode === "gram") n = f.gramUnit === "mg" ? (amt.mg ? n : n * 1000) : amt.mg ? n / 1000 : n;
        const c: any = f.items && amt.mode === "count"
          ? { food: r.id, mode: "item", item: null }
          : { food: r.id, sub, mode: amt.mode, count: amt.mode === "count" ? n : 0, grams: amt.mode === "gram" ? n : 0, unitW: null, cacao: cac ? +cac[1] : null };
        const res = computeCalc(c, p);
        if (res.level > 0) out.push({ t: "calc", lv: res.level, s: `🧮 ${p.name}(${p.weight}kg) 기준 ${res.num || ""} → **${LTITLE[res.level]}**\n${res.band}` });
        else if (c.mode === "item") out.push({ t: "calc", lv: 1, s: "🧮 계산기에서 무엇을 먹었는지 그림으로 고르면 바로 계산해요." });
        else if (res.need || res.level === -2) out.push({ t: "calc", lv: 1, s: `🧮 ${res.need || res.band}. 계산기에서 마저 넣어 주세요.` });
        const pk = p.key;
        out.push({ t: "action", ghost: true, label: "🧮 계산기에서 자세히", act: () => openCalcWith(r.id, amt.mode, n, pk, sub, cac ? +cac[1] : null) });
      } else {
        const pk = p.key, gs = guessSub(r.id, q);
        out.push({ t: "action", ghost: true, label: "🧮 먹은 양으로 계산", act: () => openCalcWith(r.id, "gram", 0, pk, gs) });
      }
    }
    text("\n");
  }
  if (it.level === "danger") text(`⛔ **${r.label}: 주지 마세요.**\n${r.reason}`);
  else if (it.level === "caution") text(`⚠️ **${r.label}: 주의가 필요해요.**\n${r.reason}`);
  else text(`✓ **${r.label}: 괜찮아요** (조건을 지켜 주세요)\n조건: ${r.conditions || ""}`);
  ev.push(...(r.evidence || []));
  for (const pt of it.parts) { text(`✂️ **${pt.part}**: ${pt.guide}`); ev.push(...(pt.evidence || [])); }
  for (const b of j.blocks.filter((b: any) => b.kind === "allergy")) text(`🚫 **${p.name}는 ${b.text}가 있어서 안 돼요.**`);
  for (const b of j.blocks.filter((b: any) => b.kind === "breed")) { text(`🐕 ${p.breed}: ${b.text}`); ev.push(...(b.src.evidence || [])); }
  for (const w of j.warns.filter((w: any) => ["cross", "condition", "general", "lactose"].includes(w.kind))) {
    text(`${w.kind === "cross" ? "🔁" : "🩺"} ${w.text}`);
    ev.push(...(w.src.evidence || []));
  }
  const unreg = qConds.filter((id) => !(p.conditions || []).includes(id));
  if (unreg.length) out.push({ t: "note", s: `💡 ${p.name}의 건강 상태에 등록하면 모든 레시피에 반영돼요.` });
  if (/몇|얼마나|급여량/.test(q)) text("\n📏 하루 급여량은 아직 근거 데이터에 없어요 (근거 없음). 영양 DB를 연결하면 체중별로 계산해 드릴 예정이에요.");
  if (!ate && it.level === "danger" && CALC[r.id]) {
    const pk = p.key, gs = guessSub(r.id, q);
    out.push({ t: "action", label: "🧮 먹었다면: 먹은 양으로 위험도 계산", act: () => openCalcWith(r.id, "gram", 0, pk, gs) });
  }
  out.push({ t: "chips", ev, ctx: r.label + ": " + (r.reason || r.conditions || "") });
  return out;
}

export function sendChat(q: string) {
  q = q.trim();
  if (!q) return;
  chatMsgs.push({ who: "user", nodes: [{ t: "text", s: q }] });
  bump();
  setTimeout(() => {
    chatMsgs.push({ who: "bot", nodes: answer(q) });
    bump();
  }, 250);
}
