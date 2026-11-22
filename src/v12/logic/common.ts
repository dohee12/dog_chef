// 화면 여러 곳에서 쓰는 이름표·출처 표기 (목업 app.js 앞부분)
/* eslint-disable @typescript-eslint/no-explicit-any */
import { D, J } from "../store";

export const LV: Record<string, string> = { danger: "위험", caution: "주의", safe: "괜찮아요", unknown: "확인 안 됨" };
export const STATUS_NAME: Record<string, string> = { ok: "괜찮아요", caution: "주의", no: "안 돼요", unknown: "확인 안 됨" };

// [key, 아이콘, 이름]. 아이콘 "mci:" 는 MaterialCommunityIcons(선 아이콘 세트에 없는 고기·곡물)
export const CATS: [string, string, string][] = [
  ["poultry", "mci:food-drumstick-outline", "닭·오리"],
  ["meat", "mci:food-steak", "소·돼지·양"],
  ["fish", "fish-outline", "생선"],
  ["veg", "nutrition-outline", "채소·과일"],
  ["grain", "mci:barley", "곡물·고구마"],
  ["eggdairy", "egg-outline", "달걀·유제품"],
];
export const SEASON: Record<string, string> = { 봄: "🌸", 여름: "☀️", 가을: "🍂", 겨울: "❄️" };
export const SEASON_ICON: Record<string, string> = {
  봄: "flower-outline",
  여름: "sunny-outline",
  가을: "leaf-outline",
  겨울: "snow-outline",
};

// 첫 재료로 대표 재료 카테고리를 추천
export function suggestMain(ings: string[]) {
  for (const raw of ings) {
    const it = J.judgeIng(raw),
      ids = it.allergens.map((a: any) => a.id),
      rid = it.rule && it.rule.id;
    if (ids.includes("chicken") || rid === "duck") return "poultry";
    if (ids.some((x: string) => ["beef", "pork", "lamb"].includes(x))) return "meat";
    if (ids.includes("fish")) return "fish";
    if (ids.includes("egg") || ids.includes("dairy")) return "eggdairy";
    if (ids.some((x: string) => ["rice", "wheat", "corn"].includes(x)) || rid === "sweet-potato") return "grain";
    if (it.level === "safe") return "veg";
  }
  return null;
}

export function srcShort(id: string) {
  const s = D.sources[id] || {};
  if (s.authors) return s.authors.split(/[ ,]/)[0] + " " + (s.year || "");
  const pub = (s.publisher || "")
    .replace("농촌진흥청 ", "")
    .replace("American Society for the Prevention of Cruelty to Animals", "ASPCA")
    .replace(/^ASPCA Animal Poison Control.*$/, "ASPCA 독성센터");
  if (!pub) return (s.title || id).slice(0, 20);
  const tag = /국립축산과학원/.test(pub)
    ? /사료성분/.test(s.title || "")
      ? " 사료DB"
      : /표준/.test(s.title || "")
        ? " 영양표준"
        : ""
    : s.year
      ? " " + s.year
      : "";
  return (pub.replace(/ veterinary clinic.*$/i, "") + tag).slice(0, 26);
}
export const TIER: Record<string, string> = {
  A: "믿을 만한 연구·기준 (논문, Merck 수의 매뉴얼, 국가 영양표준)",
  B: "전문 기관·병원 자료 (수의 독성센터, 정부 기관, 동물병원 데이터)",
  C: "참고 기사 (일반 기사)",
};
// 출처 목록을 출처별로 묶고 인용문을 모은다
export function groupSources(evList: any[]) {
  const by: Record<string, string[]> = {};
  for (const e of evList || []) {
    if (!e || !e.source) continue;
    by[e.source] = by[e.source] || [];
    if (e.quote && !by[e.source].includes(e.quote)) by[e.source].push(e.quote);
  }
  return Object.entries(by).map(([sid, quotes]) => ({ sid, quotes, tier: (D.sources[sid] || {}).tier || "?" }));
}
export const labelOf = (list: any[], id: string) => ((list.find((x) => x.id === id) || {}).label || "").split(" (")[0];
export const uniq = <T>(a: T[]) => [...new Set(a)];
export const blockReason = (j: any) =>
  uniq(j.blocks.map((b: any) => (b.kind === "allergy" ? b.text : b.ing.n + " 위험"))).join(", ");
