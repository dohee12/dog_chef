import { useRecipe } from "@/context/RecipeContext";
import { useEffect, useState } from "react";
import { Recipe } from "../types";

export const usePopularRecipes = () => {
  const { recipes } = useRecipe();
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 레시피가 로드되었을 떄만 정렬 수행
    if (recipes.length > 0) {
      setLoading(true);
      const sorted = [...recipes]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
      setPopularRecipes(sorted);
      setLoading(false);
    }
  }, [recipes]);

  return { popularRecipes, loading };
};
