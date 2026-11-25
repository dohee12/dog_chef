"use no memo";
// 비밀번호 칸(보기/숨기기 눈 아이콘)과 규칙 체크리스트. 로그인 시트와 새 비밀번호 시트가 같이 쓴다.
// 비밀번호 값은 부모 컴포넌트의 useState 에만 있고, 화면이 닫히면(언마운트) 같이 사라진다.
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { passwordRules } from "../lib/password";
import { C, Icon, Txt } from "../ui/base";

export function PasswordInput({ error, ...rest }: Omit<TextInputProps, "secureTextEntry" | "style"> & { error?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <View style={[pf.box, error && { borderColor: C.danger }]}>
      <TextInput
        {...rest}
        style={pf.input}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholderTextColor="#8A97A1"
      />
      <Pressable
        onPress={() => setShow(!show)}
        style={pf.eye}
        accessibilityRole="button"
        accessibilityLabel={show ? "비밀번호 숨기기" : "비밀번호 보기"}
        accessibilityState={{ selected: show }}
      >
        <Icon name={show ? "eye-off-outline" : "eye-outline"} size={20} color={C.textLight} />
      </Pressable>
    </View>
  );
}

/** 입력하는 동안 규칙을 하나씩 ✓ 로 바꿔 보여 준다. */
export function PasswordRules({ pw }: { pw: string }) {
  return (
    <View style={{ marginTop: 8, gap: 3 }} accessibilityLabel="비밀번호 규칙">
      {passwordRules(pw).map((r) => (
        <View key={r.key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name={r.ok ? "checkmark-circle" : "ellipse-outline"} size={15} color={r.ok ? C.safety : C.textLight} />
          <Txt style={{ fontSize: 12.5, color: r.ok ? C.safety : C.textLight, fontWeight: r.ok ? "700" : "400" }}>
            {r.label}{r.ok ? "" : " (아직)"}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const pf = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", height: 48, backgroundColor: "white", borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingLeft: 14, paddingRight: 2 },
  input: { flex: 1, height: "100%", fontSize: 15, color: C.text },
  eye: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
