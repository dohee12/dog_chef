// 목업 v12 의 전역 상태를 그대로 옮긴 작은 저장소.
// 목업처럼 값을 직접 바꾸고 bump() 로 화면을 다시 그린다. (서버 연결 전 단계라 데이터는 seed.json 을 쓴다)
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
export type Recipe = {
  id: number;
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
  favs: new Set<number>([2, 8]),
  season: seasonOf(new Date().getMonth() + 1),
  pet: SEED.pets[0].key,
  cat: "all",
  query: "",
  fitOnly: false,
  statusFilter: null as Status | null,
  tab: "home" as Tab,
  bigText: false,
  chatOpen: false,
  detailId: null as number | null,
  petSheet: null as null | "basic" | "allergy" | "health",
  source: null as null | { sid: string; quotes: string[]; ctx?: string },
  toast: "",
  // 먹었어요 화면을 맨 위로 올려야 할 때 1씩 올린다
  calcScrollTop: 0,
};
export const pet = () => SEED.pets.find((p) => p.key === state.pet)!;

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
  bump();
}
export function toggleFav(id: number) {
  if (state.favs.has(id)) state.favs.delete(id);
  else state.favs.add(id);
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
