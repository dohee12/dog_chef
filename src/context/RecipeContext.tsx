import { supabase } from "@/lib/supabase";
import { Recipe, Review } from "@/types/Recipe";
import { mockRecipes } from "@/utils/mockData";
import { calculateTotalNutrition } from "@/utils/calculateNutritionFromIngredients";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

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
const RECIPE_TTL = 24 * 60 * 60 * 1000;

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const withComputedNutrition = (item: any) => {
  const hasNutrition = [item.calories, item.protein, item.fat, item.carbs, item.fiber].some(
    (value) => value !== undefined && value !== null
  );

  if (hasNutrition || !item.ingredients || item.ingredients.length === 0) {
    return item;
  }

  const nutrition = calculateTotalNutrition(item.ingredients);

  return {
    ...item,
    calories: Math.round(nutrition.calories * 100) / 100,
    protein: Math.round(nutrition.protein * 100) / 100,
    fat: Math.round(nutrition.fat * 100) / 100,
    carbs: Math.round(nutrition.carbs * 100) / 100,
    fiber: Math.round(nutrition.fiber * 100) / 100,
  };
};

export const RecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<string[]>(DEFAULT_INGREDIENTS);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const cutoffTime = new Date(Date.now() - RECIPE_TTL).toISOString();
      const { data: recipesData, error } = await supabase
        .from("recipes")
        .select("*")
        .gt("created_at", cutoffTime)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // [좋아요 상태 연동]
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let likedIds: number[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from("likes")
          .select("recipe_id")
          .eq("user_id", user.id);
        likedIds = likes?.map((l) => Number(l.recipe_id)) || [];
      }

      if (recipesData) {
        setRecipes(
          recipesData.map((item) => {
            const enriched = withComputedNutrition(item);
            return {
              ...enriched,
              id: Number(enriched.id),
              isLiked: likedIds.includes(Number(enriched.id)),
            };
          }) as Recipe[]
        );
      }
    } catch (error) {
      console.error("로드 실패:", error);
      setRecipes(mockRecipes);
    }
  };

  const loadPopularRecipes = async () => {
    try {
      const cutoffTime = new Date(Date.now() - RECIPE_TTL).toISOString();
      
      // 인기 점수 = (찜 수 × 2) + (리뷰 수 × 3) + (평균 평점 × 10)
      const { data: recipesData, error } = await supabase
        .from("recipes")
        .select("*")
        .gt("created_at", cutoffTime)
        .order("likes_count", { ascending: false })
        .order("reviews_count", { ascending: false })
        .order("average_rating", { ascending: false })
        .limit(20);

      if (error) throw error;

      // [좋아요 상태 연동]
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let likedIds: number[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from("likes")
          .select("recipe_id")
          .eq("user_id", user.id);
        likedIds = likes?.map((l) => Number(l.recipe_id)) || [];
      }

      if (recipesData) {
        // 인기 점수 계산하여 정렬
        const recipesWithScore = recipesData.map((item) => {
          const enriched = withComputedNutrition(item);
          const popularityScore =
            (enriched.likes_count || 0) * 2 +
            (enriched.reviews_count || 0) * 3 +
            (enriched.average_rating || 0) * 10;

          return {
            ...enriched,
            id: Number(enriched.id),
            isLiked: likedIds.includes(Number(enriched.id)),
            popularityScore,
          };
        });

        // 인기 점수로 재정렬
        recipesWithScore.sort((a, b) => b.popularityScore - a.popularityScore);

        setRecipes(recipesWithScore as Recipe[]);
      }
    } catch (error) {
      console.error("인기 레시피 로드 실패:", error);
      setRecipes(mockRecipes);
    }
  };

  const addRecipe = async (recipeData: Omit<Recipe, "id">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("로그인 필요", "레시피를 작성하려면 로그인이 필요합니다.");
        return;
      }

      // 재료 배열에서 영양 정보 계산
      let nutritionData = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
      };

      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        const nutrition = calculateTotalNutrition(recipeData.ingredients);
        
        if (nutrition.missingIngredients.length > 0) {
          console.warn("영양 정보를 찾을 수 없는 재료:", nutrition.missingIngredients);
        }

        nutritionData = {
          calories: Math.round(nutrition.calories * 100) / 100,
          protein: Math.round(nutrition.protein * 100) / 100,
          fat: Math.round(nutrition.fat * 100) / 100,
          carbs: Math.round(nutrition.carbs * 100) / 100,
          fiber: Math.round(nutrition.fiber * 100) / 100,
        };
      }

      const { data, error } = await supabase
        .from("recipes")
        .insert([
          {
            ...recipeData,
            ...nutritionData,
            user_id: user.id,
            is_user_created: true,
            likes_count: 0,
            reviews_count: 0,
            average_rating: 0,
          },
        ])
        .select();

      if (error) {
        console.error("레시피 등록 실패:", error);
        if (error.code === "42501") {
          Alert.alert(
            "권한 오류",
            "Supabase RLS 정책이 설정되지 않았습니다.\n\n'Supabase_RLS_설정.sql' 파일을 실행하세요."
          );
        } else {
          Alert.alert("실패", `레시피 등록에 실패했습니다: ${error.message}`);
        }
        return;
      }

      Alert.alert("성공", "레시피가 등록되었습니다.");
      await loadRecipes();
    } catch (error: any) {
      console.error("레시피 등록 실패:", error);
      Alert.alert("실패", `레시피 등록 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const updateRecipe = async (id: number, recipeData: Partial<Recipe>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("로그인 필요", "레시피를 수정하려면 로그인이 필요합니다.");
        return;
      }

      // 재료가 변경되었다면 영양 정보 재계산
      let nutritionData: Partial<Recipe> = {};
      
      // 기존 레시피 정보 가져오기
      const existingRecipe = recipes.find((r) => r.id === id);
      const ingredientsToUse = recipeData.ingredients || existingRecipe?.ingredients || [];

      if (ingredientsToUse.length > 0) {
        const nutrition = calculateTotalNutrition(ingredientsToUse);
        
        if (nutrition.missingIngredients.length > 0) {
          console.warn("영양 정보를 찾을 수 없는 재료:", nutrition.missingIngredients);
        }

        nutritionData = {
          calories: Math.round(nutrition.calories * 100) / 100,
          protein: Math.round(nutrition.protein * 100) / 100,
          fat: Math.round(nutrition.fat * 100) / 100,
          carbs: Math.round(nutrition.carbs * 100) / 100,
          fiber: Math.round(nutrition.fiber * 100) / 100,
        };
      }

      const { error } = await supabase
        .from("recipes")
        .update({
          ...recipeData,
          ...nutritionData,
        })
        .eq("id", id)
        .eq("user_id", user.id); // 자신의 레시피만 수정 가능

      if (error) {
        console.error("레시피 수정 실패:", error);
        if (error.code === "42501") {
          Alert.alert(
            "권한 오류",
            "이 레시피를 수정할 권한이 없습니다."
          );
        } else {
          Alert.alert("실패", `레시피 수정에 실패했습니다: ${error.message}`);
        }
        return;
      }

      await loadRecipes();
      Alert.alert("성공", "레시피가 수정되었습니다.");
    } catch (error: any) {
      console.error("레시피 수정 실패:", error.message);
      Alert.alert("실패", "레시피 수정에 실패했습니다");
    }
  };

  const deleteRecipe = async (id: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("로그인 필요", "레시피를 삭제하려면 로그인이 필요합니다.");
        return;
      }

      Alert.alert(
        "레시피 삭제",
        "정말로 이 레시피를 삭제하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: async () => {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // 자신의 레시피만 삭제 가능

      if (error) {
        console.error("레시피 삭제 실패:", error);
        if (error.code === "42501") {
          Alert.alert(
            "권한 오류",
            "이 레시피를 삭제할 권한이 없습니다."
          );
        } else {
          Alert.alert("실패", `레시피 삭제에 실패했습니다: ${error.message}`);
        }
        return;
      }

      await loadRecipes();
      Alert.alert("성공", "레시피가 삭제되었습니다.");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("레시피 삭제 실패:", error.message);
      Alert.alert("실패", "레시피 삭제에 실패했습니다");
    }
  };

  const toggleLike = async (id: number | string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return alert("로그인이 필요합니다.");

      const isLiked = recipes.find((r) => r.id === id)?.isLiked;

      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", id);
      } else {
        await supabase
          .from("likes")
          .insert([{ user_id: user.id, recipe_id: id, device_id: "mobile" }]);
      }

      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isLiked: !isLiked } : r))
      );
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  const addIngredient = (ing: string) => {
    if (!ingredients.includes(ing)) setIngredients([...ingredients, ing]);
  };

  const addReview = async (
    recipeId: number | string,
    review: Omit<Review, "id">
  ) => {
    // 이 함수는 더 이상 사용하지 않습니다.
    // ReviewContext의 addReview를 사용하세요.
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
