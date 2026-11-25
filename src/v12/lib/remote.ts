// Supabase 에서 데이터를 불러와 화면 저장소(SEED)를 바꾼다. (A안 1단계: 레시피 읽기)
// 기존 recipes 테이블 칸 이름이 v12 화면과 달라서 여기서 맞춰 준다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CATS, suggestMain } from "../logic/common";
import { auth, bump, SEED, state, type Recipe } from "../store";
import { supabase } from "./supabase";

const CAT_KEYS = CATS.map((c) => c[0]);
const list = (v: any): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);
const num = (...vs: any[]) => {
  for (const v of vs) if (v !== null && v !== undefined && !isNaN(+v)) return +v;
  return 0;
};

// 테이블 한 줄 → v12 Recipe.
// 카테고리가 예전 값(주식·간식 등)이면 재료로 주재료 카테고리를 다시 고른다 (계획서 결정 2).
export function toRecipe(row: any): Recipe {
  const ingredients = list(row.ingredients);
  const category = CAT_KEYS.includes(row.category) ? row.category : suggestMain(ingredients) || "";
  return {
    id: row.id,
    title: row.title || "(제목 없음)",
    category,
    desc: row.description || row.desc || "",
    image: row.image || row.image_url || null,
    author: row.author || "",
    rating: num(row.average_rating, row.rating),
    reviews: num(row.reviews_count, row.reviews),
    ingredients,
    seasons: list(row.seasons),
    steps: list(row.instructions ?? row.steps),
  };
}

export async function loadRecipes() {
  if (!supabase) {
    state.recipeSource = "seed";
    bump();
    return;
  }
  const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false }).limit(200);
  if (error || !data) {
    console.warn("레시피를 불러오지 못했어요:", error?.message);
    state.recipeSource = "error";
    bump();
    return;
  }
  SEED.recipes = data.map(toRecipe);
  // 예시 데이터의 찜(id 2, 8)은 서버 레시피와 맞지 않으니 비운다. 로그인했으면 내 찜(lib/sync)을 그대로 둔다.
  if (!auth.user) state.favs = new Set();
  state.detailId = null;
  state.recipeSource = "supabase";
  bump();
}
