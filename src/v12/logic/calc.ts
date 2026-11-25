// 먹었어요 계산기 (목업 v12.6 "그림으로 고르기"를 그대로 옮김)
// 독성 수치는 근거 데이터(doses)와 Merck 초콜릿 표에서 가져온다. 근거 없는 기본값은 채우지 않는다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { bump, D, J, pet, showToast, state, type Pet } from "../store";
import { josa } from "./josa";

export const tox = (id: string) => D.toxic_foods.find((t: any) => t.id === id);

export type Item = {
  k: string;
  icon: string;
  name: string;
  ex: string;
  g?: number;
  s?: number;
  unit?: string;
  pl?: string[];
  upper?: boolean;
  detail?: boolean;
  fixed?: boolean;
  unknown?: boolean;
};
export type Food = {
  icon: string;
  name: string;
  tile: string;
  unit: string;
  uwKind?: string;
  gramUnit?: string;
  src?: string;
  defMode: Mode;
  itemQ?: string;
  items?: Item[];
  wsrc?: string;
  subs: [string, number | string | null][] | null;
  agent?: string;
  ref?: string;
  hint: string;
  unitFix?: number;
};
export type Mode = "item" | "gram" | "count" | null;

export const CALC: Record<string, Food> = {
  chocolate: {
    icon: "🍫", name: "초콜릿", tile: "초콜릿", unit: "조각", uwKind: "g", src: "merck-chocolate", defMode: "item", itemQ: "어떤 초콜릿을",
    items: [
      { k: "bar34", icon: "🍫", name: "판초콜릿 작은 것", ex: "가나 마일드 34g 등", g: 34, s: 2.3 },
      { k: "bar70", icon: "🍫", name: "판초콜릿 큰 것", ex: "70g짜리", g: 70, s: 2.3 },
      { k: "pie", icon: "🥮", name: "초코파이류", ex: "1개 39g", g: 39, s: 2.3, upper: true },
      { k: "stick", icon: "🥢", name: "빼빼로류", ex: "1갑 54g", g: 54, s: 2.3, upper: true },
      { k: "other", icon: "⚫", name: "다크·코코아·다른 것", ex: "종류·무게 직접", detail: true },
    ],
    wsrc: "무게는 대표 제품의 표시 중량이에요(판매처 상품 정보).",
    subs: [["종류를 몰라요", null], ["밀크", 2.3], ["다크 (카카오 % 알아요)", "cacao"], ["달콤한 다크", 5.6], ["베이킹용 무가당", 15.5], ["코코아 가루", 28.5], ["화이트", 0.04]],
    agent: "초콜릿 독성 성분(메틸잔틴)", ref: "증상 기준 1kg당 20mg부터",
    hint: "카카오 %를 알면 Merck 방식(무가당 초콜릿 15.5 mg/g × 카카오 %)으로 계산해요. 예: 70%는 약 10.9 mg/g. 달콤한 다크는 Merck 표 5.3~5.6 mg/g 중 큰 값이에요.",
  },
  "grapes-raisins": { icon: "🍇", name: "포도 / 건포도", tile: "포도·건포도", unit: "알", defMode: "count", subs: [["포도·샤인머스캣", 19.6], ["건포도", 2.8]], hint: "" },
  xylitol: {
    icon: "🍬", name: "자일리톨 껌·사탕", tile: "자일리톨", unit: "개", uwKind: "mg", gramUnit: "mg", defMode: "count", subs: null,
    agent: "자일리톨", ref: "증상 기준 1kg당 30mg부터",
    hint: "자일리톨 양은 제품마다 달라요. 성분표의 자일리톨 함량을 넣어 주세요. 모르면 바로 병원에 전화하세요.",
  },
  allium: {
    icon: "🧅", name: "양파 / 파 / 마늘", tile: "양파·마늘", unit: "조각", uwKind: "g", defMode: "item", itemQ: "어떤 걸",
    items: [
      { k: "garlic", icon: "🧄", name: "마늘", ex: "1쪽 약 3g", unit: "쪽", g: 3, s: 5 },
      { k: "onion", icon: "🧅", name: "양파", ex: "1개 약 110g", g: 110, s: 1, pl: ["¼개", "½개", "1개 다"] },
      { k: "powder", icon: "🧂", name: "가루·말린 것", ex: "마늘가루 등", fixed: true },
      { k: "dish", icon: "🍲", name: "양파·마늘 든 음식", ex: "찌개·반찬 등", unknown: true },
    ],
    wsrc: "마늘 1쪽 3g, 양파 1개 110g은 USDA 표준 분량이에요.",
    subs: [["양파·파·부추", 1], ["마늘", 5], ["가루·말린 것", "powder"]],
    agent: "양파로 환산한 양", ref: "증상 기준 1kg당 15g부터",
    hint: "마늘은 양파보다 3~5배 독해서 5배로 계산해요. 익히거나 말려도 독성이 남아요 (Merck).",
  },
  macadamia: { icon: "🥜", name: "마카다미아", tile: "마카다미아", unit: "알", uwKind: "g", defMode: "count", unitFix: 2.8, subs: null, agent: "마카다미아", ref: "증상 기준 1kg당 0.7g부터", hint: "" },
};

