// 앱에 처음부터 들어 있던 재료 영양 값 (100g 기준). 앱(src/utils/nutritionDatabase.ts)에서 그대로 옮겼다.
// 출처가 적혀 있지 않던 값이라 응답에 source: 'builtin' 으로 표시한다.
// 식약처 API 키(MFDS_API_KEY)가 있으면 식약처 값을 먼저 쓰고, 못 찾을 때만 이 표를 쓴다.

export interface Per100g {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  calcium?: number | null; // mg
  phosphorus?: number | null; // mg
  sodium?: number | null; // mg
}

export const BUILTIN_FOODS: Record<string, Per100g> = {
  닭가슴살: { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
  닭고기: { calories: 239, protein: 27, fat: 14, carbs: 0, fiber: 0 },
  소고기: { calories: 250, protein: 26, fat: 15, carbs: 0, fiber: 0 },
  돼지고기: { calories: 242, protein: 27, fat: 14, carbs: 0, fiber: 0 },
  양고기: { calories: 294, protein: 25, fat: 21, carbs: 0, fiber: 0 },
  오리고기: { calories: 337, protein: 19, fat: 28, carbs: 0, fiber: 0 },
  연어: { calories: 208, protein: 20, fat: 13, carbs: 0, fiber: 0 },
  참치: { calories: 144, protein: 23, fat: 5, carbs: 0, fiber: 0 },
  고등어: { calories: 205, protein: 19, fat: 14, carbs: 0, fiber: 0 },
  대구: { calories: 82, protein: 18, fat: 0.7, carbs: 0, fiber: 0 },
  명태: { calories: 79, protein: 17, fat: 0.6, carbs: 0, fiber: 0 },
  쌀: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4 },
  현미: { calories: 111, protein: 2.6, fat: 0.9, carbs: 23, fiber: 1.8 },
  귀리: { calories: 389, protein: 17, fat: 7, carbs: 66, fiber: 11 },
  퀴노아: { calories: 120, protein: 4.4, fat: 1.9, carbs: 21, fiber: 2.8 },
  고구마: { calories: 86, protein: 1.6, fat: 0.1, carbs: 20, fiber: 3 },
  감자: { calories: 77, protein: 2, fat: 0.1, carbs: 17, fiber: 2.1 },
  당근: { calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8 },
  브로콜리: { calories: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6 },
  시금치: { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
  호박: { calories: 26, protein: 1, fat: 0.1, carbs: 6.5, fiber: 0.5 },
  양배추: { calories: 25, protein: 1.3, fat: 0.1, carbs: 6, fiber: 2.5 },
  오이: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6, fiber: 0.5 },
  토마토: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
  사과: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
  바나나: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6 },
  블루베리: { calories: 57, protein: 0.7, fat: 0.3, carbs: 14, fiber: 2.4 },
  딸기: { calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2 },
  수박: { calories: 30, protein: 0.6, fat: 0.2, carbs: 7.6, fiber: 0.4 },
  요구르트: { calories: 59, protein: 3.5, fat: 0.4, carbs: 10, fiber: 0 },
  치즈: { calories: 402, protein: 25, fat: 33, carbs: 1.3, fiber: 0 },
  우유: { calories: 61, protein: 3.2, fat: 3.3, carbs: 4.8, fiber: 0 },
  달걀: { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0 },
  계란: { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0 },
  두부: { calories: 76, protein: 8, fat: 4.8, carbs: 1.9, fiber: 0.3 },
  병아리콩: { calories: 164, protein: 8.9, fat: 2.6, carbs: 27, fiber: 7.6 },
  올리브오일: { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0 },
  코코넛오일: { calories: 862, protein: 0, fat: 100, carbs: 0, fiber: 0 },
  참기름: { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0 },
};

/** 같은 재료의 다른 이름 → 표준 이름 */
export const ALIASES: Record<string, string> = {
  닭: '닭고기',
  닭가슴: '닭가슴살',
  소: '소고기',
  쇠고기: '소고기',
  돼지: '돼지고기',
  계란노른자: '달걀',
  계란흰자: '달걀',
  달걀노른자: '달걀',
  달걀흰자: '달걀',
  단호박: '호박',
  애호박: '호박',
  요거트: '요구르트',
  백미: '쌀',
  밥: '쌀',
  오트밀: '귀리',
};

/** 띄어쓰기를 없애고 별칭을 표준 이름으로 바꾼다. "닭 가슴살" → "닭가슴살" */
export function normalizeName(name: string): string {
  const compact = name.trim().toLowerCase().replace(/\s+/g, '');
  return ALIASES[compact] ?? compact;
}

export function builtinLookup(name: string): { name: string; per100g: Per100g } | null {
  const n = normalizeName(name);
  const hit = BUILTIN_FOODS[n];
  return hit ? { name: n, per100g: hit } : null;
}

export function builtinSearch(query: string, limit = 20) {
  const q = normalizeName(query);
  if (!q) return [];
  return Object.entries(BUILTIN_FOODS)
    .filter(([name]) => name.includes(q))
    .slice(0, limit)
    .map(([name, per100g]) => ({ name, per100g }));
}

const UNIT_GRAMS: Record<string, number> = {
  g: 1,
  그램: 1,
  ml: 1, // 물·우유 기준으로 1ml ≈ 1g 로 본다
  밀리리터: 1,
  kg: 1000,
  킬로그램: 1000,
  컵: 200,
  큰술: 15,
  스푼: 15,
  작은술: 5,
};

/**
 * "닭가슴살 100g", "고구마 1/2컵", "쌀 2큰술" → { name, grams }
 * 양이 없거나 단위를 모르면 grams 가 null 이다 (영양 계산에서 빠진다).
 */
export function parseAmount(raw: string): { name: string; grams: number | null; reason?: string } {
  const text = raw.trim();
  const m = text.match(/^(.+?)\s*(\d+(?:\.\d+)?(?:\/\d+)?)\s*([a-zA-Z가-힣]*)\s*$/);
  if (!m) return { name: text, grams: null, reason: '양이 적혀 있지 않아요 (예: 닭가슴살 100g)' };

  const [, name, amountText, unitRaw] = m;
  const [num, den] = amountText.split('/').map(Number);
  const amount = den ? num / den : num;
  const unit = (unitRaw || 'g').toLowerCase();
  const per = UNIT_GRAMS[unit];
  if (!per) return { name: name.trim(), grams: null, reason: `'${unitRaw}' 단위는 무게로 바꿀 수 없어요 (g, ml, 컵, 큰술, 작은술)` };
  return { name: name.trim(), grams: amount * per };
}
