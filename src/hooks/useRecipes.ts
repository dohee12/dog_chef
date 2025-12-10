import { useCallback, useState } from "react";
import { useRecipe as useContextRecipe } from "../context/RecipeContext"; // Context에서 가져옴

export const useRecipes = () => {
  // 실제 Context의 데이터를 사용하도록 연결
  const {
    recipes: contextRecipes,
    toggleLike: contextToggleLike,
    loadRecipes,
  } = useContextRecipe();

  // 로컬 상태가 아닌 Context 상태를 반환
  // 초기 로딩 시 mockData를 사용하는 로직은 Context 내부(RecipeProvider)에 이미 있음
  // 여기서는 로딩 상태만 관리하거나, Context의 loading 상태를 가져오면 됨.

  const [loading, setLoading] = useState(false);

  const refreshRecipes = useCallback(async () => {
    setLoading(true);
    await loadRecipes(); // Context의 loadRecipes 호출
    setLoading(false);
  }, [loadRecipes]);

  // Context가 아직 준비되지 않았을 때를 대비해 mockRecipes를 초기값으로 쓸 수도 있지만,
  // RecipeProvider가 이미 초기화 시점에 로드하므로 contextRecipes를 그대로 씁니다.

  return {
    recipes: contextRecipes,
    loading,
    refreshRecipes,
    toggleLike: contextToggleLike, // toggleLike 노출
  };
};
