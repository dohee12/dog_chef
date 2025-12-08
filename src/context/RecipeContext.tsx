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

  const loadRecipes = async () => {
    try {
      // Force update with mockData for development
      setRecipes(mockRecipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(mockRecipes));
      
      /* 
      const storedRecipes = await AsyncStorage.getItem("recipes");
      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      } else {
        setRecipes(mockRecipes);
        await AsyncStorage.setItem("recipes", JSON.stringify(mockRecipes));
      }
      */
    } catch (error) {
      console.error("Failed to load recipes", error);
      setRecipes(mockRecipes);
    }
  };

  const loadIngredients = async () => {
    try {
      const storedIngredients = await AsyncStorage.getItem("customIngredients");
      if (storedIngredients) {
        const customIngredients = JSON.parse(storedIngredients);
        // Merge defaults with custom, removing duplicates
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
    
    // Save only custom ingredients (diff from default) or just save the whole list?
    // Saving just custom ones is cleaner but more complex logic. 
    // Let's just save the 'custom' part to storage so we don't duplicate defaults if defaults change in code.
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
      createdDate: new Date().toISOString(),
      isUserCreated: true,
      reviews: 0,
      rating: 0,
      reviewList: [],
    };
    saveRecipes([...recipes, newRecipe]);
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
