import { ApiError, api, getCurrentUser, onAuthChange, toRemoteImage } from "@/lib/api";
import { confirmAsync, notify } from "@/lib/dialog";
import { Recipe, Review } from "@/types/Recipe";
import { calculateTotalNutrition } from "@/utils/calculateNutritionFromIngredients";
import { mockRecipes } from "@/utils/mockData";
import React, { createContext, useContext, useEffect, useState } from "react";

interface RecipeContextType {
  recipes: Recipe[];
  ingredients: string[];
  addRecipe: (recipe: Omit<Recipe, "id">) => Promise<void>;
  updateRecipe: (id: number, recipe: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
  toggleLike: (id: number | string) => Promise<void>;
  addIngredient: (ingredient: string) => void;
  loadRecipes: () => Promise<void>;
  loadPopularRecipes: () => Promise<void>;
  addReview: (
    recipeId: number | string,
    review: Omit<Review, "id">
  ) => Promise<void>;
}

const DEFAULT_INGREDIENTS = ["닭가슴살", "고구마", "연어", "당근", "브로콜리"];

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const round2 = (n: number) => Math.round(n * 100) / 100;

/** 재료 목록으로 영양 정보를 계산한다. 모르는 재료는 경고만 남긴다. */
const nutritionFrom = (ingredients: string[]) => {
  const n = calculateTotalNutrition(ingredients);
  if (n.missingIngredients.length > 0) {
    console.warn("영양 정보를 찾을 수 없는 재료:", n.missingIngredients);
  }
  return {
    calories: round2(n.calories),
    protein: round2(n.protein),
    fat: round2(n.fat),
    carbs: round2(n.carbs),
    fiber: round2(n.fiber),
  };
};

const withComputedNutrition = (item: any) => {
  const hasNutrition = [item.calories, item.protein, item.fat, item.carbs, item.fiber].some(
    (value) => value !== undefined && value !== null
  );
  if (hasNutrition || !item.ingredients || item.ingredients.length === 0) {
    return item;
  }
  return { ...item, ...nutritionFrom(item.ingredients) };
};

/**
 * 서버 응답을 화면들이 쓰는 Recipe 모양으로 맞춘다.
 * 카드/상세 화면은 rating, reviews, nutrition 을 읽는데 서버는
 * average_rating, reviews_count, 낱개 영양 필드로 준다. 없으면 화면이 통째로 죽는다.
 */
const toRecipe = (item: any): Recipe => {
  const r = withComputedNutrition(item);
  return {
    ...r,
    rating: Number(r.average_rating ?? r.rating ?? 0),
    reviews: Number(r.reviews_count ?? r.reviews ?? 0),
    review_list: r.review_list ?? [],
    ingredients: r.ingredients ?? [],
    instructions: r.instructions ?? [],
    tags: r.tags ?? [],
    nutrition: r.nutrition ?? {
      calories: r.calories ?? 0,
      protein: r.protein ?? 0,
      fat: r.fat ?? 0,
      carbs: r.carbs ?? 0,
      fiber: r.fiber ?? 0,
      calcium: 0,
      phosphorus: 0,
    },
  };
};

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : String(error);


export const RecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<string[]>(DEFAULT_INGREDIENTS);

  // 로그인/로그아웃 하면 찜 표시(isLiked)가 바뀌므로 다시 불러온다
  useEffect(() => {
    loadRecipes();
    return onAuthChange(() => {
      loadRecipes();
    });
  }, []);

  const fetchRecipes = async (query: string) => {
    try {
      const data = await api.get<any[]>(`/recipes?${query}`);
      setRecipes(data.map(toRecipe));
    } catch (error) {
      console.error("레시피 로드 실패:", error);
      setRecipes(mockRecipes);
    }
  };

  // 예전 코드는 최근 24시간 레시피만 보여 줘서 하루가 지나면 목록이 비었다. 이제 전부 보여 준다.
  const loadRecipes = () => fetchRecipes("sort=latest");

