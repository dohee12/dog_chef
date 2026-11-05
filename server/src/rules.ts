// 규칙 기반 안전성 검사.
// 알레르기·독성 판정은 LLM에 맡기지 않고 여기서 결정합니다. AI는 설명만 담당합니다.

// 알레르기 항목 → 재료명에 포함되면 해당 알레르기로 보는 키워드 목록.
// 앱의 기존 매핑에서 오탐이 나던 한 글자 키워드('소', '면')는 제거했습니다.
// ("소금"이 소고기로, "국수"가 밀로 잡히는 문제)
export const ALLERGY_KEYWORDS: Record<string, string[]> = {
  닭고기: ["닭", "치킨"],
  소고기: ["소고기", "비프", "우육", "등심", "안심", "갈비"],
  돼지고기: ["돼지", "삼겹살", "목살", "등갈비"],
  계란: ["달걀", "계란", "에그"],
  우유: ["우유", "치즈", "버터", "요구르트", "요거트", "유제품", "밀크"],
  밀: ["밀가루", "글루텐", "빵"],
  견과류: ["땅콩", "아몬드", "호두", "피스타치오", "캐슈넛"],
};

export interface ToxicRule {
  keyword: string;
  reason: string;
}

// 개에게 독성이 알려진 식재료 (ASPCA 등 공개 자료 기준의 대표 항목)
export const TOXIC_INGREDIENTS: ToxicRule[] = [
  { keyword: "포도", reason: "포도·건포도는 급성 신부전을 일으킬 수 있어요." },
  { keyword: "건포도", reason: "포도·건포도는 급성 신부전을 일으킬 수 있어요." },
  { keyword: "양파", reason: "양파는 적혈구를 손상시켜 빈혈을 일으킬 수 있어요." },
  { keyword: "대파", reason: "대파·쪽파 등 파류는 적혈구를 손상시켜 빈혈을 일으킬 수 있어요." },
  { keyword: "쪽파", reason: "대파·쪽파 등 파류는 적혈구를 손상시켜 빈혈을 일으킬 수 있어요." },
  { keyword: "마늘", reason: "마늘은 파속 식물로 적혈구 손상을 일으킬 수 있어요." },
  { keyword: "초콜릿", reason: "초콜릿·코코아의 테오브로민은 구토, 경련, 심장 문제를 일으킬 수 있어요." },
  { keyword: "코코아", reason: "초콜릿·코코아의 테오브로민은 구토, 경련, 심장 문제를 일으킬 수 있어요." },
  { keyword: "자일리톨", reason: "자일리톨은 급격한 저혈당과 간 손상을 일으킬 수 있어요." },
  { keyword: "카페인", reason: "카페인은 심장 박동 이상과 경련을 일으킬 수 있어요." },
  { keyword: "커피", reason: "커피의 카페인은 심장 박동 이상과 경련을 일으킬 수 있어요." },
  { keyword: "알코올", reason: "알코올은 중추신경과 간에 심각한 손상을 줄 수 있어요." },
  { keyword: "맥주", reason: "알코올은 중추신경과 간에 심각한 손상을 줄 수 있어요." },
  { keyword: "와인", reason: "알코올은 중추신경과 간에 심각한 손상을 줄 수 있어요." },
  { keyword: "마카다미아", reason: "마카다미아는 근력 저하와 구토를 일으킬 수 있어요." },
  { keyword: "아보카도", reason: "아보카도의 페르신은 구토와 설사를 일으킬 수 있어요." },
];

export interface PetProfile {
  name: string;
  allergies: string[];
}

export interface ToxicHit {
  ingredient: string;
  keyword: string;
  reason: string;
}

export interface AllergyHit {
  ingredient: string;
  petName: string;
  allergy: string;
}

export interface SafetyResult {
  // danger: 독성 식재료 포함 / warning: 반려견 알레르기 식재료 포함 / safe: 문제 없음
  status: "safe" | "warning" | "danger";
  toxic: ToxicHit[];
  allergic: AllergyHit[];
}

export function evaluateRecipeSafety(ingredients: string[], pets: PetProfile[] = []): SafetyResult {
  const toxic: ToxicHit[] = [];
  for (const ingredient of ingredients) {
    // "건포도"가 "포도"로 잡히지 않도록 가장 긴 키워드를 우선합니다.
    const hit = TOXIC_INGREDIENTS.filter((rule) => ingredient.includes(rule.keyword)).sort(
      (a, b) => b.keyword.length - a.keyword.length,
    )[0];
    if (hit) toxic.push({ ingredient, keyword: hit.keyword, reason: hit.reason });
  }

  const allergic: AllergyHit[] = [];
  for (const pet of pets) {
    for (const allergy of pet.allergies) {
      const keywords = ALLERGY_KEYWORDS[allergy] ?? [allergy];
      for (const ingredient of ingredients) {
        if (keywords.some((k) => ingredient.includes(k))) {
          allergic.push({ ingredient, petName: pet.name, allergy });
        }
      }
    }
  }

  const status = toxic.length > 0 ? "danger" : allergic.length > 0 ? "warning" : "safe";
  return { status, toxic, allergic };
}
