// 영양 정보 데이터베이스 (100g 기준)
export interface NutritionInfo {
  calories: number; // 칼로리 (kcal)
  protein: number; // 단백질 (g)
  fat: number; // 지방 (g)
  carbs: number; // 탄수화물 (g)
  fiber: number; // 식이섬유 (g)
}

export const nutritionDatabase: { [key: string]: NutritionInfo } = {
  // 육류
  닭가슴살: { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
  닭고기: { calories: 239, protein: 27, fat: 14, carbs: 0, fiber: 0 },
  소고기: { calories: 250, protein: 26, fat: 15, carbs: 0, fiber: 0 },
  돼지고기: { calories: 242, protein: 27, fat: 14, carbs: 0, fiber: 0 },
  양고기: { calories: 294, protein: 25, fat: 21, carbs: 0, fiber: 0 },
  오리고기: { calories: 337, protein: 19, fat: 28, carbs: 0, fiber: 0 },

  // 생선
  연어: { calories: 208, protein: 20, fat: 13, carbs: 0, fiber: 0 },
  참치: { calories: 144, protein: 23, fat: 5, carbs: 0, fiber: 0 },
  고등어: { calories: 205, protein: 19, fat: 14, carbs: 0, fiber: 0 },
  대구: { calories: 82, protein: 18, fat: 0.7, carbs: 0, fiber: 0 },
  명태: { calories: 79, protein: 17, fat: 0.6, carbs: 0, fiber: 0 },

  // 곡물
  쌀: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4 },
  현미: { calories: 111, protein: 2.6, fat: 0.9, carbs: 23, fiber: 1.8 },
  귀리: { calories: 389, protein: 17, fat: 7, carbs: 66, fiber: 11 },
  퀴노아: { calories: 120, protein: 4.4, fat: 1.9, carbs: 21, fiber: 2.8 },

  // 채소
  고구마: { calories: 86, protein: 1.6, fat: 0.1, carbs: 20, fiber: 3 },
  감자: { calories: 77, protein: 2, fat: 0.1, carbs: 17, fiber: 2.1 },
  당근: { calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8 },
  브로콜리: { calories: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6 },
  시금치: { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
  호박: { calories: 26, protein: 1, fat: 0.1, carbs: 6.5, fiber: 0.5 },
  양배추: { calories: 25, protein: 1.3, fat: 0.1, carbs: 6, fiber: 2.5 },
  오이: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6, fiber: 0.5 },
  토마토: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },

  // 과일
  사과: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
  바나나: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6 },
  블루베리: { calories: 57, protein: 0.7, fat: 0.3, carbs: 14, fiber: 2.4 },
  딸기: { calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2 },
  수박: { calories: 30, protein: 0.6, fat: 0.2, carbs: 7.6, fiber: 0.4 },

  // 유제품
  요구르트: { calories: 59, protein: 3.5, fat: 0.4, carbs: 10, fiber: 0 },
  치즈: { calories: 402, protein: 25, fat: 33, carbs: 1.3, fiber: 0 },
  우유: { calories: 61, protein: 3.2, fat: 3.3, carbs: 4.8, fiber: 0 },

  // 달걀
  달걀: { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0 },
  계란: { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0 },

  // 콩류
  두부: { calories: 76, protein: 8, fat: 4.8, carbs: 1.9, fiber: 0.3 },
  병아리콩: { calories: 164, protein: 8.9, fat: 2.6, carbs: 27, fiber: 7.6 },

  // 기타
  올리브오일: { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0 },
  코코넛오일: { calories: 862, protein: 0, fat: 100, carbs: 0, fiber: 0 },
  참기름: { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0 },
};

// 재료명 정규화 (다양한 표현을 표준 이름으로 변환)
const ingredientAliases: { [key: string]: string } = {
  // 닭 관련
  닭: "닭고기",
  닭가슴: "닭가슴살",
  "닭 가슴살": "닭가슴살",
  "닭 고기": "닭고기",

  // 소 관련
  소: "소고기",
  "소 고기": "소고기",
  쇠고기: "소고기",

  // 돼지 관련
  돼지: "돼지고기",
  "돼지 고기": "돼지고기",

  // 생선 관련
  "참 치": "참치",
  "고 등어": "고등어",

  // 채소 관련
  "고 구마": "고구마",
  고구마: "고구마",
  "감 자": "감자",
  "당 근": "당근",
  "브 로콜리": "브로콜리",
  "시 금치": "시금치",

  // 과일 관련
  "사 과": "사과",
  "바 나나": "바나나",
  "블루 베리": "블루베리",
  "딸 기": "딸기",

  // 유제품
  "요 구르트": "요구르트",
  "치 즈": "치즈",
  "우 유": "우유",

  // 달걀
  "달 걀": "달걀",
  "계 란": "계란",
  계란노른자: "달걀",
  계란흰자: "달걀",
};

/**
 * 재료명을 정규화하여 표준 이름으로 변환
 */
export function normalizeIngredientName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  return ingredientAliases[trimmed] || trimmed;
}

/**
 * 재료 문자열에서 이름과 양을 파싱
 * 예: "닭가슴살 100g" → { name: "닭가슴살", amount: 100, unit: "g" }
 */
export function parseIngredient(ingredientStr: string): {
  name: string;
  amount: number;
  unit: string;
} | null {
  // 정규식: "재료명 숫자단위" 형태
  // 예: "닭가슴살 100g", "고구마 50그램", "쌀 2컵"
  const regex = /^(.+?)\s*(\d+(?:\.\d+)?)\s*(g|그램|kg|킬로그램|ml|밀리리터|컵|스푼|큰술|작은술)?$/i;
  const match = ingredientStr.trim().match(regex);

  if (!match) {
    return null;
  }

  const name = normalizeIngredientName(match[1]);
  let amount = parseFloat(match[2]);
  const unit = (match[3] || "g").toLowerCase();

  // 단위 환산 (모두 g 또는 ml로 변환)
  switch (unit) {
    case "kg":
    case "킬로그램":
      amount *= 1000;
      break;
    case "컵":
      amount *= 200; // 1컵 = 약 200g
      break;
    case "큰술":
      amount *= 15; // 1큰술 = 약 15g
      break;
    case "작은술":
      amount *= 5; // 1작은술 = 약 5g
      break;
    case "스푼":
      amount *= 15;
      break;
  }

  return {
    name,
    amount,
    unit: "g",
  };
}

/**
 * 재료명으로 영양 정보 조회
 */
export function getNutritionInfo(ingredientName: string): NutritionInfo | null {
  const normalized = normalizeIngredientName(ingredientName);
  return nutritionDatabase[normalized] || null;
}

/**
 * 재료 목록에 해당하는 모든 재료명 검색 (자동완성용)
 */
export function searchIngredients(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return Object.keys(nutritionDatabase).filter((name) =>
    name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 데이터베이스에 있는 모든 재료 목록
 */
export function getAllIngredients(): string[] {
  return Object.keys(nutritionDatabase);
}

