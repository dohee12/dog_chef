"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// AI 멍셰프 대화창과 출처 시트 (목업 chat-modal-view / openSource)
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { chatMsgs, sendChat, type ChatNode } from "../logic/chat";
import { srcShort, TIER } from "../logic/common";
import { bump, D, pet, state } from "../store";
import { C, Fold, Icon, Rich, shadow, SrcChips, Txt } from "../ui/base";
import { Sheet } from "./Pet";

const PROMPTS: [string, string][] = [
  ["🍇 포도 1알?", "포도 1알 먹었는데 괜찮아?"],
  ["🫑 파프리카?", "파프리카 먹여도 돼?"],
  ["🍒 체리?", "체리 줘도 돼?"],
  ["🫙 참기름?", "참기름 넣어도 돼?"],
  ["🐟 연어?", "연어 먹여도 돼?"],
  ["🍗 닭가슴살 양?", "닭가슴살 하루에 몇 g 먹여야 해?"],
  ["🌿 민트?", "민트 먹여도 돼?"],
];

function Node({ n, user }: { n: ChatNode; user?: boolean }) {
  const fg = user ? "white" : C.text;
  switch (n.t) {
    case "text":
      return <Rich s={n.s} style={{ fontSize: 13.5, color: fg }} lh={1.5} />;
    case "note":
      return <Txt style={{ fontSize: 12.5, color: C.textLight, marginBottom: 4 }}>{n.s}</Txt>;
    case "calc":
      return (
        <View style={{ marginTop: 8, marginBottom: 2, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: n.lv === 3 ? C.dangerBg : n.lv === 2 ? "#FFEFE3" : "#FFF8E1" }}>
          <Rich s={n.s} style={{ fontSize: 13 }} lh={1.5} />
        </View>
      );
    case "action":
      return (
        <Pressable onPress={n.act} style={[s.action, n.ghost && { backgroundColor: C.primary }]}>
          <Txt style={{ fontSize: 12.5, fontWeight: "800", color: "white" }}>{n.label}</Txt>
        </Pressable>
      );
    case "chips":
      return <SrcChips ev={n.ev} ctx={n.ctx} style={{ marginTop: 8, gap: 6 }} />;
    case "badge":
      return (
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <View style={s.fact}><Txt style={{ fontSize: 12, fontWeight: "700", color: C.primaryDark }}>{n.s}</Txt></View>
        </View>
      );
  }
}

export function ChatModal() {
  const p = pet();
  const [q, setQ] = useState("");
  const scroll = useRef<ScrollView>(null);
  const send = (text: string) => { sendChat(text); setQ(""); };
  return (
    <View style={s.modal}>
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={s.titleIcon}><Icon name="paw" size={18} color={C.primaryDark} /></View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 16.5, fontWeight: "800" }}>AI 멍셰프 재료 문답</Txt>
            <Txt style={{ fontSize: 11.5, color: C.textLight, marginTop: 1 }}>{p.name} ({p.weight}kg) 기준 · 근거 데이터 검색</Txt>
          </View>
        </View>
        <Pressable onPress={() => { state.chatOpen = false; bump(); }} style={s.close} hitSlop={6} accessibilityLabel="닫기">
          <Icon name="close" size={20} color={C.textLight} />
        </Pressable>
      </View>
      <View style={s.pipeline}>
        <Icon name="shield-checkmark" size={14} color={C.safety} />
        <Txt style={{ fontSize: 11, fontWeight: "700", color: C.primaryDark, flex: 1 }}>
          질문 → <Txt style={{ fontSize: 11, fontWeight: "900", color: C.primaryDark }}>근거 데이터에서 재료 찾기</Txt> → 우리 아이 정보로 판정 → 출처와 함께 답변
        </Txt>
      </View>
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {chatMsgs.map((m, i) =>
          m.who === "user" ? (
            <View key={i} style={[s.row, { alignSelf: "flex-end" }]}>
              <View style={[s.bubble, s.user]}>
                {m.nodes.map((n, k) => <Node key={k} n={n} user />)}
              </View>
            </View>
          ) : (
            <View key={i} style={[s.row, { alignSelf: "flex-start" }]}>
              <View style={s.avatar}><Txt style={{ fontSize: 18 }}>🐶</Txt></View>
              <View style={[s.bubble, s.bot]}>
                {m.nodes.map((n, k) => <Node key={k} n={n} />)}
              </View>
            </View>
          ),
        )}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.promptRow} contentContainerStyle={{ gap: 6, paddingVertical: 10, paddingHorizontal: 14 }}>
        {PROMPTS.map(([lb, qq]) => (
          <Pressable key={lb} onPress={() => send(qq)} style={s.prompt}>
            <Txt style={{ fontSize: 12, fontWeight: "700", color: C.textLight }}>{lb}</Txt>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.inputBar}>
        <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => send(q)} returnKeyType="send" placeholder="궁금한 재료를 물어보세요 (예: 아보카도, 고구마)" placeholderTextColor="#8A97A1" style={s.input} />
        <Pressable onPress={() => send(q)} style={s.send} accessibilityLabel="보내기"><Icon name="send" size={18} color="white" /></Pressable>
      </View>
    </View>
  );
}

