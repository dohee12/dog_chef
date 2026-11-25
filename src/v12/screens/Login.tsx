"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 로그인 시트 (docs/login-options.html A안): 저장이 필요한 동작을 누르면 보던 화면 위로 올라온다.
// 로그인·회원가입은 위쪽 탭으로 바꾸고, 비밀번호 재설정 메일도 여기서 보낸다. 카카오·Google 은 준비 중(비활성).
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { sendPasswordReset, signIn, signUp } from "../lib/auth";
import { passwordError } from "../lib/password";
import { auth, closeLoginSheet, showToast } from "../store";
import { C, Icon, Txt } from "../ui/base";
import { PasswordInput, PasswordRules } from "./PasswordFields";
import { Sheet } from "./Pet";

type Mode = "login" | "signup" | "reset";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginSheet() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(""); // 메일을 보냈다는 안내
  const [busy, setBusy] = useState(false);
  const reason = auth.sheet?.reason || "";

  // 탭을 바꾸면 비밀번호 칸은 비운다 (시트를 닫으면 컴포넌트가 사라지며 전부 비워진다).
  const go = (m: Mode) => { setMode(m); setErr(""); setDone(""); setPw(""); setPw2(""); };

  const submit = async () => {
    if (busy) return;
    const e = email.trim();
    if (!EMAIL_RE.test(e)) return setErr("이메일 주소 형식을 확인해 주세요.");
    // 로그인은 예전 규칙으로 만든 비밀번호도 있을 수 있어 비었는지만 본다. 가입은 공통 규칙을 따른다.
    if (mode === "login" && !pw) return setErr("비밀번호를 넣어 주세요.");
    if (mode === "signup") {
      const pe = passwordError(pw);
      if (pe) return setErr(pe);
      if (pw !== pw2) return setErr("비밀번호 확인이 달라요. 같은 비밀번호를 넣어 주세요.");
    }
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") {
        const m = await signIn(e, pw);
        if (m) setErr(m);
        else { setPw(""); showToast("로그인했어요."); }
        // 성공하면 onAuthStateChange → setAuthUser 가 시트를 닫고 하려던 동작을 이어서 한다.
      } else if (mode === "signup") {
        const r = await signUp(e, pw);
        if (!r.error) { setPw(""); setPw2(""); }
        if (r.error) setErr(r.error);
        else if (r.needConfirm) setDone(`${e} 로 가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.`);
        else showToast("가입하고 로그인했어요.");
      } else {
        const m = await sendPasswordReset(e);
        if (m) setErr(m);
        else setDone(`${e} 로 비밀번호 재설정 메일을 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "reset" ? "비밀번호 재설정" : "로그인하고 저장해요";
  const btn = mode === "login" ? "로그인" : mode === "signup" ? "가입하기" : "재설정 메일 보내기";

  return (
    <Sheet onClose={closeLoginSheet}>
      <View style={st.grab} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {mode === "reset" ? (
          <Pressable onPress={() => go("login")} hitSlop={10} accessibilityLabel="로그인으로 돌아가기" style={{ marginRight: 6 }}>
            <Icon name="chevron-back" size={20} />
          </Pressable>
        ) : null}
        <Txt style={{ fontSize: 17, fontWeight: "900", flex: 1 }} accessibilityRole="header">{title}</Txt>
        <Pressable onPress={closeLoginSheet} hitSlop={10} accessibilityLabel="닫기"><Icon name="close" size={22} color={C.textLight} /></Pressable>
      </View>

      {mode === "reset" ? (
        <Txt style={st.why} lh={1.5}>가입한 이메일을 넣으면 비밀번호를 새로 정하는 링크를 보내 드려요.</Txt>
      ) : (
        <View style={st.whyRow}>
          <Icon name="heart" size={14} color={C.primaryDark} style={{ marginTop: 2 }} />
          <Txt style={{ flex: 1, fontSize: 12.5, color: C.primaryDark }} lh={1.5}>{reason}</Txt>
        </View>
      )}

      {mode !== "reset" ? (
        <View style={st.seg} accessibilityRole="tablist">
          {(["login", "signup"] as const).map((k) => (
            <Pressable key={k} onPress={() => go(k)} style={[st.segBtn, mode === k && st.segOn]} accessibilityRole="tab" accessibilityState={{ selected: mode === k }}>
              <Txt style={{ fontSize: 13.5, fontWeight: "700", color: mode === k ? C.primaryDark : C.textLight }}>{k === "login" ? "로그인" : "회원가입"}</Txt>
            </Pressable>
          ))}
        </View>
      ) : null}

      {done ? (
        <View style={st.done} accessibilityLiveRegion="polite">
          <Icon name="mail-outline" size={18} color={C.safety} />
          <Txt style={{ flex: 1, fontSize: 13, color: C.safety, fontWeight: "700" }} lh={1.5}>{done}</Txt>
        </View>
      ) : null}

      <Txt style={st.label}>이메일</Txt>
      <TextInput
        style={[st.input, !!err && /이메일/.test(err) && st.inputErr]}
        value={email}
        onChangeText={(v) => { setEmail(v); setErr(""); }}
        placeholder="you@example.com"
        placeholderTextColor="#8A97A1"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        inputMode="email"
        accessibilityLabel="이메일"
        onSubmitEditing={mode === "reset" ? submit : undefined}
      />
      {mode !== "reset" ? (
        <>
          <Txt style={st.label}>비밀번호</Txt>
          <PasswordInput
            error={!!err && /비밀번호/.test(err) && !/확인이 달라요/.test(err)}
            value={pw}
            onChangeText={(v) => { setPw(v); setErr(""); }}
            placeholder="비밀번호"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            accessibilityLabel="비밀번호"
            onSubmitEditing={mode === "login" ? submit : undefined}
          />
          {mode === "signup" ? <PasswordRules pw={pw} /> : null}
        </>
      ) : null}
      {mode === "signup" ? (
        <>
          <Txt style={st.label}>비밀번호 확인</Txt>
          <PasswordInput
            error={!!err && /확인이 달라요/.test(err)}
            value={pw2}
            onChangeText={(v) => { setPw2(v); setErr(""); }}
            placeholder="비밀번호를 한 번 더"
            autoComplete="new-password"
            accessibilityLabel="비밀번호 확인"
            onSubmitEditing={submit}
          />
        </>
      ) : null}
      {err ? <Txt style={st.err} accessibilityLiveRegion="polite">{err}</Txt> : null}

      <Pressable onPress={submit} disabled={busy} style={[st.btn, busy && { opacity: 0.7 }]} accessibilityRole="button">
        {busy ? <ActivityIndicator color="white" /> : <Txt style={{ fontSize: 15, fontWeight: "800", color: "white" }}>{btn}</Txt>}
      </Pressable>

      {mode === "login" ? (
        <Pressable onPress={() => go("reset")} style={{ alignSelf: "center", marginTop: 10, minHeight: 36, justifyContent: "center" }}>
          <Txt style={st.link}>비밀번호를 잊었어요</Txt>
        </Pressable>
      ) : null}

      {mode !== "reset" ? (
        <View style={{ marginTop: 8 }}>
          <View style={st.social} accessibilityState={{ disabled: true }}><Txt style={st.socialTx}>카카오로 시작하기 (준비 중)</Txt></View>
          <View style={st.social} accessibilityState={{ disabled: true }}><Txt style={st.socialTx}>Google로 시작하기 (준비 중)</Txt></View>
        </View>
      ) : null}
    </Sheet>
  );
}

const st = StyleSheet.create({
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", alignSelf: "center", marginBottom: 12 },
  why: { fontSize: 12.5, color: C.primaryDark, backgroundColor: C.primaryLight, borderRadius: 12, padding: 12, marginTop: 10 },
  whyRow: { flexDirection: "row", gap: 8, backgroundColor: C.primaryLight, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginTop: 10 },
  seg: { flexDirection: "row", backgroundColor: C.lightBg, borderRadius: 12, padding: 3, marginTop: 12 },
  segBtn: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  done: { flexDirection: "row", gap: 8, backgroundColor: C.safetyBg, borderRadius: 12, padding: 12, marginTop: 12 },
  label: { fontSize: 13, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  input: { height: 48, backgroundColor: "white", borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: C.text },
  inputErr: { borderColor: C.danger },
  err: { color: C.danger, fontSize: 12.5, fontWeight: "700", marginTop: 6 },
  btn: { height: 50, borderRadius: 14, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginTop: 16 },
  link: { color: C.primary, fontWeight: "700", fontSize: 13 },
  social: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: "white", alignItems: "center", justifyContent: "center", marginTop: 8 },
  socialTx: { fontSize: 13.5, fontWeight: "700", color: C.borderDark },
});