export type CalcState = {
  item: string | null;
  portion: number | "n" | "unknown" | null;
  food: string | null;
  sub: number | null;
  mode: Mode;
  count: number;
  grams: number;
  unitW: number | null;
  cacao: number | null;
  unknownAmt: boolean;
  ate: number | "custom";
  ateCustom: string;
  wOverride: Record<string, number>;
};
export const calc: CalcState = {
  item: null, portion: null, food: null, sub: null, mode: null, count: 0, grams: 0, unitW: null, cacao: null,
  unknownAmt: false, ate: 0, ateCustom: "", wOverride: {},
};
export const unitOf = (f: Food, c: Partial<CalcState> = calc) => (c.food === "allium" && c.sub === 1 ? "쪽" : f.unit);
export const calcPet = (): Pet & { weightTemp?: boolean } => {
  const p = pet();
  const o = calc.wOverride[p.key];
  return o ? { ...p, weight: o, weightTemp: true } : p;
};
export const curItem = (c: Partial<CalcState> = calc): Item | null => {
  const f = c.food ? CALC[c.food] : null;
  return f && f.items && c.mode === "item" ? f.items.find((x) => x.k === c.item) || null : null;
};
export const PL = ["¼ · 한두 입", "½ · 반 개", "1개 다"];

// ---------- 입력 ----------
export function pickFood(k: string) {
  const f = CALC[k];
  Object.assign(calc, { food: k, sub: k === "grapes-raisins" ? 0 : null, mode: f.defMode, count: 0, grams: 0, unitW: null, cacao: null, unknownAmt: false, item: null, portion: null });
  bump();
}
export function pickSub(i: number) { calc.sub = i; bump(); }
export function setMode(m: Mode) {
  calc.mode = m; calc.unknownAmt = false;
  if (m === "gram" && calc.food && CALC[calc.food].items) calc.sub = null;
  bump();
}
export function setItem(k: string) {
  const it = CALC[calc.food!].items!.find((x) => x.k === k)!;
  if (it.detail) { setMode("gram"); return; }
  Object.assign(calc, { item: k, portion: null, count: 0, unknownAmt: false });
  bump();
}
export function setPortion(v: CalcState["portion"]) {
  calc.portion = v; calc.unknownAmt = v === "unknown";
  if (v !== "n") calc.count = 0;
  bump();
}
export function setItemCount(v: string | number) { calc.count = +v > 0 ? +v : 0; calc.unknownAmt = false; bump(); }
export function setAmount(v: string | number) {
  const n = Math.max(0, +v || 0);
  if (calc.mode === "count") calc.count = n; else calc.grams = n;
  calc.unknownAmt = false; bump();
}
export function stepAmount(d: number) {
  const step = calc.mode === "count" ? 1 : calc.food === "xylitol" ? 100 : 5;
  setAmount(+((calc.mode === "count" ? calc.count : calc.grams) + d * step).toFixed(2));
}
export function setUnknownAmt() { calc.unknownAmt = true; bump(); }
export function setAte(m: CalcState["ate"]) { calc.ate = m; bump(); }
export function setTempWeight(v: string | number) {
  const p = pet();
  const n = +v;
  if (n && (n < 0.5 || n > 100)) { showToast("몸무게는 0.5~100kg 사이로 넣어 주세요."); bump(); return; }
  if (n > 0 && n !== +p.weight) calc.wOverride[p.key] = n; else delete calc.wOverride[p.key];
  bump();
}
export function openCalcWith(food: string, mode: Mode, amount: number, petKey?: string, sub?: number | null, cacao?: number | null) {
  if (petKey) state.pet = petKey;
  pickFood(food);
  if (CALC[food].items && mode !== "gram") calc.mode = "item"; // "3조각"은 무엇인지 그림에서 고르게 한다
  else Object.assign(calc, { mode, count: mode === "count" ? amount : 0, grams: mode === "gram" ? amount : 0 });
  if (sub !== undefined && sub !== null) calc.sub = sub;
  if (cacao) calc.cacao = cacao;
  calc.ate = 0; calc.ateCustom = "";
  state.chatOpen = false; state.tab = "calc"; state.calcScrollTop++;
  bump();
}

