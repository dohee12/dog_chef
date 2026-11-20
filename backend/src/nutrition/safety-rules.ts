// 강아지에게 위험하거나 조심해야 할 재료 규칙.
// "안전 보증"이 아니라 아래 목록에 걸리는 재료가 있는지만 본다. 목록에 없는 위험 재료는 못 잡는다.
// 앱(src/utils/ingredientSafety.ts)에 있던 규칙을 서버로 옮긴 것. 판정의 기준은 이제 서버다.

export type SafetyLevel = 'safe' | 'caution' | 'danger';

export interface Rule {
  label: string;
  reason: string;
  terms: string[]; // 재료 이름에 들어 있으면 걸린다
  exactTerms?: string[]; // 낱말 전체가 같을 때만 걸린다 ("파"가 "파프리카"에 걸리지 않게)
  except?: string[]; // 이 낱말이 들어 있으면 걸리지 않는다
}

export const DANGER_RULES: Rule[] = [
  { label: '포도·건포도', reason: '적은 양도 급성 신부전을 일으킬 수 있어요', terms: ['포도', '청포도', '샤인머스캣', '머스캣'], except: ['포도씨유'] },
  { label: '양파', reason: '적혈구를 망가뜨려 빈혈을 일으켜요 (익혀도 같아요)', terms: ['양파', '어니언'] },
  { label: '마늘', reason: '양파와 같은 파 종류라 빈혈을 일으켜요', terms: ['마늘', '갈릭'] },
  { label: '파·부추', reason: '양파와 같은 파 종류라 빈혈을 일으켜요', terms: ['대파', '쪽파', '실파', '파채', '부추', '리크', '차이브'], exactTerms: ['파'] },
  { label: '초콜릿·카카오', reason: '테오브로민 중독으로 구토, 경련이 올 수 있어요', terms: ['초콜릿', '초콜렛', '초코', '카카오', '코코아'] },
  { label: '자일리톨', reason: '혈당이 급히 떨어지고 간이 손상될 수 있어요', terms: ['자일리톨'] },
  { label: '마카다미아', reason: '힘이 빠지고 열이 나며 떨 수 있어요', terms: ['마카다미아'] },
  { label: '아보카도', reason: '페르신 성분과 큰 씨가 위험해요', terms: ['아보카도'] },
  { label: '술', reason: '알코올은 적은 양도 중독을 일으켜요', terms: ['맥주', '소주', '와인', '청주', '맛술', '미림', '알코올', '럼주'] },
  { label: '카페인', reason: '심장 박동이 빨라지고 떨 수 있어요', terms: ['커피', '에스프레소', '카페인'] },
];

export const CAUTION_RULES: Rule[] = [
  { label: '소금·짠 양념', reason: '강아지는 사람보다 훨씬 적은 염분이 필요해요', terms: ['소금', '간장', '된장', '고추장', '액젓', '젓갈', '굴소스'] },
  { label: '설탕·단맛', reason: '비만과 충치의 원인이 돼요', terms: ['설탕', '시럽', '올리고당', '물엿', '꿀'], except: ['무설탕', '꿀고구마', '꿀사과', '꿀호박'] },
  { label: '유제품', reason: '유당을 잘 못 삭여 설사할 수 있어요', terms: ['우유', '치즈', '버터', '생크림', '연유'], except: ['락토프리', '펫밀크', '강아지우유', '강아지 우유', '땅콩버터'] },
  { label: '가공육', reason: '염분과 지방이 많아요', terms: ['햄', '소시지', '베이컨', '육포'], except: ['햄버그'] },
  { label: '땅콩·견과류', reason: '지방이 많고, 땅콩버터는 자일리톨이 들었는지 확인해야 해요', terms: ['땅콩', '아몬드', '호두', '피스타치오', '캐슈'] },
  { label: '매운 양념', reason: '위장을 자극해요', terms: ['고춧가루', '고추', '후추', '와사비', '겨자', '카레'], except: ['파프리카'] },
  { label: '뼈', reason: '익힌 뼈는 쪼개져 목이나 장을 다치게 할 수 있어요', terms: ['뼈'], except: ['뼈 없는', '뼈없는', '순살'] },
];

