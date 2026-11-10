import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "../constants/Colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithKakao, loading } =
    useAuth();
  const navigation = useNavigation();

  const handleEmailAuth = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    const ok = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    // 성공하면 로그인 창을 닫고 보던 화면으로 돌아간다
    if (ok) {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate("MainTabs" as never);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 로고/타이틀 영역 */}
        <View style={styles.header}>
          <Ionicons name="paw" size={80} color={Colors.primary} />
          <Text style={styles.title}>멍슐랭</Text>
          <Text style={styles.subtitle}>반려견을 위한 레시피 플랫폼</Text>
        </View>

        {/* 이메일 로그인 폼 */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {isSignUp ? "회원가입" : "로그인"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? "회원가입" : "로그인"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.toggleButtonText}>
              {isSignUp
                ? "이미 계정이 있으신가요? 로그인"
                : "계정이 없으신가요? 회원가입"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 구분선 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 소셜 로그인 버튼들 */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={signInWithGoogle}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={24} color="#fff" />
            <Text style={styles.socialButtonText}>구글로 계속하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={signInWithKakao}
            disabled={loading}
          >
            <Ionicons name="chatbubble" size={24} color="#3C1E1E" />
            <Text style={[styles.socialButtonText, { color: "#3C1E1E" }]}>
              카카오로 계속하기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 안내 문구 */}
        <Text style={styles.disclaimer}>
          로그인하면 멍슐랭의 서비스 이용약관 및{"\n"}
          개인정보 처리방침에 동의하게 됩니다.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  formContainer: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 16,
    alignItems: "center",
  },
  toggleButtonText: {
    color: Colors.primary,
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  googleButton: {
    backgroundColor: "#4285F4",
  },
  kakaoButton: {
    backgroundColor: "#FEE500",
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimer: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
});