// ---------- 계산 ----------
// level: 0 입력 기다림(need), 1 병원에 전화해 물어보기, 2 병원 가기, 3 응급, -1 몸무게 없음, -2 계산할 수 없음
// num 의 **값** 은 굵게 보여 줄 부분이다.
export type CalcResult = { level: number; need: string; needSub?: string; band: string; num: string; why: string; breed: string; note: string; hit?: number };
export function computeCalc(c: Partial<CalcState>, p: any): CalcResult {
  const R = (o: Partial<CalcResult>): CalcResult => Object.assign({ level: 0, need: "", band: "", num: "", why: "", breed: "", note: "" }, o);
  if (!c.food) return R({ need: "무엇을 먹었는지 골라 주세요" });
  const f = CALC[c.food], w = +p.weight, isGrape = c.food === "grapes-raisins";
  // 포도·건포도는 양·몸무게와 관계없이 응급 (Cortinovis 2016)
  if (isGrape) return R({ level: 3, band: "먹은 양과 관계없이 응급이에요. 지금 바로 동물병원에 연락하세요.", why: "포도·건포도는 먹은 양과 관계없이 문제가 될 수 있어요(Cortinovis 2016)." });
  if (!(w > 0)) return R({ level: -1 });
  const powder = () => addBreed(R({ level: 2, band: "가루·말린 것은 농축돼 있어 계산할 수 없어요. 바로 동물병원에 가세요.", why: "Merck는 중독이 말린 조각·가루 같은 농축된 형태를 먹었을 때 가장 흔하다고 해요." }), p);
  const noAmt = (band: string) => addBreed(R({ level: -2, band }), p);
  let s: any, qty = 0, itm: Item | null = null;
  if (f.items && c.mode !== "gram") {
    // 그림으로 고르기: 제품(또는 마늘·양파) × 분량
    if (!c.item) return R({ need: `${f.itemQ} 먹었는지 골라 주세요` });
    itm = f.items.find((x) => x.k === c.item)!;
    if (itm.fixed) return powder();
    if (itm.unknown) return noAmt("음식에 든 양은 알 수 없어 계산할 수 없어요. 병원에 전화해서 먹은 음식과 시각을 말해 주세요.");
    if (c.unknownAmt) return noAmt("양을 모르면 계산할 수 없어요. 병원에 전화해서 먹은 것과 시각을 말해 주세요.");
    if (itm.unit) {
      if (!((c.count || 0) > 0)) return R({ need: `몇 ${itm.unit} 먹었는지 골라 주세요` });
      qty = c.count! * itm.g!;
    } else {
      if (c.portion === null || c.portion === undefined) return R({ need: "얼마나 먹었는지 골라 주세요" });
      if (c.portion === "n" && !((c.count || 0) > 0)) return R({ need: "모두 몇 개 먹었는지 넣어 주세요" });
      qty = itm.g! * (c.portion === "n" ? c.count! : (c.portion as number));
    }
    s = itm.s;
  } else {
    if (f.subs && (c.sub === null || c.sub === undefined)) return R({ need: `어떤 ${f.name.split(" ")[0]}인지 골라 주세요` });
    s = f.subs ? f.subs[c.sub!][1] : undefined;
    if (s === null) return R({ level: -2, band: "종류를 모르면 계산할 수 없어요. 병원에 전화해서 먹은 양을 말해 주세요." });
    if (c.food === "allium" && s === "powder") return powder();
    if (c.food === "xylitol" && c.unknownAmt) return R({ level: 3, band: "양을 모르면 위험한 양일 수 있어요. 지금 바로 병원에 연락하세요.", why: "자일리톨 양을 몰라 계산할 수 없어요." });
    if (c.unknownAmt) return noAmt("양을 모르면 계산할 수 없어요. 병원에 전화해서 먹은 것과 시각을 말해 주세요.");
    const amount = c.mode === "count" ? c.count || 0 : c.grams || 0;
    if (!(amount > 0)) return R({ need: c.mode === "count" ? `몇 ${unitOf(f, c)} 먹었는지 넣어 주세요` : "얼마나 먹었는지 넣어 주세요" });
    const uw = f.unitFix || c.unitW;
    if (c.food === "xylitol" && c.mode === "count" && !uw) return R({ level: 3, band: "함량을 모르면 위험한 양일 수 있어요. 지금 바로 병원에 연락하세요.", why: "자일리톨 함량을 몰라 계산할 수 없어요." });
    if (c.mode === "count" && !uw) return R({ need: `1${unitOf(f, c)} 무게를 넣어 주세요` });
    if (c.food === "chocolate" && s === "cacao" && !((c.cacao || 0) > 0)) return R({ need: "카카오 %를 넣어 주세요" });
    qty = c.mode === "count" ? c.count! * uw! : c.grams!;
  }
  const est = itm || (f.unitFix && c.mode === "count") ? ` (약 ${+qty.toFixed(1)}g으로 계산)` : "";
  const per = (v: number, u: string, d: number) => `몸무게 1kg당 약 **${v.toFixed(d)}${u}**${est}`;
  if (c.food === "chocolate") {
    const mgkg = (qty * (s === "cacao" ? (15.5 * c.cacao!) / 100 : s)) / w;
    const level = mgkg >= 40 ? 3 : mgkg >= 20 ? 2 : 1;
    return R({
      level, num: per(mgkg, "mg", 1), hit: mgkg >= 60 ? 2 : mgkg >= 40 ? 1 : mgkg >= 20 ? 0 : -1,
      band: ["", "증상 기준(몸무게 1kg당 20mg)보다 적지만 안전하다는 뜻은 아니에요. 병원에 전화해 물어보세요.", "바로 동물병원에 가세요.", "지금 바로 응급 동물병원으로 가세요."][level],
      why: ["", "Merck 기준 가벼운 증상(20 mg/kg)보다 적어요.", "가벼운 증상(구토·설사)이 보고된 용량이에요(20 mg/kg 이상).", "심장 독성(40~50)·경련(60 mg/kg 이상)이 보고된 용량이에요."][level]
        + (itm && itm.upper ? " 과자 전체를 밀크 초콜릿(2.3 mg/g)으로 보고 계산해 실제보다 높게 나올 수 있어요." : itm ? " 밀크 초콜릿(Merck 2.3 mg/g)으로 계산했어요." : ""),
    });
  }
  if (c.food === "xylitol") {
    const mgkg = qty / w, level = mgkg >= 30 ? 3 : 2;
    return R({
      level, num: per(mgkg, "mg", 0), hit: mgkg >= 500 ? 1 : mgkg >= 100 ? 0 : mgkg >= 30 ? 2 : -1,
      band: level === 2 ? "저혈당 기준(몸무게 1kg당 30mg)보다 적지만 바로 병원에 연락하세요." : "지금 바로 응급 동물병원으로 가세요.",
      why: level === 2 ? "저혈당이 보고된 가장 낮은 양(30 mg/kg)보다 적어요." : mgkg >= 500 ? "심한 간 손상이 보고된 용량(500 mg/kg 초과)이에요." : "저혈당이 보고된 용량이에요(30 mg/kg 이상).",
    });
  }
  if (c.food === "allium") {
    const eq = (qty * s) / w, level = eq >= 15 ? 3 : 1;
    const r = R({
      level, num: per(eq, "g", 1), hit: eq >= 15 ? 0 : -1,
      band: level === 3 ? "지금 바로 동물병원으로 가세요." : "증상 기준보다 적지만 빈혈은 3~5일 뒤에 나타나요. 병원에 전화해 물어보세요.",
      why: level === 3 ? "증상이 보고된 용량이에요(생양파 15~30 g/kg)." : "증상이 보고된 용량(생양파 15 g/kg)보다 적어요. 며칠간 잇몸 색과 기운을 살펴 주세요.",
      note: "국립축산과학원 자료에서는 통마늘을 매일 7일간(체중 1kg당 5g 상당) 먹인 경우에도 독성이 보고됐어요.",
    });
    return addBreed(r, p);
  }
  const gkg = qty / w, level = gkg >= 0.7 ? 2 : 1; // macadamia
  return R({
    level, num: per(gkg, "g", 2), hit: gkg >= 2.4 ? 0 : gkg >= 0.7 ? 1 : -1,
    band: level === 1 ? "증상 기준(몸무게 1kg당 0.7g)보다 적지만 안전하다는 뜻은 아니에요. 병원에 전화해 물어보세요." : "바로 동물병원에 가세요.",
    why: level === 1 ? "보고된 가장 낮은 증상 용량(0.7 g/kg)보다 적어요." : "증상이 보고된 용량이에요(0.7 g/kg 이상, Merck는 2.4 g/kg에서 증상 보고).",
  });
}
function addBreed(r: CalcResult, p: any) {
  const bs = D.breed_sensitivities.find((b: any) => b.toxic_id === "allium" && J.breedMatch(b.breeds_ko, p.breed));
  if (bs) {
    if (r.level < 2) { r.level = 2; r.band = `${josa(p.breed, "은/는")} 양파에 더 약한 품종이에요. 바로 동물병원에 가세요.`; }
    r.breed = `${p.breed}: ${bs.message}`;
  }
  return r;
}
export const LTITLE = ["무엇을, 얼마나 먹었는지 골라 주세요", "병원에 전화해 물어보기", "병원 가기", "응급"];
export const BUBBLE = [["🐶", "어떤 걸 먹었는지 알려 주세요 🐾"], ["🐕", "괜찮다는 뜻은 아니에요. 병원에 전화해 봐 주세요!"], ["🥺", "병원에 같이 가 주세요!"], ["😭", "지금 바로 응급 병원으로 가요!"]];
export const LNAME = ["판정 전", "병원에 전화해 물어보기", "병원 가기", "응급"];
export const plain = (s: string) => s.replace(/\*\*/g, "");

