// 로그인한 사용자의 반려견·찜·먹은 기록·레시피 등록을 Supabase 에 저장하고 불러온다.
// 화면 상태를 먼저 바꾸고(바로 보이게), 서버 저장이 실패하면 한국어 토스트를 띄우고 화면을 되돌린다.
// 칸 맞춤: Pet.conditions ↔ pets.health_conditions, Pet.img ↔ pets.image, Recipe.desc ↔ recipes.description, Recipe.steps ↔ recipes.instructions
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  auth, bump, favsByPet, favsFor, history, runQueuedAction, SEED, showToast, state,
  type HistoryItem, type Pet, type Recipe, type RecipeId,
} from "../store";
import { toRecipe } from "./remote";
import { supabase } from "./supabase";

// 먹었어요 음식 키 → 아이콘 (logic/calc 의 CALC 와 같은 값. calc 를 불러오면 순환 import 가 생겨 여기 둔다)
const FOOD_ICON: Record<string, string> = { chocolate: "🍫", "grapes-raisins": "🍇", xylitol: "🍬", allium: "🧅", macadamia: "🥜" };

const list = (v: any): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
/** 서버에 저장된 반려견이면 pets.id, 아니면(예시 반려견·없음) null */
export const serverPetId = (key: string) => (/^\d+$/.test(key) ? Number(key) : null);
const canSave = () => !!(supabase && auth.user);

