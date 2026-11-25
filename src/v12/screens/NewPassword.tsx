"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 새 비밀번호 시트 (docs/new-password-options.html A안).
// recovery: 재설정 메일 링크로 돌아왔을 때 / change: 내 반려견 → 비밀번호 바꾸기.
// 입력값은 이 컴포넌트 state 에만 두고, 바꾸기에 성공하거나 시트를 닫으면(언마운트) 사라진다.
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { updatePassword } from "../lib/auth";
import { passwordError } from "../lib/password";
import { auth, closePasswordSheet, showToast } from "../store";
import { C, Icon, Txt } from "../ui/base";
import { PasswordInput, PasswordRules } from "./PasswordFields";
import { Sheet } from "./Pet";

export function NewPasswordSheet() {
  const kind = auth.pwSheet;
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setPw("");
    setPw2("");
    closePasswordSheet();
  };

  const submit = async () => {
    if (busy) return;
    const e = passwordError(pw);
    if (e) return setErr(e);
    if (pw !== pw2) return setErr("비밀번호 확인이 달라요. 같은 비밀번호를 넣어 주세요.");
    if (!auth.user) return setErr("링크가 만료됐어요. 비밀번호 재설정 메일을 다시 받아 주세요.");
    setErr("");
    setBusy(true);
    try {
      const m = await updatePassword(pw);
      if (m) {
        setErr(m);
        return;
      }
      setPw("");
      setPw2("");
      closePasswordSheet();
      showToast("비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요.");
    } finally {
      setBusy(false);
    }
  };

  const title = kind === "recovery" ? "새 비밀번호 설정" : "비밀번호 바꾸기";
  const note =
    kind === "recovery"
      ? "재설정 메일로 들어오셨어요. 앞으로 로그인할 때 쓸 비밀번호를 정해 주세요."
      : `${auth.user?.email || "이 계정"}의 비밀번호를 바꿔요.`;

  return (
    <Sheet onClose={close}>
      <View style={st.grab} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Txt style={{ fontSize: 17, fontWeight: "900", flex: 1 }} accessibilityRole="header">{title}</Txt>
        <Pressable onPress={close} hitSlop={10} accessibilityLabel="닫기"><Icon name="close" size={22} color={C.textLight} /></Pressable>
      </View>
      <Txt style={st.note} lh={1.5}>{note}</Txt>

      <Txt style={st.label}>새 비밀번호</Txt>
      <PasswordInput
        value={pw}
        onChangeText={(v) => { setPw(v); setErr(""); }}
        placeholder="새 비밀번호"
        autoComplete="new-password"
        accessibilityLabel="새 비밀번호"
        error={!!err && !/확인|만료|문제|연결/.test(err)}
      />
      <PasswordRules pw={pw} />

      <Txt style={st.label}>새 비밀번호 확인</Txt>
      <PasswordInput
        value={pw2}
        onChangeText={(v) => { setPw2(v); setErr(""); }}
        placeholder="한 번 더 넣어 주세요"
        autoComplete="new-password"
        accessibilityLabel="새 비밀번호 확인"
        onSubmitEditing={submit}
        error={!!err && /확인이 달라요/.test(err)}
      />
      {pw2 && pw === pw2 ? <Txt style={{ fontSize: 12.5, color: C.safety, fontWeight: "700", marginTop: 6 }}>✓ 두 비밀번호가 같아요</Txt> : null}
      {err ? <Txt style={st.err} accessibilityLiveRegion="polite">{err}</Txt> : null}

      <Pressable onPress={submit} disabled={busy} style={[st.btn, busy && { opacity: 0.7 }]} accessibilityRole="button">
        {busy ? <ActivityIndicator color="white" /> : <Txt style={{ fontSize: 15, fontWeight: "800", color: "white" }}>비밀번호 바꾸기</Txt>}
      </Pressable>
    </Sheet>
  );
}

const st = StyleSheet.create({
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", alignSelf: "center", marginBottom: 12 },
  note: { fontSize: 12.5, color: C.primaryDark, backgroundColor: C.primaryLight, borderRadius: 12, padding: 12, marginTop: 10 },
  label: { fontSize: 13, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  err: { color: C.danger, fontSize: 12.5, fontWeight: "700", marginTop: 6 },
  btn: { height: 50, borderRadius: 14, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginTop: 16 },
});