export function ateText() {
  if (calc.ate === "custom") return calc.ateCustom ? `${calc.ateCustom}쯤` : "시각 입력 필요";
  const d = new Date(Date.now() - calc.ate * 60000),
    hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return calc.ate ? `${calc.ate >= 60 ? calc.ate / 60 + "시간" : calc.ate + "분"} 전 (${hm}쯤)` : `방금 (${hm}쯤)`;
}
export function amountText(f: Food) {
  if (calc.unknownAmt) return "양 모름";
  const itm = curItem();
  if (calc.mode === "item") {
    if (!itm || itm.fixed || itm.unknown) return "";
    const g = itm.unit ? calc.count * itm.g! : itm.g! * (calc.portion === "n" ? calc.count : (calc.portion as number));
    const lb = itm.unit ? `${calc.count}${itm.unit}` : calc.portion === "n" ? `${calc.count}개` : (itm.pl || ["¼개", "½개", "1개"])[[0.25, 0.5, 1].indexOf(calc.portion as number)];
    return g > 0 ? `${lb} (약 ${+g.toFixed(1)}g)` : "양 모름";
  }
  const n = calc.mode === "count" ? calc.count : calc.grams;
  if (!(n > 0)) return "양 모름";
  return calc.mode === "count"
    ? `${n}${unitOf(f)}${calc.unitW && calc.food !== "grapes-raisins" ? ` (1${unitOf(f)} ${calc.unitW}${f.uwKind})` : ""}`
    : `${n}${f.gramUnit || "g"}`;
}
export function subText(f: Food) {
  const itm = curItem();
  if (calc.mode === "item") return itm ? itm.name + (itm.g && !itm.unit && itm.k !== "onion" ? ` ${itm.g}g짜리` : "") : f.name;
  if (!f.subs || calc.sub === null) return f.name;
  const s = f.subs[calc.sub];
  return s[1] === "cacao" ? `다크 초콜릿 (카카오 ${calc.cacao ?? "?"}%)` : calc.food === "chocolate" ? s[0] + " 초콜릿" : s[0];
}