export function SourceSheet() {
  const { sid, quotes, ctx } = state.source!;
  const src = D.sources[sid] || {};
  const close = () => { state.source = null; bump(); };
  return (
    <Sheet onClose={close}>
      <View style={[s.tier, src.tier === "C" && { backgroundColor: "#EEF1F4" }]}>
        <Txt style={{ fontSize: 12, fontWeight: "800", color: src.tier === "C" ? C.gray : C.primaryDark }}>{TIER[src.tier] || ""}</Txt>
      </View>
      <Txt style={{ fontSize: 15, fontWeight: "800", marginBottom: 6 }}>{srcShort(sid)}</Txt>
      {ctx ? (
        <View style={s.ctx}>
          <Txt style={{ fontSize: 13.5 }} lh={1.55}><Txt style={{ fontSize: 13.5, fontWeight: "800" }}>이 자료로 판단한 내용</Txt>{"\n"}{ctx}</Txt>
        </View>
      ) : null}
      <Txt style={s.meta} lh={1.5}>{[src.authors, src.journal || src.publisher, src.year || src.updated].filter(Boolean).join(" · ")}</Txt>
      {quotes.length ? (
        <Fold
          style={{ marginVertical: 6 }}
          summaryStyle={{ minHeight: 40, justifyContent: "center" }}
          summary={(o) => <Txt style={{ fontSize: 13, fontWeight: "800", color: C.primary }}>{o ? "▾ " : "▸ "}원문 문장 보기 ({/[가-힣]/.test(quotes[0]) ? "한국어" : "영어"} {quotes.length}개)</Txt>}
        >
          {quotes.map((qt, i) => (
            <View key={i} style={s.quote}><Txt style={{ fontSize: 12, fontStyle: "italic" }} lh={1.5}>&quot;{qt}&quot;</Txt></View>
          ))}
          <Txt style={s.meta} lh={1.5}>{src.title || ""}</Txt>
        </Fold>
      ) : (
        <Txt style={s.meta} lh={1.5}>이 항목은 원문 문장 인용 없이 출처 전체(표·통계)를 근거로 썼어요.</Txt>
      )}
      {src.url ? (
        <Pressable onPress={() => Linking.openURL(src.url)} style={s.link}>
          <Txt style={{ fontSize: 13.5, fontWeight: "800", color: C.primary, textAlign: "center" }}>원문 사이트 열기 ↗</Txt>
        </Pressable>
      ) : null}
      <Pressable onPress={close} style={s.closeBtn}><Txt style={{ fontWeight: "800" }}>닫기</Txt></Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  modal: { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg, zIndex: 100 },
  header: { backgroundColor: "white", paddingVertical: 14, paddingHorizontal: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border },
  titleIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.lightBg, alignItems: "center", justifyContent: "center" },
  pipeline: { backgroundColor: C.tipBg, paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 6 },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-start", maxWidth: "90%" },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center", marginTop: 2 },
  bubble: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, flexShrink: 1 },
  bot: { backgroundColor: "white", borderWidth: 1, borderColor: C.border, borderTopLeftRadius: 4, ...shadow(2, 6, "#000", 0.03, 1) },
  user: { backgroundColor: C.primary, borderTopRightRadius: 4, ...shadow(2, 8, C.primary, 0.25, 2) },
  action: { marginTop: 8, alignSelf: "flex-start", backgroundColor: C.danger, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, minHeight: 36, justifyContent: "center" },
  fact: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, backgroundColor: "#E8F4F8", borderWidth: 1, borderColor: C.tipBorder },
  promptRow: { flexGrow: 0, backgroundColor: "white", borderTopWidth: 1, borderTopColor: C.border },
  prompt: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.border },
  inputBar: { backgroundColor: "white", paddingTop: 10, paddingHorizontal: 14, paddingBottom: 14, flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: C.border },
  input: { flex: 1, backgroundColor: C.lightBg, borderWidth: 1.5, borderColor: "transparent", borderRadius: 22, paddingVertical: 10, paddingHorizontal: 16, fontSize: 13.5, color: C.text },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", ...shadow(2, 8, C.primary, 0.3, 2) },
  tier: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8, marginBottom: 8, backgroundColor: C.primaryLight },
  ctx: { backgroundColor: C.tipBg, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginTop: 6, marginBottom: 10 },
  meta: { fontSize: 11.5, color: C.textLight, marginBottom: 10 },
  quote: { backgroundColor: C.lightBg, borderLeftWidth: 3, borderLeftColor: C.primary, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, marginBottom: 8 },
  link: { padding: 12, borderWidth: 1, borderColor: C.border, borderRadius: 10, marginTop: 6 },
  closeBtn: { width: "100%", marginTop: 8, padding: 11, borderRadius: 10, backgroundColor: C.lightBg, alignItems: "center" },
});