/**
 * 알레르기 이름 → 재료 이름에서 찾을 낱말.
 * 앱(src/utils/allergyMappings.ts)의 표를 옮기면서, 한 글자 낱말("소", "닭", "면")은
 * 낱말 전체가 같을 때만 걸리게 바꿨다. ("소금"이 소고기 알레르기에, "면역"이 밀 알레르기에 걸리던 문제)
 */
export const ALLERGY_RULES: Record<string, Rule> = {
  닭고기: { label: '닭고기', reason: '', terms: ['닭', '치킨'], except: ['닭뼈육수'] },
  소고기: { label: '소고기', reason: '', terms: ['소고기', '쇠고기', '비프', '등심', '안심', '갈비', '우육', '사태', '양지'], exactTerms: ['소'], except: ['닭안심', '돼지갈비', '돼지 갈비', '돼지등심', '돼지 등심', '돼지안심'] },
  돼지고기: { label: '돼지고기', reason: '', terms: ['돼지', '포크', '삼겹살', '목살', '등갈비'] },
  계란: { label: '계란', reason: '', terms: ['달걀', '계란', '에그', '메추리알'] },
  우유: { label: '우유', reason: '', terms: ['우유', '밀크', '유제품', '치즈', '버터', '요구르트', '요거트'], except: ['땅콩버터', '코코넛밀크'] },
  밀: { label: '밀', reason: '', terms: ['밀가루', '글루텐', '빵', '국수', '파스타'], exactTerms: ['밀', '면'] },
  견과류: { label: '견과류', reason: '', terms: ['땅콩', '아몬드', '호두', '피스타치오', '캐슈'] },
  생선: { label: '생선', reason: '', terms: ['연어', '참치', '고등어', '대구', '명태', '황태', '북어', '멸치', '생선'] },
  콩: { label: '콩', reason: '', terms: ['두부', '대두', '콩가루', '병아리콩', '두유'], exactTerms: ['콩'] },
};

// "닭가슴살 100g" → "닭가슴살". 숫자로 시작하는 낱말(양)부터 뒤는 버린다.
export function ingredientName(raw: string): string {
  const words = raw.trim().split(/\s+/);
  const nameWords: string[] = [];
  for (const w of words) {
    if (/^[\d½¼¾]/.test(w)) break;
    nameWords.push(w);
  }
  return (nameWords.length ? nameWords : words).join(' ').replace(/\d.*$/, '').trim() || raw.trim();
}

export function matchesRule(name: string, rule: Rule): boolean {
  if (rule.except?.some((e) => name.includes(e))) return false;
  if (rule.terms.some((t) => name.includes(t))) return true;
  const words = name.split(/[\s,()/·_]+/);
  return !!rule.exactTerms?.some((t) => words.includes(t));
}

export interface SafetyHit {
  ingredient: string;
  label: string;
  reason: string;
  level: 'caution' | 'danger';
}

export function checkIngredient(raw: string): SafetyHit | null {
  const name = ingredientName(raw);
  const danger = DANGER_RULES.find((r) => matchesRule(name, r));
  if (danger) return { ingredient: raw, label: danger.label, reason: danger.reason, level: 'danger' };
  const caution = CAUTION_RULES.find((r) => matchesRule(name, r));
  if (caution) return { ingredient: raw, label: caution.label, reason: caution.reason, level: 'caution' };
  return null;
}

export function recipeSafety(ingredients: string[] | null | undefined) {
  const hits = (ingredients ?? []).map(checkIngredient).filter((h): h is SafetyHit => h !== null);
  const level: SafetyLevel = hits.some((h) => h.level === 'danger')
    ? 'danger'
    : hits.length
      ? 'caution'
      : 'safe';
  return { level, hits };
}

/** 이 알레르기 목록에 걸리는 재료들. 표에 없는 알레르기 이름은 그 낱말 자체로 찾는다. */
export function allergensIn(ingredients: string[] | null | undefined, allergies: string[] | null | undefined) {
  const found: { ingredient: string; allergy: string }[] = [];
  for (const raw of ingredients ?? []) {
    const name = ingredientName(raw);
    for (const allergy of allergies ?? []) {
      const rule = ALLERGY_RULES[allergy] ?? { label: allergy, reason: '', terms: [allergy] };
      if (matchesRule(name, rule)) {
        found.push({ ingredient: raw, allergy });
        break;
      }
    }
  }
  return found;
}
