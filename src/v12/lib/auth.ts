// Supabase Auth 이메일 로그인. 세션은 supabase.ts 에서 AsyncStorage 에 저장된다.
// 앱 시작 때 initAuth() 한 번: 저장된 세션을 읽고, 이후 로그인·로그아웃을 store 에 알린다.
import type { User } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { openPasswordSheet, setAuthUser, showToast } from "../store";
import { PW_RULE_TEXT } from "./password";
import { supabase } from "./supabase";

const toUser = (u: User | null | undefined) => (u ? { id: u.id, email: u.email ?? null } : null);

let started = false;
export function initAuth() {
  if (started) return;
  started = true;
  if (!supabase) {
    setAuthUser(null);
    return;
  }
  supabase.auth.getSession().then(({ data }) => setAuthUser(toUser(data.session?.user)));
  supabase.auth.onAuthStateChange((event, session) => {
    setAuthUser(toUser(session?.user));
    // 재설정 메일의 링크로 돌아오면 Supabase 가 임시 세션을 만들고 이 이벤트를 보낸다 → 새 비밀번호 시트를 연다.
    if (event === "PASSWORD_RECOVERY") openPasswordSheet("recovery");
  });
}

export const NO_SERVER = "서버 연결 설정(.env)이 없어 로그인할 수 없어요.";

/** Supabase 오류를 한국어 문구로 바꾼다. */
export function authErrorText(e: { message?: string; code?: string; status?: number } | null | undefined): string {
  if (!e) return "";
  const code = e.code || "";
  const m = (e.message || "").toLowerCase();
  if (code === "invalid_credentials" || m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (code === "email_not_confirmed" || m.includes("email not confirmed")) return "가입 확인 메일의 링크를 먼저 눌러 주세요.";
  if (code === "user_already_exists" || code === "email_exists" || m.includes("already registered")) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (code === "weak_password" || m.includes("password should be")) return `비밀번호가 너무 약해요. ${PW_RULE_TEXT} 넣어 주세요.`;
  if (code === "same_password" || m.includes("different from the old")) return "지금 쓰는 비밀번호와 다른 비밀번호를 넣어 주세요.";
  if (code === "reauthentication_needed" || m.includes("reauthenticat")) return "보안을 위해 로그아웃 후 다시 로그인한 뒤 바꿔 주세요.";
  if (code === "session_not_found" || code === "session_expired" || m.includes("auth session missing")) return "링크가 만료됐어요. 비밀번호 재설정 메일을 다시 받아 주세요.";
  if (code === "email_address_invalid" || m.includes("invalid format") || m.includes("is invalid")) return "이메일 주소 형식을 확인해 주세요.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || e.status === 429 || m.includes("rate limit"))
    return "요청이 많아 잠시 막혔어요. 조금 뒤에 다시 해 주세요.";
  if (code === "signup_disabled" || m.includes("signups not allowed")) return "지금은 회원가입을 받지 않아요.";
  if (m.includes("failed to fetch") || m.includes("network")) return "인터넷 연결을 확인해 주세요.";
  return "잠시 문제가 생겼어요. 다시 해 주세요.";
}

const redirectTo = () => (Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : undefined);

export async function signIn(email: string, password: string): Promise<string> {
  if (!supabase) return NO_SERVER;
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return authErrorText(error);
}

/** 가입. 확인 메일이 필요하면 needConfirm=true (세션이 아직 없음). */
export async function signUp(email: string, password: string): Promise<{ error: string; needConfirm: boolean }> {
  if (!supabase) return { error: NO_SERVER, needConfirm: false };
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo() } });
  if (error) return { error: authErrorText(error), needConfirm: false };
  // 이미 가입된 이메일이면 Supabase 는 오류 대신 identities 가 빈 사용자를 돌려준다.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
    return { error: "이미 가입된 이메일이에요. 로그인해 주세요.", needConfirm: false };
  return { error: "", needConfirm: !data.session };
}

export async function sendPasswordReset(email: string): Promise<string> {
  if (!supabase) return NO_SERVER;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo() });
  return authErrorText(error);
}

/** 새 비밀번호로 바꾼다 (재설정 링크로 들어온 임시 세션 또는 로그인한 세션). 오류가 없으면 "". */
export async function updatePassword(password: string): Promise<string> {
  if (!supabase) return NO_SERVER;
  const { error } = await supabase.auth.updateUser({ password });
  return authErrorText(error);
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  showToast(error ? authErrorText(error) : "로그아웃했어요.");
}