// ---------- 칸 맞춤 ----------
export function toPet(r: any): Pet {
  return {
    key: String(r.id),
    name: r.name || "",
    breed: r.breed || "",
    age: r.age ?? "",
    weight: r.weight !== null && r.weight !== undefined ? +r.weight : "",
    gender: r.gender || "",
    allergies: list(r.allergies),
    conditions: list(r.health_conditions),
    lactose_sensitive: !!r.lactose_sensitive,
    img: r.image || null,
  };
}
function petRow(p: Pet) {
  const n = (v: any) => (v === "" || v === null || v === undefined || isNaN(+v) ? null : +v);
  return {
    name: String(p.name).trim(),
    breed: p.breed ? String(p.breed).trim() : null,
    age: n(p.age),
    weight: n(p.weight),
    gender: p.gender || null,
    allergies: p.allergies,
    health_conditions: p.conditions,
    lactose_sensitive: !!p.lactose_sensitive,
  };
}
const two = (n: number) => String(n).padStart(2, "0");
function ateLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${two(d.getHours())}:${two(d.getMinutes())}쯤`;
}
function toHistory(r: any, petName: (k: string) => string): HistoryItem {
  const petKey = String(r.pet_id);
  return {
    key: "db" + r.id,
    id: r.id,
    petKey,
    icon: FOOD_ICON[r.food] || "🍽️",
    pet: petName(petKey),
    w: r.calc_weight !== null ? +r.calc_weight : "",
    what: r.what_text || "",
    num: r.calc_value || "",
    ate: ateLabel(r.ate_at),
    lv: r.level,
  };
}

// ---------- 로그인하면 내 데이터 불러오기 ----------
let loadSeq = 0;
export async function loadMine() {
  if (!supabase || !auth.user) return;
  const seq = ++loadSeq;
  auth.sync = "loading";
  // 내 반려견을 받기 전까지 예시 반려견은 내리고 빈 화면(불러오는 중)으로 둔다.
  SEED.pets = [];
  state.pet = "";
  favsByPet.clear();
  state.favs = new Set<RecipeId>();
  history.length = 0;
  bump();
  const [pets, likes, logs] = await Promise.all([
    supabase.from("pets").select("*").order("created_at", { ascending: true }),
    supabase.from("likes").select("id, pet_id, recipe_id"),
    supabase.from("intake_logs").select("*").order("ate_at", { ascending: false }).limit(200),
  ]);
  if (seq !== loadSeq || !auth.user) return; // 그 사이에 로그아웃했거나 다시 불렀으면 버린다
  const err = pets.error || likes.error || logs.error;
  if (err) {
    console.warn("내 정보를 불러오지 못했어요:", err.message);
    auth.sync = "error";
    bump();
    showToast("내 반려견·찜·기록을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.");
    runQueuedAction();
    return;
  }
  SEED.pets = (pets.data || []).map(toPet);
  for (const l of likes.data || []) if (l.pet_id !== null && l.recipe_id !== null) favsFor(String(l.pet_id)).add(l.recipe_id);
  state.pet = SEED.pets[0]?.key ?? "";
  state.favs = favsFor(state.pet);
  const nameOf = (k: string) => SEED.pets.find((p) => p.key === k)?.name || "";
  history.push(...(logs.data || []).map((r) => toHistory(r, nameOf)));
  auth.sync = "ok";
  bump();
  runQueuedAction();
}
/** 로그아웃하면 진행 중인 불러오기 결과를 버린다. */
export function cancelLoad() {
  loadSeq++;
}

// ---------- 반려견 ----------
/** 새 반려견 저장. 성공하면 화면에 넣고 그 아이를 고른다. 실패하면 false (화면은 그대로). */
export async function addPet(p: Pet): Promise<boolean> {
  if (!canSave()) {
    SEED.pets.push(p);
    state.pet = p.key;
    bump();
    return true;
  }
  const { data, error } = await supabase!.from("pets").insert({ ...petRow(p), user_id: auth.user!.id }).select("*").single();
  if (error || !data) {
    console.warn("반려견 저장 실패:", error?.message);
    showToast("반려견을 저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
    return false;
  }
  const np = toPet(data);
  SEED.pets.push(np);
  state.pet = np.key;
  state.favs = favsFor(np.key);
  bump();
  showToast(`${np.name} 정보를 저장했어요.`);
  return true;
}

/** 고치기 시트를 닫을 때: 처음(before)과 달라졌으면 저장. 실패하면 처음 값으로 되돌린다. */
export async function savePetEdit(p: Pet, before: Pet) {
  const now = petRow(p), old = petRow(before);
  if (JSON.stringify(now) === JSON.stringify(old)) return;
  const id = serverPetId(p.key);
  if (!canSave() || id === null) return;
  const { error } = await supabase!.from("pets").update(now).eq("id", id);
  if (error) {
    console.warn("반려견 수정 실패:", error.message);
    Object.assign(p, JSON.parse(JSON.stringify(before)));
    bump();
    showToast("바뀐 정보를 저장하지 못해 원래대로 되돌렸어요. 다시 해 주세요.");
    return;
  }
  // 먹은 기록에 보이는 이름도 맞춘다
  history.forEach((h) => { if (h.petKey === p.key) h.pet = p.name; });
  bump();
  showToast("반려견 정보를 저장했어요.");
}

/** 반려견 지우기 (그 아이의 찜·먹은 기록도 서버에서 함께 지워진다: on delete cascade) */
export async function deletePet(key: string): Promise<boolean> {
  const id = serverPetId(key);
  if (!canSave() || id === null) return false;
  const { error } = await supabase!.from("pets").delete().eq("id", id);
  if (error) {
    console.warn("반려견 삭제 실패:", error.message);
    showToast("반려견을 지우지 못했어요. 다시 해 주세요.");
    return false;
  }
  const name = SEED.pets.find((p) => p.key === key)?.name || "";
  SEED.pets = SEED.pets.filter((p) => p.key !== key);
  favsByPet.delete(key);
  for (let i = history.length - 1; i >= 0; i--) if (history[i].petKey === key) history.splice(i, 1);
  state.pet = SEED.pets[0]?.key ?? "";
  state.favs = favsFor(state.pet);
  state.petSheet = null;
  bump();
  showToast(`${name} 정보를 지웠어요.`);
  return true;
}

// ---------- 찜 (반려견별) ----------
export async function toggleFav(id: RecipeId) {
  if (!canSave()) {
    if (state.favs.has(id)) state.favs.delete(id);
    else state.favs.add(id);
    bump();
    return;
  }
  const petId = serverPetId(state.pet);
  if (petId === null) { showToast("반려견을 먼저 등록해 주세요. 찜은 반려견마다 저장돼요."); return; }
  if (typeof id !== "number") { showToast("이 레시피는 찜을 저장할 수 없어요."); return; }
  const set = state.favs;
  const on = !set.has(id);
  if (on) set.add(id);
  else set.delete(id);
  bump();
  const res = on
    ? await supabase!.from("likes").insert({ user_id: auth.user!.id, pet_id: petId, recipe_id: id })
    : await supabase!.from("likes").delete().eq("pet_id", petId).eq("recipe_id", id);
  // 이미 찜돼 있던 것(중복 23505)은 성공으로 본다
  if (res.error && !(on && res.error.code === "23505")) {
    console.warn("찜 저장 실패:", res.error.message);
    if (on) set.delete(id);
    else set.add(id);
    bump();
    showToast(on ? "찜을 저장하지 못했어요. 다시 눌러 주세요." : "찜을 빼지 못했어요. 다시 눌러 주세요.");
  }
}

// ---------- 먹은 기록 ----------
export type IntakeRow = {
  pet_id: number; food: string; food_sub: string | null; cacao_pct: number | null; amount_unknown: boolean;
  what_text: string; calc_weight: number; weight_temp: boolean; calc_value: string | null; level: number; ate_at: string;
};
/** 기록을 화면 맨 위에 넣고 서버에 저장한다. 실패하면 화면에서 다시 뺀다. */
export async function saveIntakeRemote(item: HistoryItem, row: IntakeRow) {
  history.unshift(item);
  bump();
  const { data, error } = await supabase!.from("intake_logs").insert({ ...row, user_id: auth.user!.id }).select("id").single();
  if (error || !data) {
    console.warn("먹은 기록 저장 실패:", error?.message);
    const i = history.indexOf(item);
    if (i >= 0) history.splice(i, 1);
    bump();
    showToast("먹은 기록을 저장하지 못했어요. 다시 눌러 주세요.");
    return false;
  }
  item.id = data.id;
  showToast("먹은 기록을 남겼어요.");
  return true;
}
/** 기록 지우기. 서버에서 못 지우면 원래 자리에 되돌린다. */
export async function deleteIntakeRemote(i: number) {
  const item = history[i];
  if (!item) return false;
  history.splice(i, 1);
  bump();
  if (!canSave() || item.id === undefined) return true;
  const { error } = await supabase!.from("intake_logs").delete().eq("id", item.id);
  if (error) {
    console.warn("먹은 기록 삭제 실패:", error.message);
    history.splice(Math.min(i, history.length), 0, item);
    bump();
    showToast("기록을 지우지 못했어요. 다시 눌러 주세요.");
    return false;
  }
  return true;
}

// ---------- 레시피 등록 ----------
export type RecipeDraft = Pick<Recipe, "title" | "desc" | "category" | "seasons" | "ingredients" | "steps">;
/** 레시피 저장. 성공하면 홈 목록 맨 앞에 넣고 true. (사진은 Storage 준비 전이라 저장하지 않는다: image null) */
export async function createRecipe(d: RecipeDraft): Promise<boolean> {
  if (!canSave() || state.recipeSource !== "supabase") {
    showToast("서버에 연결되지 않아 레시피를 저장할 수 없어요.");
    return false;
  }
  const { data, error } = await supabase!
    .from("recipes")
    .insert({
      title: d.title,
      description: d.desc || null,
      category: d.category || null,
      seasons: d.seasons,
      ingredients: d.ingredients,
      instructions: d.steps,
      image: null,
      user_id: auth.user!.id,
      is_user_created: true,
    })
    .select("*")
    .single();
  if (error || !data) {
    console.warn("레시피 저장 실패:", error?.message);
    showToast("레시피를 저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
    return false;
  }
  SEED.recipes.unshift(toRecipe(data));
  bump();
  return true;
}
