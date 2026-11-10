// 재료 이름으로 강아지에게 위험하거나 조심해야 할 재료를 찾는다.
// "안전 보증"이 아니라 아래 목록에 걸리는 재료가 있는지만 본다. 목록에 없는 위험 재료는 못 잡는다.
// 레시피에 저장된 safety_score(예시 데이터의 임의 숫자)는 쓰지 않고, 매번 재료로 다시 계산한다.

export type SafetyLevel = "safe" | "caution" | "danger";

interface Rule {
  label: string; // 화면에 보여줄 이름
  reason: string;
  terms: string[]; // 재료 이름에 들어 있으면 걸린다
  exactTerms?: string[]; // 낱말 전체가 같을 때만 걸린다 ("파"가 "파프리카"에 걸리지 않게)
  except?: string[]; // 이 낱말이 들어 있으면 걸리지 않는다
}

// 먹으면 중독될 수 있는 재료
const DANGER_RULES: Rule[] = [
  { label: "포도·건포도", reason: "적은 양도 급성 신부전을 일으킬 수 있어요", terms: ["포도", "청포도", "샤인머스캣", "머스캣"], except: ["포도씨유"] },
  { label: "양파", reason: "적혈구를 망가뜨려 빈혈을 일으켜요 (익혀도 같아요)", terms: ["양파", "어니언"] },
  { label: "마늘", reason: "양파와 같은 파 종류라 빈혈을 일으켜요", terms: ["마늘", "갈릭"] },
  { label: "파·부추", reason: "양파와 같은 파 종류라 빈혈을 일으켜요", terms: ["대파", "쪽파", "실파", "파채", "부추", "리크", "차이브"], exactTerms: ["파"] },
  { label: "초콜릿·카카오", reason: "테오브로민 중독으로 구토, 경련이 올 수 있어요", terms: ["초콜릿", "초콜렛", "초코", "카카오", "코코아"] },
  { label: "자일리톨", reason: "혈당이 급히 떨어지고 간이 손상될 수 있어요", terms: ["자일리톨"] },
  { label: "마카다미아", reason: "힘이 빠지고 열이 나며 떨 수 있어요", terms: ["마카다미아"] },
  { label: "아보카도", reason: "페르신 성분과 큰 씨가 위험해요", terms: ["아보카도"] },
  { label: "술", reason: "알코올은 적은 양도 중독을 일으켜요", terms: ["맥주", "소주", "와인", "청주", "맛술", "미림", "알코올", "럼주"] },
  { label: "카페인", reason: "심장 박동이 빨라지고 떨 수 있어요", terms: ["커피", "에스프레소", "카페인"] },
];

// 중독은 아니지만 양이나 손질에 따라 탈이 날 수 있는 재료
const CAUTION_RULES: Rule[] = [
  { label: "소금·짠 양념", reason: "강아지는 사람보다 훨씬 적은 염분이 필요해요", terms: ["소금", "간장", "된장", "고추장", "액젓", "젓갈", "굴소스"] },
  { label: "설탕·단맛", reason: "비만과 충치의 원인이 돼요", terms: ["설탕", "시럽", "올리고당", "물엿", "꿀"], except: ["무설탕", "꿀고구마", "꿀사과", "꿀호박"] },
  { label: "유제품", reason: "유당을 잘 못 삭여 설사할 수 있어요", terms: ["우유", "치즈", "버터", "생크림", "연유"], except: ["락토프리", "펫밀크", "강아지우유", "강아지 우유", "땅콩버터"] },
  { label: "가공육", reason: "염분과 지방이 많아요", terms: ["햄", "소시지", "베이컨", "육포"], except: ["햄버그"] },
  { label: "땅콩·견과류", reason: "지방이 많고, 땅콩버터는 자일리톨이 들었는지 확인해야 해요", terms: ["땅콩", "아몬드", "호두", "피스타치오", "캐슈"] },
  { label: "매운 양념", reason: "위장을 자극해요", terms: ["고춧가루", "고추", "후추", "와사비", "겨자", "카레"], except: ["파프리카"] },
  { label: "뼈", reason: "익힌 뼈는 쪼개져 목이나 장을 다치게 할 수 있어요", terms: ["뼈"], except: ["뼈 없는", "뼈없는", "순살"] },
];

export interface SafetyHit {
  ingredient: string;
  label: string;
  reason: string;
  level: "caution" | "danger";
}

export interface SafetyResult {
  level: SafetyLevel;
  hits: SafetyHit[];
}

// "닭가슴살 100g" → "닭가슴살". 숫자로 시작하는 낱말(양)부터 뒤는 버린다.
function ingredientName(raw: string): string {
  const words = raw.trim().split(/\s+/);
  const nameWords: string[] = [];
  for (const w of words) {
    if (/^[\d½¼¾]/.test(w)) break;
    nameWords.push(w);
  }
  return (nameWords.length ? nameWords : words).join(" ");
}

function matches(name: string, rule: Rule): boolean {
  if (rule.except?.some((e) => name.includes(e))) return false;
  if (rule.terms.some((t) => name.includes(t))) return true;
  const words = name.split(/[\s,()/·]+/);
  return !!rule.exactTerms?.some((t) => words.includes(t));
}

export function checkIngredient(raw: string): SafetyHit | null {
  const name = ingredientName(raw);
  const danger = DANGER_RULES.find((r) => matches(name, r));
  if (danger) return { ingredient: raw, label: danger.label, reason: danger.reason, level: "danger" };
  const caution = CAUTION_RULES.find((r) => matches(name, r));
  if (caution) return { ingredient: raw, label: caution.label, reason: caution.reason, level: "caution" };
  return null;
}

export function getRecipeSafety(ingredients: string[] | undefined): SafetyResult {
  const hits = (ingredients || [])
    .map(checkIngredient)
    .filter((h): h is SafetyHit => h !== null);
  const level: SafetyLevel = hits.some((h) => h.level === "danger")
    ? "danger"
    : hits.length > 0
    ? "caution"
    : "safe";
  return { level, hits };
}
