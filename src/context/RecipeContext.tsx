import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe, Review } from "@/types/Recipe";
import { mockRecipes } from "@/utils/mockData";

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, "id">) => void;
  updateRecipe: (recipe: Recipe) => void;
  toggleLike: (id: number) => void;
  addReview: (recipeId: number, review: Omit<Review, "id">) => void;
}

const RecipeContext = createContext<RecipeContextType>({
  recipes: [],
  addRecipe: () => {},
  updateRecipe: () => {},
  toggleLike: () => {},
  addReview: () => {},
});

export const RecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const storedRecipes = await AsyncStorage.getItem("recipes");
      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      } else {
        setRecipes(mockRecipes);
        await AsyncStorage.setItem("recipes", JSON.stringify(mockRecipes));
      }
    } catch (error) {
      console.error("Failed to load recipes", error);
      setRecipes(mockRecipes);
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
        addRecipe,
        updateRecipe,
        toggleLike,
        addReview,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = () => useContext(RecipeContext);