  // 인기 점수 = (찜 수 × 2) + (리뷰 수 × 3) + (평균 평점 × 10), 서버에서 정렬
  const loadPopularRecipes = () => fetchRecipes("sort=popular&limit=20");

  const addRecipe = async (recipeData: Omit<Recipe, "id">) => {
    if (!getCurrentUser()) {
      notify("로그인 필요", "레시피를 작성하려면 로그인이 필요합니다.");
      return;
    }
    try {
      await api.post("/recipes", {
        ...recipeData,
        image: await toRemoteImage(recipeData.image),
        ...(recipeData.ingredients?.length ? nutritionFrom(recipeData.ingredients) : {}),
      });
      notify("성공", "레시피가 등록되었습니다.");
      await loadRecipes();
    } catch (error) {
      console.error("레시피 등록 실패:", error);
      notify("실패", `레시피 등록에 실패했습니다: ${errorMessage(error)}`);
    }
  };

  const updateRecipe = async (id: number, recipeData: Partial<Recipe>) => {
    if (!getCurrentUser()) {
      notify("로그인 필요", "레시피를 수정하려면 로그인이 필요합니다.");
      return;
    }
    // 재료가 바뀌었을 수 있으니 영양 정보를 다시 계산한다
    const existing = recipes.find((r) => r.id === id);
    const ingredientsToUse = recipeData.ingredients || existing?.ingredients || [];
    try {
      await api.patch(`/recipes/${id}`, {
        ...recipeData,
        ...(recipeData.image !== undefined ? { image: await toRemoteImage(recipeData.image) } : {}),
        ...(ingredientsToUse.length ? nutritionFrom(ingredientsToUse) : {}),
      });
      await loadRecipes();
      notify("성공", "레시피가 수정되었습니다.");
    } catch (error) {
      console.error("레시피 수정 실패:", error);
      notify("실패", `레시피 수정에 실패했습니다: ${errorMessage(error)}`);
    }
  };

  const deleteRecipe = async (id: number) => {
    if (!getCurrentUser()) {
      notify("로그인 필요", "레시피를 삭제하려면 로그인이 필요합니다.");
      return;
    }
    const ok = await confirmAsync(
      "레시피 삭제",
      "정말로 이 레시피를 삭제하시겠습니까?",
      "삭제",
      true
    );
    if (!ok) return;
    try {
      await api.delete(`/recipes/${id}`);
      await loadRecipes();
      notify("성공", "레시피가 삭제되었습니다.");
    } catch (error) {
      console.error("레시피 삭제 실패:", error);
      notify("실패", `레시피 삭제에 실패했습니다: ${errorMessage(error)}`);
    }
  };

  const toggleLike = async (id: number | string) => {
    if (!getCurrentUser()) {
      notify("로그인이 필요합니다.");
      return;
    }
    const isLiked = recipes.find((r) => r.id === id)?.isLiked;
    try {
      const res = isLiked
        ? await api.delete<{ isLiked: boolean; likes_count: number }>(`/recipes/${id}/like`)
        : await api.post<{ isLiked: boolean; likes_count: number }>(`/recipes/${id}/like`);
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isLiked: res.isLiked, likes_count: res.likes_count } : r
        )
      );
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  const addIngredient = (ing: string) => {
    if (!ingredients.includes(ing)) setIngredients([...ingredients, ing]);
  };

  const addReview = async () => {
    // 더 이상 쓰지 않는다. ReviewContext 의 addReview 를 쓴다.
    console.warn("RecipeContext.addReview는 더 이상 사용되지 않습니다. ReviewContext.addReview를 사용하세요.");
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        ingredients,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleLike,
        addIngredient,
        loadRecipes,
        loadPopularRecipes,
        addReview,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (!context)
    throw new Error("useRecipe는 RecipeProvider 내에서 사용해야 합니다.");
  return context;
};
