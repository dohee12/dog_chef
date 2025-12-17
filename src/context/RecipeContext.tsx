import { supabase } from "@/lib/supabase";
import { Recipe, Review } from "@/types/Recipe";
import { mockRecipes } from "@/utils/mockData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface RecipeContextType {
  recipes: Recipe[];
  ingredients: string[];
  addRecipe: (recipe: Omit<Recipe, "id">) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  toggleLike: (id: number) => void;
  addReview: (recipeId: number, review: Omit<Review, "id">) => void;
  addIngredient: (ingredient: string) => void;
  loadRecipes: () => Promise<void>;
}

const DEFAULT_INGREDIENTS = [
  "닭가슴살",
  "고구마",
  "연어",
  "바나나",
  "당근",
  "브로콜리",
  "계란",
  "우유",
  "단호박",
  "양배추",
  "시금치",
  "오리고기",
  "소고기",
  "황태",
  "오이",
  "파프리카",
  "사과",
  "블루베리",
  "토마토",
  "두부",
];

const RECIPE_TTL = 24 * 60 * 60 * 1000;

const RecipeContext = createContext<RecipeContextType>({
  recipes: [],
  ingredients: DEFAULT_INGREDIENTS,
  addRecipe: async () => {},
  updateRecipe: async () => {},
  toggleLike: () => {},
  addReview: () => {},
  addIngredient: () => {},
  loadRecipes: async () => {},
});

export const RecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<string[]>(DEFAULT_INGREDIENTS);

  useEffect(() => {
    loadRecipes();
    loadIngredients();
  }, []);

  const filterExpiredRecipes = (recipeList: Recipe[]) => {
    const now = new Date().getTime();
    return recipeList.filter((recipe) => {
      if (recipe.isUserCreated && recipe.createdDate) {
        const createdTime = new Date(recipe.createdDate).getTime();
        return now - createdTime < RECIPE_TTL;
      }
      return true;
    });
  };

  const loadRecipes = async () => {
    try {
      // DB 컬럼명(created_at)으로 정렬해야 함
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // DB 데이터(snake_case) -> 앱 데이터(camelCase) 변환
        const mappedRecipes: Recipe[] = data.map((item: any) => ({
          ...item,
          // DB엔 cook_time, 앱엔 cookTime
          cookTime: item.cook_time,
          // DB엔 created_at, 앱엔 createdDate
          createdDate: item.created_at,
          // DB엔 is_user_created, 앱엔 isUserCreated
          isUserCreated: item.is_user_created,
          // DB엔 safety_score, 앱엔 safetyScore
          safetyScore: item.safety_score,
          // 나머지(id, title, ingredients 등)는 이름 같음
        }));

        const validRecipes = filterExpiredRecipes(mappedRecipes);
        setRecipes(validRecipes);
      }
    } catch (error) {
      console.error("Failed to load recipes from Supabase:", error);
      // 에러 시 mockData 로드 (백업)
      setRecipes(mockRecipes);
    }
  };

  const loadIngredients = async () => {
    try {
      const storedIngredients = await AsyncStorage.getItem("customIngredients");
      if (storedIngredients) {
        const customIngredients = JSON.parse(storedIngredients);
        const merged = Array.from(
          new Set([...DEFAULT_INGREDIENTS, ...customIngredients])
        );
        setIngredients(merged);
      }
    } catch (error) {
      console.error("Failed to load ingredients", error);
    }
  };

  const addIngredient = async (newIngredient: string) => {
    if (ingredients.includes(newIngredient)) return;
    const newIngredients = [...ingredients, newIngredient];
    setIngredients(newIngredients);
    const customOnly = newIngredients.filter(
      (i) => !DEFAULT_INGREDIENTS.includes(i)
    );
    try {
      await AsyncStorage.setItem(
        "customIngredients",
        JSON.stringify(customOnly)
      );
    } catch (error) {
      console.error("Failed to save ingredient", error);
    }
  };

  const addRecipe = async (recipeData: Omit<Recipe, "id">) => {
    try {
      // 앱 데이터 -> DB 데이터(snake_case) 변환
      const newRecipePayload = {
        title: recipeData.title,
        description: recipeData.description,
        image: recipeData.image,
        category: recipeData.category,
        author: recipeData.author,
        ingredients: recipeData.ingredients, // JSONB
        instructions: recipeData.instructions, // JSONB
        tags: recipeData.tags, // JSONB
        nutrition: recipeData.nutrition, // JSONB
        rating: 0,
        reviews: 0,
        // 변환 필요한 컬럼들
        cook_time: recipeData.cookTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        is_user_created: true,
        // created_at은 DB가 자동 생성하므로 생략 가능
      };

      const { error } = await supabase
        .from("recipes")
        .insert([newRecipePayload]);

      if (error) throw error;

      // 성공하면 목록 다시 불러오기
      loadRecipes();
    } catch (error) {
      console.error("Failed to add recipe to Supabase:", error);
    }
  };

  const updateRecipe = async (updatedRecipe: Recipe) => {
    // 업데이트 로직 (생략)
  };

  const toggleLike = async (id: number) => {
    // 찜하기는 로컬에서만 (개인화)
    const newRecipes = recipes.map((recipe) =>
      recipe.id === id ? { ...recipe, isLiked: !recipe.isLiked } : recipe
    );
    setRecipes(newRecipes);
    // 필요 시 AsyncStorage에 찜 목록 ID만 따로 저장하는 로직 추가 가능
  };

  const addReview = (recipeId: number, reviewData: Omit<Review, "id">) => {
    // 리뷰 로직 (생략)
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        ingredients,
        addRecipe,
        updateRecipe,
        toggleLike,
        addReview,
        addIngredient,
        loadRecipes,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = () => useContext(RecipeContext);
