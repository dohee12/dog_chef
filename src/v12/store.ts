// 목업 v12 의 전역 상태를 그대로 옮긴 작은 저장소.
// 목업처럼 값을 직접 바꾸고 bump() 로 화면을 다시 그린다.
// 로그인 전에는 seed.json 의 예시 데이터로 둘러보고, 로그인하면 lib/sync.ts 가 내 반려견·찜·먹은 기록을 Supabase 에서 불러와 바꾼다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSyncExternalStore } from "react";
import EVIDENCE from "./data/dog-food-evidence.json";
import SEED0 from "./data/seed.json";
import { makeJudge } from "./logic/judge";

export const D: any = EVIDENCE;
export const J = makeJudge(D);

export type Pet = {
  key: string;
  name: string;
  breed: string;
  age: number | string;
  weight: number | string;
  gender: string;
  allergies: string[];
  conditions: string[];
  lactose_sensitive?: boolean;
  img: string | null;
};
export type RecipeId = number | string;
export type Recipe = {
  id: RecipeId;
  title: string;
  category: string;
  desc: string;
  image: string | null;
  author: string;
  rating: number;
  reviews: number;
  ingredients: string[];
  seasons: string[];
  steps: string[];
};
export const SEED: { recipes: Recipe[]; pets: Pet[] } = JSON.parse(JSON.stringify(SEED0));

export type Season = "봄" | "여름" | "가을" | "겨울";
export const seasonOf = (m: number): Season =>
  m >= 3 && m <= 5 ? "봄" : m <= 8 && m >= 6 ? "여름" : m >= 9 && m <= 11 ? "가을" : "겨울";

export type Tab = "home" | "fav" | "add" | "calc" | "pet";
export type Status = "ok" | "caution" | "no" | "unknown";

export const state = {
  // 지금 고른 반려견의 찜. 로그인하면 반려견마다 따로 저장된다(favsByPet).
  favs: new Set<RecipeId>([2, 8]),
  season: seasonOf(new Date().getMonth() + 1),
  pet: SEED.pets[0].key,
  cat: "all",
  query: "",
  fitOnly: false,
  statusFilter: null as Status | null,
  tab: "home" as Tab,
  bigText: false,
  chatOpen: false,
  detailId: null as RecipeId | null,
  petSheet: null as null | "basic" | "allergy" | "health",
  source: null as null | { sid: string; quotes: string[]; ctx?: string },
  toast: "",
  // 먹었어요 화면을 맨 위로 올려야 할 때 1씩 올린다
  calcScrollTop: 0,
  // 레시피를 어디서 가져왔나: 불러오는 중 / 예시 데이터(.env 없음) / Supabase / 연결 실패(예시 데이터로 보임)
  recipeSource: "loading" as "loading" | "seed" | "supabase" | "error",
};
// 로그인했는데 등록한 반려견이 없을 때 화면이 깨지지 않게 쓰는 빈 반려견 (key 가 "" 이다).
export const NO_PET: Pet = { key: "", name: "우리 아이", breed: "", age: "", weight: "", gender: "", allergies: [], conditions: [], lactose_sensitive: false, img: null };
export const pet = (): Pet => SEED.pets.find((p) => p.key === state.pet) ?? SEED.pets[0] ?? NO_PET;
export const hasPet = () => SEED.pets.length > 0;

// 로그인한 사람의 반려견별 찜 (반려견 key → 레시피 id 모음)
export const favsByPet = new Map<string, Set<RecipeId>>();
export function favsFor(key: string) {
  let set = favsByPet.get(key);
  if (!set) favsByPet.set(key, (set = new Set<RecipeId>()));
  return set;
}

// ---------- 먹은 기록 (logic/calc 가 쓰고, lib/sync 가 서버에서 불러온다) ----------
// id: 서버(intake_logs) 행 번호. 서버에 저장되기 전이거나 로그인 없이 쓸 때는 없다.
export type HistoryItem = { key: string; id?: number; petKey?: string; icon: string; pet: string; w: number | string; what: string; num: string; ate: string; lv: number };
export const history: HistoryItem[] = [];