// ---------- 먹은 기록 ----------
export type HistoryItem = { key: string; icon: string; pet: string; w: number | string; what: string; num: string; ate: string; lv: number };
export const history: HistoryItem[] = [];
const savedKeys = new Set<string>();
export function saveIntake() {
  const f = CALC[calc.food!], p = calcPet(), r = computeCalc(calc, p), lv = r.level;
  if (!(lv >= 1 || lv === -2)) { showToast(lv === -1 ? "몸무게를 먼저 넣어 주세요." : r.need || "먹은 음식과 양을 먼저 골라 주세요."); return; }
  const key = [p.key, p.weight, calc.food, calc.sub, calc.cacao, calc.unitW, calc.mode, calc.item, calc.portion, calc.count, calc.grams, calc.unknownAmt, ateText()].join("|");
  if (savedKeys.has(key)) { showToast("이미 저장한 기록이에요."); return; }
  savedKeys.add(key);
  history.unshift({ key, icon: f.icon, pet: p.name, w: p.weight, what: `${subText(f)} ${amountText(f)}`, num: plain(r.num), ate: ateText(), lv });
  showToast("먹은 기록을 남겼어요.");
}
/** 로그아웃할 때 화면에 남은 먹은 기록을 비운다. */
export function clearHistory() { history.length = 0; savedKeys.clear(); }
export function delHistory(i: number) { savedKeys.delete(history[i].key); history.splice(i, 1); bump(); }
