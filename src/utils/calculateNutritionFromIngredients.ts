import {
  getNutritionInfo,
  NutritionInfo,
  parseIngredient,
} from "./nutritionDatabase";

/**
 * 재료 목록으로부터 전체 영양 정보 계산
 * @param ingredients 재료 배열 (예: ["닭가슴살 100g", "고구마 50g"])
 * @returns 합산된 영양 정보
 */
export function calculateTotalNutrition(
  ingredients: string[]
): NutritionInfo & { missingIngredients: string[] } {
  const total: NutritionInfo = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
  };

  const missingIngredients: string[] = [];

  ingredients.forEach((ingredientStr) => {
    // 재료 파싱
    const parsed = parseIngredient(ingredientStr);

    if (!parsed) {
      console.warn(`파싱 실패: ${ingredientStr}`);
      missingIngredients.push(ingredientStr);
      return;
    }

    // 영양 정보 조회
    const nutritionPer100g = getNutritionInfo(parsed.name);

    if (!nutritionPer100g) {
      console.warn(`영양 정보 없음: ${parsed.name}`);
      missingIngredients.push(parsed.name);
      return;
    }

    // 비율 계산 (100g 기준 → 실제 양)
    const ratio = parsed.amount / 100;

    // 합산
    total.calories += nutritionPer100g.calories * ratio;
    total.protein += nutritionPer100g.protein * ratio;
    total.fat += nutritionPer100g.fat * ratio;
    total.carbs += nutritionPer100g.carbs * ratio;
    total.fiber += nutritionPer100g.fiber * ratio;
  });

  // 소수점 둘째 자리까지 반올림
  Object.keys(total).forEach((key) => {
    total[key as keyof NutritionInfo] = Math.round(
      total[key as keyof NutritionInfo] * 100
    ) / 100;
  });

  return {
    ...total,
    missingIngredients,
  };
}

/**
 * 1인분당 영양 정보 계산
 * @param totalNutrition 전체 영양 정보
 * @param servings 인분 수
 * @returns 1인분 영양 정보
 */
export function calculatePerServing(
  totalNutrition: NutritionInfo,
  servings: number
): NutritionInfo {
  if (servings <= 0) servings = 1;

  return {
    calories: Math.round((totalNutrition.calories / servings) * 100) / 100,
    protein: Math.round((totalNutrition.protein / servings) * 100) / 100,
    fat: Math.round((totalNutrition.fat / servings) * 100) / 100,
    carbs: Math.round((totalNutrition.carbs / servings) * 100) / 100,
    fiber: Math.round((totalNutrition.fiber / servings) * 100) / 100,
  };
}

/**
 * 영양 정보를 읽기 쉬운 문자열로 변환
 */
export function formatNutritionInfo(nutrition: NutritionInfo): string {
  return `
칼로리: ${nutrition.calories} kcal
단백질: ${nutrition.protein} g
지방: ${nutrition.fat} g
탄수화물: ${nutrition.carbs} g
식이섬유: ${nutrition.fiber} g
  `.trim();
}

/**
 * 영양소 비율 계산 (단백질:지방:탄수화물)
 */
export function calculateMacroRatio(nutrition: NutritionInfo): {
  protein: number;
  fat: number;
  carbs: number;
} {
  const total = nutrition.protein + nutrition.fat + nutrition.carbs;

  if (total === 0) {
    return { protein: 0, fat: 0, carbs: 0 };
  }

  return {
    protein: Math.round((nutrition.protein / total) * 100),
    fat: Math.round((nutrition.fat / total) * 100),
    carbs: Math.round((nutrition.carbs / total) * 100),
  };
}

/**
 * 강아지 권장 칼로리 계산
 * @param weight 강아지 체중 (kg)
 * @param activityLevel 활동 수준 ("low" | "normal" | "high")
 * @returns 하루 권장 칼로리 (kcal)
 */
export function calculateDogDailyCalories(
  weight: number,
  activityLevel: "low" | "normal" | "high" = "normal"
): number {
  // RER (Resting Energy Requirement) = 70 × (체중^0.75)
  const rer = 70 * Math.pow(weight, 0.75);

  // 활동 계수
  const activityMultiplier = {
    low: 1.2, // 실내 생활, 노령견
    normal: 1.6, // 일반 성견
    high: 2.0, // 활동적인 강아지, 임신/수유견
  };

  const dailyCalories = rer * activityMultiplier[activityLevel];

  return Math.round(dailyCalories);
}

/**
 * 레시피가 강아지에게 적절한지 판단
 * @param nutrition 레시피 영양 정보
 * @param dogWeight 강아지 체중 (kg)
 * @returns 판단 결과 및 메시지
 */
export function evaluateRecipeForDog(
  nutrition: NutritionInfo,
  dogWeight: number
): {
  isAppropriate: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const dailyCalories = calculateDogDailyCalories(dogWeight);
  const caloriePercentage = (nutrition.calories / dailyCalories) * 100;

  // 칼로리 체크
  if (caloriePercentage > 50) {
    warnings.push(
      `이 레시피는 하루 권장 칼로리의 ${Math.round(caloriePercentage)}%입니다. 한 끼 식사로는 과다할 수 있습니다.`
    );
  } else if (caloriePercentage < 10) {
    recommendations.push(
      "간식 또는 보조 식단으로 적합합니다."
    );
  } else {
    recommendations.push(
      `하루 권장 칼로리의 약 ${Math.round(caloriePercentage)}%로 적절한 한 끼 식사입니다.`
    );
  }

  // 영양소 비율 체크
  const macroRatio = calculateMacroRatio(nutrition);

  // 단백질 비율 (이상적: 25-35%)
  if (macroRatio.protein < 20) {
    warnings.push("단백질 함량이 낮습니다. 닭가슴살이나 소고기를 추가해보세요.");
  } else if (macroRatio.protein > 40) {
    warnings.push("단백질 함량이 높습니다. 채소나 곡물을 추가해보세요.");
  } else {
    recommendations.push(`단백질 비율 ${macroRatio.protein}% - 적절합니다.`);
  }

  // 지방 비율 (이상적: 10-15%)
  if (macroRatio.fat > 25) {
    warnings.push("지방 함량이 높습니다. 체중 증가에 주의하세요.");
  }

  return {
    isAppropriate: warnings.length === 0,
    warnings,
    recommendations,
  };
}

