import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// NestJS 백엔드 주소. .env 의 EXPO_PUBLIC_API_URL 로 바꿀 수 있다.
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4040/api"
).replace(/\/$/, "");

const TOKEN_KEY = "dogchef.access_token";
const USER_KEY = "dogchef.user";

export interface AuthUser {
  id: string;
  email: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: any
  ) {
    super(message);
  }
}

// ---- 로그인 상태 (토큰 + 사용자) ----

let currentToken: string | null = null;
let currentUser: AuthUser | null = null;
const listeners = new Set<(user: AuthUser | null) => void>();

/** 로그인/로그아웃이 바뀔 때 호출된다. 해제 함수를 돌려준다. */
export function onAuthChange(fn: (user: AuthUser | null) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getCurrentUser() {
  return currentUser;
}

export async function setSession(token: string | null, user: AuthUser | null) {
  currentToken = token;
  currentUser = user;
  try {
    if (token && user) {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [USER_KEY, JSON.stringify(user)],
      ]);
    } else {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    }
  } catch {
    // 저장소를 못 써도(시크릿 창 등) 이번 접속 동안은 로그인 상태가 유지된다.
  }
  listeners.forEach((fn) => fn(user));
}

/** 앱 시작 시 저장된 로그인을 불러오고, 서버에 아직 유효한지 확인한다. */
export async function restoreSession(): Promise<AuthUser | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    currentToken = token;
    const user = await request<AuthUser>("GET", "/auth/me");
    await setSession(token, user);
    return user;
  } catch (error) {
    // 토큰 만료(401)면 로그아웃 처리. 서버가 꺼져 있으면 저장된 사용자로 일단 유지.
    if (error instanceof ApiError && error.status === 401) {
      await setSession(null, null);
      return null;
    }
    try {
      const saved = await AsyncStorage.getItem(USER_KEY);
      currentUser = saved ? JSON.parse(saved) : null;
    } catch {
      currentUser = null;
    }
    return currentUser;
  }
}

// ---- HTTP ----

export async function request<T = any>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "서버에 연결할 수 없습니다. 백엔드가 켜져 있는지 확인해주세요.", null);
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    // Nest 검증 오류는 message 가 배열로 온다
    const raw = data?.message ?? res.statusText;
    const message = Array.isArray(raw) ? raw.join("\n") : String(raw);
    if (res.status === 401 && currentToken) {
      // 토큰이 만료됐거나 틀림: 로그아웃 상태로 돌린다
      await setSession(null, null);
    }
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

// ---- 이미지 업로드 ----

/**
 * 갤러리에서 고른 사진(blob:, data:, file: 주소)은 내 기기에서만 열린다.
 * 저장하기 전에 서버에 올리고, 누구나 열 수 있는 http 주소로 바꾼다.
 * 이미 http(s) 주소거나 비어 있으면 그대로 돌려준다.
 */
export async function toRemoteImage<T extends string | null | undefined>(uri: T): Promise<T | string> {
  if (!uri || /^https?:\/\//i.test(uri)) return uri;

  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, "image");
  } else {
    // React Native 는 파일 경로를 이런 모양의 객체로 받는다
    form.append("file", { uri, name: "image.jpg", type: "image/jpeg" } as any);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      // Content-Type 은 비워 둔다: 브라우저가 multipart 경계값을 직접 넣어야 한다
      headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
      body: form,
    });
  } catch {
    throw new ApiError(0, "서버에 연결할 수 없습니다. 백엔드가 켜져 있는지 확인해주세요.", null);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      res.status === 413
        ? "사진은 5MB 이하만 올릴 수 있습니다."
        : String(data?.message ?? "사진 업로드에 실패했습니다.");
    throw new ApiError(res.status, message, data);
  }
  return data.url as string;
}

/** 여러 장을 차례로 올린다. */
export async function toRemoteImages(uris: string[] = []): Promise<string[]> {
  const out: string[] = [];
  for (const uri of uris) out.push((await toRemoteImage(uri)) as string);
  return out;
}

export const api = {
  get: <T = any>(path: string) => request<T>("GET", path),
  post: <T = any>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T = any>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = any>(path: string) => request<T>("DELETE", path),
};
