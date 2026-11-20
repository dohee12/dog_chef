import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api, setSession, updateSessionUser } from "@/lib/api";
import { confirmAsync, notify } from "@/lib/dialog";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Profile {
  id: string;
  email: string;
  nickname: string | null;
  created_at: string;
  stats: { recipes: number; pets: number; likes: number; reviews: number };
}

const message = (e: unknown) => (e instanceof ApiError ? e.message : String(e));

export default function ProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [deletePw, setDeletePw] = useState("");
  const [busy, setBusy] = useState<"" | "nickname" | "password" | "delete">("");

  const load = useCallback(async () => {
    try {
      const p = await api.get<Profile>("/users/me");
      setProfile(p);
      setNickname(p.nickname ?? "");
    } catch (e) {
      notify("프로필을 불러오지 못했습니다", message(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>로그인이 필요합니다.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.primaryButtonText}>로그인</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const saveNickname = async () => {
    setBusy("nickname");
    try {
      const p = await api.patch<Profile>("/users/me", { nickname: nickname.trim() || null });
      setProfile(p);
      await updateSessionUser({ id: p.id, email: p.email, nickname: p.nickname });
      notify("저장했습니다", p.nickname ? `이제 리뷰에 '${p.nickname}'(으)로 표시됩니다.` : "닉네임을 지웠습니다.");
    } catch (e) {
      notify("닉네임 저장 실패", message(e));
    } finally {
      setBusy("");
    }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw) {
      notify("현재 비밀번호와 새 비밀번호를 모두 입력해주세요.");
      return;
    }
    setBusy("password");
    try {
      await api.patch("/users/me/password", { current_password: currentPw, new_password: newPw });
      setCurrentPw("");
      setNewPw("");
      notify("비밀번호를 바꿨습니다");
    } catch (e) {
      notify("비밀번호 변경 실패", message(e));
    } finally {
      setBusy("");
    }
  };

  const deleteAccount = async () => {
    if (!deletePw) {
      notify("본인 확인을 위해 비밀번호를 입력해주세요.");
      return;
    }
    const ok = await confirmAsync(
      "회원 탈퇴",
      "반려견, 내가 올린 레시피, 찜, 리뷰가 모두 지워지고 되돌릴 수 없습니다. 탈퇴할까요?",
      "탈퇴",
      true
    );
    if (!ok) return;
    setBusy("delete");
    try {
      // 본문이 있는 DELETE 요청
      await api.deleteWithBody("/users/me", { password: deletePw });
      await setSession(null, null);
      notify("탈퇴했습니다", "그동안 이용해 주셔서 감사합니다.");
      navigation.navigate("MainTabs");
    } catch (e) {
      notify("탈퇴 실패", message(e));
    } finally {
      setBusy("");
    }
  };

  const stats = profile?.stats;

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile?.nickname || "닉네임 없음"}</Text>
              <Text style={styles.muted} numberOfLines={1}>{profile?.email}</Text>
            </View>
          </View>
          {stats && (
            <View style={styles.statsRow}>
              {[
                ["레시피", stats.recipes],
                ["반려견", stats.pets],
                ["찜", stats.likes],
                ["리뷰", stats.reviews],
              ].map(([label, n]) => (
                <View key={label as string} style={styles.stat}>
                  <Text style={styles.statValue}>{n}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>닉네임</Text>
          <Text style={styles.help}>리뷰에 표시되는 이름입니다. 비워 두면 이메일 앞 두 글자만 보입니다.</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="2~20자"
            maxLength={20}
            accessibilityLabel="닉네임"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={saveNickname} disabled={busy !== ""}>
            {busy === "nickname" ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>닉네임 저장</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>비밀번호 변경</Text>
          <TextInput
            style={styles.input}
            value={currentPw}
            onChangeText={setCurrentPw}
            placeholder="현재 비밀번호"
            secureTextEntry
            accessibilityLabel="현재 비밀번호"
          />
          <TextInput
            style={styles.input}
            value={newPw}
            onChangeText={setNewPw}
            placeholder="새 비밀번호 (6자 이상)"
            secureTextEntry
            accessibilityLabel="새 비밀번호"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={changePassword} disabled={busy !== ""}>
            {busy === "password" ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>비밀번호 변경</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>회원 탈퇴</Text>
          <Text style={styles.help}>반려견, 내가 올린 레시피, 찜, 리뷰가 모두 지워집니다.</Text>
          <TextInput
            style={styles.input}
            value={deletePw}
            onChangeText={setDeletePw}
            placeholder="비밀번호 확인"
            secureTextEntry
            accessibilityLabel="탈퇴 확인 비밀번호"
          />
          <TouchableOpacity style={styles.dangerButton} onPress={deleteAccount} disabled={busy !== ""}>
            {busy === "delete" ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>탈퇴하기</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, maxWidth: 560, width: "100%", alignSelf: "center" },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  dangerCard: { borderColor: "#F3C5C0" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 18, fontWeight: "700", color: Colors.text },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  statsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  statLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  help: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  input: { backgroundColor: Colors.lightBackground, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: Colors.text },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center", minHeight: 44, justifyContent: "center" },
  dangerButton: { backgroundColor: Colors.error, borderRadius: 8, paddingVertical: 12, alignItems: "center", minHeight: 44, justifyContent: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
