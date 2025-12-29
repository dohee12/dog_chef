import { supabase } from "@/lib/supabase";
import { Recipe, Review } from "@/types/Recipe";
import { mockRecipes } from "@/utils/mockData";
import React, { createContext, useContext, useEffect, useState } from "react";

interface RecipeContextType {
  recipes: Recipe[];
  ingredients: string[];
  addRecipe: (recipe: Omit<Recipe, "id">) => Promise<void>;
  toggleLike: (id: number | string) => Promise<void>;
  addIngredient: (ingredient: string) => void;
  loadRecipes: () => Promise<void>;
  addReview: (
    recipeId: number | string,
    review: Omit<Review, "id">
  ) => Promise<void>;
}

const DEFAULT_INGREDIENTS = ["닭가슴살", "고구마", "연어", "당근", "브로콜리"];
const RECIPE_TTL = 24 * 60 * 60 * 1000;

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

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
          recipesData.map((item) => ({
            ...item,
            id: Number(item.id),
            isLiked: likedIds.includes(Number(item.id)),
          })) as Recipe[]
        );
      }
    } catch (error) {
      console.error("로드 실패:", error);
      setRecipes(mockRecipes);
    }
  };

  const addRecipe = async (recipeData: Omit<Recipe, "id">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // [수정] 타입이 이미 Snake Case이므로 recipeData를 그대로 넣어도 됩니다.
      const { error } = await supabase.from("recipes").insert([
        {
          ...recipeData,
          user_id: user?.id || null,
          is_user_created: true,
        },
      ]);
      if (error) throw error;
      await loadRecipes();
    } catch (error: any) {
      console.error("레시피 등록 실패:", error.message);
      alert("레시피 등록에 실패했습니다");
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
    try {
      console.log(`${recipeId}번에 리뷰 추가`, review);
      setRecipes((prev) =>
        prev.map((r) =>
          Number(r.id) === Number(recipeId)
            ? {
                ...r,
                review_list: [review as Review, ...(r.review_list || [])],
              }
            : r
        )
      );
    } catch (error) {
      console.error("리뷰 추가 실패:", error);
    }
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        ingredients,
        addRecipe,
        toggleLike,
        addIngredient,
        loadRecipes,
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
