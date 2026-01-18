import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  requireAuth: (
    navigation: any,
    callback: () => void,
    message?: string
  ) => boolean;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 이메일 회원가입
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("회원가입 에러:", error);

        if (
          error.message.includes("invalid") ||
          error.message.includes("API")
        ) {
          Alert.alert(
            "Supabase 설정 오류",
            "Supabase API 키가 올바르지 않습니다.\n\n.env 파일을 확인해주세요:\n1. EXPO_PUBLIC_SUPABASE_URL\n2. EXPO_PUBLIC_SUPABASE_ANON_KEY (eyJhbGci...로 시작)"
          );
        } else if (error.message.includes("already registered")) {
          Alert.alert(
            "회원가입 실패",
            "이미 등록된 이메일입니다.\n로그인을 시도해주세요."
          );
        } else {
          Alert.alert("회원가입 실패", error.message);
        }
        return;
      }

      console.log("회원가입 성공:", data);
      Alert.alert(
        "회원가입 성공",
        "이메일을 확인하여 계정을 인증해주세요.\n\n개발 중에는 Supabase 대시보드에서 수동 인증도 가능합니다.",
        [{ text: "확인" }]
      );
    } catch (error: any) {
      console.error("회원가입 예외:", error);
      Alert.alert("회원가입 실패", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 로그인
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("로그인 에러:", error);

        // 에러 타입별 상세 메시지
        if (error.message.includes("Invalid login credentials")) {
          Alert.alert(
            "로그인 실패",
            "이메일 또는 비밀번호가 올바르지 않습니다.\n회원가입을 하셨는지 확인해주세요."
          );
        } else if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "이메일 인증 필요",
            "회원가입 시 받은 이메일에서 인증을 완료해주세요.\n\n개발 중에는 Supabase 대시보드에서 수동 인증 가능합니다."
          );
        } else if (
          error.message.includes("invalid") ||
          error.message.includes("API")
        ) {
          Alert.alert(
            "Supabase 설정 오류",
            "Supabase API 키가 올바르지 않습니다.\n\n.env 파일의 EXPO_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.\n\n키는 'eyJhbGci...'로 시작하는 긴 문자열이어야 합니다."
          );
        } else {
          Alert.alert("로그인 실패", error.message);
        }
        return;
      }

      console.log("로그인 성공:", data);
    } catch (error: any) {
      console.error("로그인 예외:", error);
      Alert.alert(
        "로그인 실패",
        "예상치 못한 오류가 발생했습니다.\n\n" + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // 구글 로그인
  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      console.log("구글 로그인 시도...");

      // 플랫폼별 리다이렉트 URL 설정
      const isWeb = Platform.OS === "web";
      let redirectUrl: string;

      if (isWeb) {
        // 웹: 현재 페이지 URL 사용
        redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "";
      } else {
        // 앱: 앱 스킴 사용 (expo-linking 사용)
        // Supabase가 최종적으로 리다이렉트할 URL
        redirectUrl = Linking.createURL("/");
      }

      console.log("리다이렉트 URL:", redirectUrl);
      console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isWeb ? false : true, // 웹은 false, 앱은 true
          queryParams: {
            // 추가 파라미터 (필요시)
          },
        },
      });

      if (error) {
        console.error("구글 로그인 에러:", error);

        if (error.message.includes("not enabled")) {
          Alert.alert(
            "구글 로그인 미설정",
            "Supabase에서 Google Provider를 활성화해야 합니다.\n\n1. Supabase 대시보드 → Authentication → Providers → Google 활성화\n2. Google Cloud Console에서 OAuth 설정\n3. Redirect URI: https://<your-project>.supabase.co/auth/v1/callback"
          );
        } else {
          Alert.alert("구글 로그인 실패", error.message);
        }
        return;
      }

      // 웹에서는 Supabase가 자동으로 리다이렉트 처리
      if (isWeb) {
        if (data?.url && typeof window !== "undefined") {
          // 웹에서는 브라우저가 자동으로 리다이렉트
          window.location.href = data.url;
        }
        return;
      }

      // 앱: expo-web-browser 사용
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === "success") {
          // URL에서 토큰 추출
          const url = new URL(result.url);
          
          // Fragment에서 토큰 추출 (Supabase는 fragment에 토큰 포함)
          let access_token: string | null = null;
          let refresh_token: string | null = null;

          if (url.hash) {
            const fragment = url.hash.substring(1);
            const params = new URLSearchParams(fragment);
            access_token = params.get("access_token");
            refresh_token = params.get("refresh_token");
          }

          // Query string에서도 시도
          if (!access_token || !refresh_token) {
            access_token = url.searchParams.get("access_token");
            refresh_token = url.searchParams.get("refresh_token");
          }

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error("세션 설정 실패:", sessionError);
              throw sessionError;
            }

            console.log("구글 로그인 성공");
            Alert.alert("성공", "구글 로그인이 완료되었습니다.");
          } else {
            console.warn("토큰을 찾을 수 없습니다:", result.url);
            Alert.alert("오류", "로그인 토큰을 받아오지 못했습니다.");
          }
        } else if (result.type === "cancel") {
          console.log("구글 로그인 취소됨");
        } else {
          console.warn("구글 로그인 결과:", result.type);
        }
      } else {
        console.error("OAuth URL이 반환되지 않았습니다.");
        Alert.alert("오류", "로그인 URL을 받아오지 못했습니다.");
      }
    } catch (error: any) {
      console.error("구글 로그인 예외:", error);
      Alert.alert("구글 로그인 실패", error.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인
  const signInWithKakao = async () => {
    try {
      setLoading(true);

      console.log("카카오 로그인 시도...");

      // 플랫폼별 리다이렉트 URL 설정
      const isWeb = Platform.OS === "web";
      let redirectUrl: string;

      if (isWeb) {
        // 웹: 현재 페이지 URL 사용
        redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "";
      } else {
        // 앱: 앱 스킴 사용 (expo-linking 사용)
        // Supabase가 최종적으로 리다이렉트할 URL
        redirectUrl = Linking.createURL("/");
      }

      console.log("리다이렉트 URL:", redirectUrl);
      console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isWeb ? false : true, // 웹은 false, 앱은 true
          queryParams: {
            // 추가 파라미터 (필요시)
          },
        },
      });

      if (error) {
        console.error("카카오 로그인 에러:", error);

        if (error.message.includes("not enabled")) {
          Alert.alert(
            "카카오 로그인 미설정",
            "Supabase에서 Kakao Provider를 활성화해야 합니다.\n\n1. Supabase 대시보드 → Authentication → Providers → Kakao 활성화\n2. Kakao Developers에서 OAuth 설정\n3. Redirect URI: https://<your-project>.supabase.co/auth/v1/callback"
          );
        } else {
          Alert.alert("카카오 로그인 실패", error.message);
        }
        return;
      }

      // 웹에서는 Supabase가 자동으로 리다이렉트 처리
      if (isWeb) {
        if (data?.url && typeof window !== "undefined") {
          // 웹에서는 브라우저가 자동으로 리다이렉트
          window.location.href = data.url;
        }
        return;
      }

      // 앱: expo-web-browser 사용
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === "success") {
          // URL에서 토큰 추출
          const url = new URL(result.url);
          
          // Fragment에서 토큰 추출 (Supabase는 fragment에 토큰 포함)
          let access_token: string | null = null;
          let refresh_token: string | null = null;

          if (url.hash) {
            const fragment = url.hash.substring(1);
            const params = new URLSearchParams(fragment);
            access_token = params.get("access_token");
            refresh_token = params.get("refresh_token");
          }

          // Query string에서도 시도
          if (!access_token || !refresh_token) {
            access_token = url.searchParams.get("access_token");
            refresh_token = url.searchParams.get("refresh_token");
          }

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error("세션 설정 실패:", sessionError);
              throw sessionError;
            }

            console.log("카카오 로그인 성공");
            Alert.alert("성공", "카카오 로그인이 완료되었습니다.");
          } else {
            console.warn("토큰을 찾을 수 없습니다:", result.url);
            Alert.alert("오류", "로그인 토큰을 받아오지 못했습니다.");
          }
        } else if (result.type === "cancel") {
          console.log("카카오 로그인 취소됨");
        } else {
          console.warn("카카오 로그인 결과:", result.type);
        }
      } else {
        console.error("OAuth URL이 반환되지 않았습니다.");
        Alert.alert("오류", "로그인 URL을 받아오지 못했습니다.");
      }
    } catch (error: any) {
      console.error("카카오 로그인 예외:", error);
      Alert.alert("카카오 로그인 실패", error.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // 로그아웃 성공 시 사용자 상태 초기화
      setUser(null);
      setSession(null);
    } catch (error: any) {
      Alert.alert("로그아웃 실패", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 로그인 여부 확인
  const isAuthenticated = () => {
    return user !== null;
  };

  // 로그인이 필요한 기능 체크
  const requireAuth = (
    navigation: any,
    callback: () => void,
    message: string = "로그인이 필요한 기능입니다."
  ): boolean => {
    if (!user) {
      Alert.alert("로그인 필요", message, [
        { text: "취소", style: "cancel" },
        {
          text: "로그인",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
      return false;
    }
    callback();
    return true;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    requireAuth,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
