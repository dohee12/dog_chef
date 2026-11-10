import {
  ApiError,
  AuthUser,
  api,
  onAuthChange,
  restoreSession,
  setSession,
} from "@/lib/api";
import { confirmAsync, notify } from "@/lib/dialog";
import React, { createContext, useContext, useEffect, useState } from "react";

export type User = AuthUser;

interface AuthContextType {
  user: User | null;
  /** 앱 시작 시 저장된 로그인을 확인하는 동안만 true */
  initializing: boolean;
  /** 로그인/회원가입 요청 중 (버튼 스피너용) */
  loading: boolean;
  /** 성공하면 true */
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
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

interface AuthResponse {
  access_token: string;
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    restoreSession().then((restored) => {
      setUser(restored);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const authenticate = async (
    path: "/auth/signup" | "/auth/login",
    email: string,
    password: string
  ) => {
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>(path, { email, password });
      await setSession(res.access_token, res.user);
      return true;
    } catch (error) {
      const title = path === "/auth/signup" ? "회원가입 실패" : "로그인 실패";
      notify(title, error instanceof ApiError ? error.message : String(error));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = (email: string, password: string) =>
    authenticate("/auth/signup", email, password);

  const signIn = (email: string, password: string) =>
    authenticate("/auth/login", email, password);

  // 소셜 로그인은 백엔드에 아직 없다. 버튼은 남겨 두고 안내만 한다.
  const signInWithGoogle = async () => {
    notify("준비 중", "구글 로그인은 준비 중입니다. 이메일로 로그인해주세요.");
  };

  const signInWithKakao = async () => {
    notify("준비 중", "카카오 로그인은 준비 중입니다. 이메일로 로그인해주세요.");
  };

  // JWT 는 서버에 상태가 없어서, 기기에서 토큰을 지우면 로그아웃이다.
  const signOut = async () => {
    await setSession(null, null);
  };

  const isAuthenticated = () => user !== null;

  const requireAuth = (
    navigation: any,
    callback: () => void,
    message: string = "로그인이 필요한 기능입니다."
  ): boolean => {
    if (!user) {
      confirmAsync("로그인 필요", message, "로그인").then((ok) => {
        if (ok) navigation.navigate("Login");
      });
      return false;
    }
    callback();
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithKakao,
        signOut,
        requireAuth,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
