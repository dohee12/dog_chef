import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe, Review } from "@/types/Recipe";
import { mockRecipes } from "@/utils/mockData";

interface RecipeContextType {
  recipes: Recipe[];
  ingredients: string[];
  addRecipe: (recipe: Omit<Recipe, "id">) => void;
  updateRecipe: (recipe: Recipe) => void;
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

// 24시간 (밀리초 단위)
const RECIPE_TTL = 24 * 60 * 60 * 1000; 

const RecipeContext = createContext<RecipeContextType>({
  recipes: [],
  ingredients: DEFAULT_INGREDIENTS,
  addRecipe: () => {},
  updateRecipe: () => {},
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

  // 레시피 필터링 함수 (만료된 레시피 제거)
  const filterExpiredRecipes = (recipeList: Recipe[]) => {
    const now = new Date().getTime();
    
    return recipeList.filter((recipe) => {
      // isUserCreated가 true인 경우에만 만료 체크 (기본 mockData는 유지하고 싶다면)
      // 만약 모든 레시피에 적용하고 싶다면 조건문 제거
      if (recipe.isUserCreated && recipe.createdDate) {
        const createdTime = new Date(recipe.createdDate).getTime();
        // 생성된 지 24시간이 지났으면 false (제거)
        return (now - createdTime) < RECIPE_TTL;
      }
      return true; // 기본 데이터나 날짜 없는 데이터는 유지
    });
  };

  const loadRecipes = async () => {
    try {
      const storedRecipes = await AsyncStorage.getItem("recipes");
      if (storedRecipes) {
        const parsedRecipes = JSON.parse(storedRecipes);
        
        // 로드 시 만료된 레시피 필터링
        const validRecipes = filterExpiredRecipes(parsedRecipes);
        
        // 만약 만료되어 삭제된 레시피가 있다면 저장소도 업데이트
        if (validRecipes.length !== parsedRecipes.length) {
           await AsyncStorage.setItem("recipes", JSON.stringify(validRecipes));
        }
        
        setRecipes(validRecipes);
      } else {
        // 없으면 초기값(mockData) 사용 및 저장
        setRecipes(mockRecipes);
        await AsyncStorage.setItem("recipes", JSON.stringify(mockRecipes));
      }
    } catch (error) {
      console.error("Failed to load recipes", error);
      // 에러 발생 시 안전하게 mockData 사용
      setRecipes(mockRecipes);
    }
  };

  const loadIngredients = async () => {
    try {
      const storedIngredients = await AsyncStorage.getItem("customIngredients");
      if (storedIngredients) {
        const customIngredients = JSON.parse(storedIngredients);
        const merged = Array.from(new Set([...DEFAULT_INGREDIENTS, ...customIngredients]));
        setIngredients(merged);
      }
    } catch (error) {
      console.error("Failed to load ingredients", error);
    }
  };

  const saveRecipes = async (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
    try {
      await AsyncStorage.setItem("recipes", JSON.stringify(newRecipes));
    } catch (error) {
      console.error("Failed to save recipes", error);
    }
  };

  const addIngredient = async (newIngredient: string) => {
    if (ingredients.includes(newIngredient)) return;

    const newIngredients = [...ingredients, newIngredient];
    setIngredients(newIngredients);
    
    const customOnly = newIngredients.filter(i => !DEFAULT_INGREDIENTS.includes(i));
    
    try {
      await AsyncStorage.setItem("customIngredients", JSON.stringify(customOnly));
    } catch (error) {
      console.error("Failed to save ingredient", error);
    }
  };

  const addRecipe = (recipeData: Omit<Recipe, "id">) => {
    const newId =
      recipes.length > 0 ? Math.max(...recipes.map((r) => r.id)) + 1 : 1;
    
    const newRecipe: Recipe = {
      ...recipeData,
      id: newId,
      createdDate: new Date().toISOString(), // 생성 시간 기록 필수
      isUserCreated: true, // 사용자 생성 여부 마킹
      reviews: 0,
      rating: 0,
      reviewList: [],
    };
    // 최신 레시피가 위로 오도록 배열 앞쪽에 추가
    saveRecipes([newRecipe, ...recipes]);
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    const newRecipes = recipes.map((recipe) =>
      recipe.id === updatedRecipe.id ? updatedRecipe : recipe
    );
    saveRecipes(newRecipes);
  };

  const toggleLike = (id: number) => {
    const newRecipes = recipes.map((recipe) =>
      recipe.id === id ? { ...recipe, isLiked: !recipe.isLiked } : recipe
    );
    saveRecipes(newRecipes);
  };

  const addReview = (recipeId: number, reviewData: Omit<Review, "id">) => {
    const newRecipes = recipes.map((recipe) => {
      if (recipe.id === recipeId) {
        const currentReviews = recipe.reviewList || [];
        const newReviewId =
          currentReviews.length > 0
            ? Math.max(...currentReviews.map((r) => r.id)) + 1
            : 1;
        const newReview: Review = { ...reviewData, id: newReviewId };
        const updatedReviews = [newReview, ...currentReviews];
        
        // Recalculate rating
        const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const newRating = parseFloat(
          (totalRating / updatedReviews.length).toFixed(1)
        );

        return {
          ...recipe,
          reviewList: updatedReviews,
          reviews: updatedReviews.length,
          rating: newRating,
        };
      }
      return recipe;
    });
    saveRecipes(newRecipes);
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