// ---------- 다시 그리기 ----------
let version = 0;
const listeners = new Set<() => void>();
export function bump() {
  version++;
  listeners.forEach((l) => l());
}
export function useStore() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
}

// ---------- 공통 동작 ----------
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function showToast(msg: string) {
  state.toast = msg;
  bump();
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toast = "";
    bump();
  }, 2200);
}
export function showTab(id: Tab) {
  state.tab = id;
  bump();
}
export function switchPet(k: string) {
  state.pet = k;
  if (auth.user) state.favs = favsFor(k);
  bump();
}
export function toggleBigText() {
  state.bigText = !state.bigText;
  showToast(state.bigText ? "큰 글씨로 바꿨어요." : "기본 글씨로 바꿨어요.");
}
export function openSource(sid: string, quotes: string[], ctx?: string) {
  state.source = { sid, quotes, ctx };
  bump();
}
export function goStatus(k: Status) {
  Object.assign(state, { statusFilter: k, cat: "all", fitOnly: false, query: "", tab: "home" });
  bump();
}
export function setSeason(s: Season) {
  Object.assign(state, { season: s, cat: "season", tab: "home" });
  bump();
}

// ---------- 로그인 ----------
// 보기는 로그인 없이, 저장이 필요한 동작만 로그인을 요구한다.
// requireLogin(동작, 이유): 로그인돼 있으면 바로 하고, 아니면 로그인 시트를 띄웠다가 로그인하면 그 동작을 이어서 한다.
export type AuthUser = { id: string; email: string | null };
export const auth = {
  ready: false, // 앱 시작 때 저장된 세션을 다 읽었나
  user: null as AuthUser | null,
  sheet: null as null | { reason: string },
  // 내 반려견·찜·먹은 기록을 서버에서 불러온 상태: 로그인 전(idle) / 불러오는 중 / 됨 / 실패
  sync: "idle" as "idle" | "loading" | "ok" | "error",
  // 새 비밀번호 시트: 재설정 메일 링크로 돌아왔을 때(recovery) / 로그인한 사람이 바꿀 때(change)
  pwSheet: null as null | "recovery" | "change",
};
let pendingAction: (() => void) | null = null;
// 로그인한 뒤 내 데이터를 다 불러오면 이어서 할 동작 (lib/sync 의 loadMine 이 끝에 runQueuedAction 을 부른다)
let queuedAction: (() => void) | null = null;

export function requireLogin(action: () => void, reason = "로그인하면 저장돼서 다른 기기에서도 볼 수 있어요.") {
  if (auth.user) {
    action();
    return;
  }
  pendingAction = action;
  auth.sheet = { reason };
  bump();
}
/** 로그인 시트를 닫는다. 로그인하지 않고 닫으면 하려던 동작은 버린다. */
export function closeLoginSheet() {
  pendingAction = null;
  auth.sheet = null;
  bump();
}
export function openPasswordSheet(kind: "recovery" | "change") {
  auth.pwSheet = kind;
  bump();
}
export function closePasswordSheet() {
  auth.pwSheet = null;
  bump();
}
// 로그아웃하면 화면에서 내 반려견·찜·먹은 기록을 지우고 예시 반려견으로 되돌린다. (내 데이터는 서버에 남아 있다)
export function resetAccountData() {
  SEED.pets = JSON.parse(JSON.stringify(SEED0)).pets;
  state.pet = SEED.pets[0].key;
  favsByPet.clear();
  state.favs = new Set<RecipeId>();
  history.length = 0;
  state.petSheet = null;
  auth.sync = "idle";
  queuedAction = null;
}
/** 세션이 바뀔 때 lib/auth 가 부른다. 새로 로그인됐으면 하려던 동작을 내 데이터를 불러온 뒤에 이어서 한다. */
export function setAuthUser(u: AuthUser | null) {
  auth.user = u;
  auth.ready = true;
  if (u && auth.sheet) {
    auth.sheet = null;
    queuedAction = pendingAction;
    pendingAction = null;
  }
  bump();
}
export function runQueuedAction() {
  const run = queuedAction;
  queuedAction = null;
  if (run) run();
}
