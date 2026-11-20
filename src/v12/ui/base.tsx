"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 목업 CSS 의 공통 조각을 React Native 로 옮긴 것: 색, 글자, 아이콘, 판정 배지, 출처 칩, 접기
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { createContext, useContext, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { groupSources, srcShort } from "../logic/common";
import { openSource, type Pet } from "../store";

export const C = {
  primary: "#1D5C7A",
  primaryLight: "#E2EEF4",
  primaryDark: "#123F55",
  bg: "#F5F8FA",
  lightBg: "#EEF3F6",
  card: "#FFFFFF",
  text: "#14212B",
  textLight: "#52616D",
  gray: "#4A5560",
  border: "#DDE5EA",
  borderDark: "#B8C6CF",
  safety: "#1E6B4F",
  safetyBg: "#E1F1EA",
  caution: "#7A4F00",
  cautionBg: "#FDF3DC",
  danger: "#B42318",
  dangerBg: "#FDECEC",
  dangerBorder: "#F3B8B8",
  tipBg: "#F0F6FA",
  tipBorder: "#C4DFEC",
};

// 큰 글씨 모드: 본문 영역만 1.18배 (목업의 zoom:1.18)
export const ScaleCtx = createContext(1);

type TxtProps = React.ComponentProps<typeof Text> & { lh?: number };
/** 목업 글자. fontSize 에 큰 글씨 배율을 곱하고, lh 는 CSS line-height 배수다. */
export function Txt({ style, lh, ...rest }: TxtProps) {
  const k = useContext(ScaleCtx);
  const s = (StyleSheet.flatten(style) || {}) as TextStyle;
  const fs = (s.fontSize || 14) * k;
  const o: TextStyle = { ...s, fontSize: fs };
  if (lh) o.lineHeight = fs * lh;
  else if (s.lineHeight) o.lineHeight = s.lineHeight * k;
  return <Text {...rest} style={[{ color: C.text }, o]} />;
}
/** **굵게** 표시와 줄바꿈이 섞인 글 */
export function Rich({ s, style, lh, boldStyle }: { s: string; style?: StyleProp<TextStyle>; lh?: number; boldStyle?: TextStyle }) {
  const parts = s.split(/\*\*/);
  return (
    <Txt style={style} lh={lh}>
      {parts.map((p, i) =>
        i % 2 ? (
          <Text key={i} style={[{ fontWeight: "800" }, boldStyle]}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Txt>
  );
}
export const Bold = ({ children, style }: { children: React.ReactNode; style?: TextStyle }) => (
  <Text style={[{ fontWeight: "800" }, style]}>{children}</Text>
);

/** 아이콘: 기본은 Ionicons, "mci:" 로 시작하면 MaterialCommunityIcons */
export function Icon({ name, size = 18, color = C.text, style }: { name: string; size?: number; color?: string; style?: any }) {
  if (name.startsWith("mci:")) return <MaterialCommunityIcons name={name.slice(4) as any} size={size} color={color} style={style} />;
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
}

const LVL: Record<string, [string, string]> = {
  safe: [C.safetyBg, C.safety],
  ok: [C.safetyBg, C.safety],
  caution: [C.cautionBg, C.caution],
  danger: [C.dangerBg, C.danger],
  no: [C.dangerBg, C.danger],
  unknown: ["#EEF1F4", "#5B6670"],
};
/** 판정 배지 (.lvl) */
export function Lvl({ kind, children, style }: { kind: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const [bg, fg] = LVL[kind] || LVL.unknown;
  return (
    <View style={[{ backgroundColor: bg, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start" }, style]}>
      <Txt style={{ fontSize: 12, fontWeight: "800", color: fg }} numberOfLines={1}>
        {children}
      </Txt>
    </View>
  );
}

/** 출처 칩 (.src-row .src-chip). 누르면 출처 시트가 열린다 */
export function SrcChips({ ev, ctx, style }: { ev: any[]; ctx?: string; style?: StyleProp<ViewStyle> }) {
  const list = groupSources(ev);
  if (!list.length) return null;
  return (
    <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }, style]}>
      {list.map((g) => (
        <Pressable
          key={g.sid}
          onPress={() => openSource(g.sid, g.quotes, ctx)}
          hitSlop={8}
          style={{ backgroundColor: "#E8F4F8", borderColor: C.tipBorder, borderWidth: 1, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 }}
        >
          <Txt style={{ fontSize: 12, fontWeight: "700", color: C.primaryDark }}>
            <Text style={{ fontWeight: "900" }}>{g.tier} </Text>
            {srcShort(g.sid)}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

/** <details> 접기 */
export function Fold({
  summary,
  children,
  initial = false,
  style,
  summaryStyle,
}: {
  summary: (open: boolean) => React.ReactNode;
  children: React.ReactNode;
  initial?: boolean;
  style?: StyleProp<ViewStyle>;
  summaryStyle?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(initial);
  return (
    <View style={style}>
      <Pressable onPress={() => setOpen(!open)} style={summaryStyle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        {summary(open)}
      </Pressable>
      {open ? children : null}
    </View>
  );
}

/** 반려견 얼굴. 사진이 없으면 🐶 */
export function Avatar({ p, size, style }: { p: Pet; size: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" }, style]}>
      {p.img ? (
        <Image source={{ uri: p.img }} style={{ width: size, height: size }} contentFit="cover" accessibilityLabel={p.name} />
      ) : (
        <Text style={{ fontSize: size * 0.55 }}>🐶</Text>
      )}
    </View>
  );
}

export const shadow = (y: number, blur: number, color: string, opacity: number, elevation = 3): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowRadius: blur / 2,
  shadowOpacity: opacity,
  elevation,
});
