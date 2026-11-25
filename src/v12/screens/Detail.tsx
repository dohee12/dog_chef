"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 레시피 상세 (목업 openDetail / ingRow)
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LV, uniq } from "../logic/common";
import { josa } from "../logic/josa";
import { D, J, pet, SEED, state, toggleFav, type Pet, type RecipeId } from "../store";
import { Bold, C, Icon, Lvl, Rich, SrcChips, Txt } from "../ui/base";
import { RecipeVisual } from "./Home";

function Line({ icon, kind, children }: { icon: string; kind?: "allergy" | "warn" | "part"; children: React.ReactNode }) {
  const color = kind === "allergy" ? C.danger : kind === "warn" ? C.caution : kind === "part" ? "#8A4B00" : C.textLight;
  return (
    <View style={{ flexDirection: "row", gap: 6, marginTop: 5 }}>
      <Txt style={{ fontSize: 12, color }} lh={1.5}>{icon}</Txt>
      <Txt style={{ fontSize: 12, color, flex: 1, fontWeight: kind === "allergy" ? "700" : "400" }} lh={1.5}>{children}</Txt>
    </View>
  );
}

function IngRow({ it, j, p }: { it: any; j: any; p: Pet }) {
  const blocks = j.blocks.filter((b: any) => b.ing === it), warns = j.warns.filter((w: any) => w.ing === it), notes = j.notes.filter((n: any) => n.ing === it);
  const allergy = blocks.filter((b: any) => b.kind === "allergy");
  const ev: any[] = [];
  const lines: React.ReactNode[] = [];
  if (it.level === "danger" || it.level === "caution") {
    for (const r of [it.rule, ...it.extra]) {
      lines.push(<Line key={"r" + r.id} icon={it.level === "danger" ? "⛔" : "⚠️"} kind={it.level === "danger" ? "allergy" : "warn"}><Bold style={{ color: C.text }}>{r.label}</Bold> {r.reason}</Line>);
      ev.push(...(r.evidence || []));
    }
  } else if (it.level === "safe") {
    lines.push(<Line key="s" icon="✓">{it.rule.conditions || ""}{it.rule.basis === "pet_food_ingredient" ? <Txt style={{ fontSize: 12, fontStyle: "italic", color: C.textLight }}> (사료 원료로 쓰이는 재료)</Txt> : null}</Line>);
    ev.push(...(it.rule.evidence || []));
  } else lines.push(<Line key="u" icon="❔">근거 자료에서 찾지 못했어요. 괜찮다고 추정하지 않아요. 이 재료는 빼 주세요.</Line>);
  allergy.forEach((a: any, i: number) => lines.push(<Line key={"a" + i} icon="🚫" kind="allergy">{p.name}의 {a.text}에 해당해요.</Line>));
  blocks.filter((b: any) => b.kind === "breed").forEach((b: any, i: number) => { lines.push(<Line key={"b" + i} icon="🐕" kind="allergy">{p.breed}: {b.text}</Line>); ev.push(...(b.src.evidence || [])); });
  warns.filter((w: any) => w.kind === "cross" || w.kind === "condition" || w.kind === "lactose").forEach((w: any, i: number) => { lines.push(<Line key={"w" + i} icon={w.kind === "cross" ? "🔁" : "🩺"} kind="warn">{w.text}</Line>); ev.push(...(w.src.evidence || [])); });
  notes.forEach((n: any, i: number) => { lines.push(<Line key={"n" + i} icon="✂️" kind="part"><Bold style={{ color: C.text }}>{n.src.part}</Bold> {n.text}</Line>); ev.push(...(n.src.evidence || [])); });
  const petWarn = warns.some((w: any) => w.kind === "cross" || w.kind === "condition" || w.kind === "lactose");
  const pill = allergy.length ? <Lvl kind="no">{p.name} 알레르기</Lvl> : it.level === "safe" && petWarn ? <Lvl kind="caution">{p.name} 주의</Lvl> : <Lvl kind={it.level}>{LV[it.level]}</Lvl>;
  const blocked = it.level === "danger" || allergy.length;
  return (
    <View style={[s.ingRow, blocked && { borderColor: C.dangerBorder, backgroundColor: "#FFF8F8" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Txt style={{ fontSize: 13.5, fontWeight: "800", flex: 1 }}>{it.raw}</Txt>
        {pill}
      </View>
      {lines}
      {ev.length ? <SrcChips ev={ev} /> : null}
    </View>
  );
}

const VB: Record<string, [string, string, string]> = {
  ok: [C.safetyBg, "#B8E2D1", "#14432F"],
  caution: [C.cautionBg, "#F1D58F", "#4F3500"],
  no: [C.dangerBg, C.dangerBorder, "#7A1A12"],
  unknown: ["#F1F4F6", C.borderDark, "#3A4650"],
};
function Tip({ icon, warn, children }: { icon: string; warn?: boolean; children: React.ReactNode }) {
  return (
    <View style={[s.tip, warn && { backgroundColor: "#FFF8E1", borderColor: "#F1D58F" }]}>
      <Txt style={{ fontSize: 12 }} lh={1.5}>{icon}</Txt>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function DetailOverlay({ id, onClose }: { id: RecipeId; onClose: () => void }) {
  const r = SEED.recipes.find((x) => x.id === id)!, p = pet(), j = J.judgeRecipe(r.ingredients, p);
  const head = { ok: `✓ ${p.name}에게 괜찮은 레시피예요 (재료별 조건을 지켜 주세요)`, caution: `⚠️ ${p.name}에게 줄 때 주의할 점이 있어요`, no: `🚫 ${p.name}에게는 주지 마세요`, unknown: "❔ 확인 안 된 재료가 있어요" }[j.status];
  const blocked = new Set(j.blocks.map((b: any) => b.ing));
  const WK: Record<string, string> = { caution: "주의 재료", cross: "교차반응 주의", condition: "건강 상태 주의" };
  const reasons = uniq([
    ...j.blocks.map((b: any) => `${b.ing.n}: ${b.kind === "danger" ? "위험 재료" : b.text}`),
    ...j.warns.filter((w: any) => w.kind === "general").map((w: any) => w.src.label.split(" (")[0] + ": 수제 레시피는 수의사와 상의가 필요해요"),
    ...j.warns.filter((w: any) => w.ing && !blocked.has(w.ing)).map((w: any) => `${w.ing.n}: ${w.kind === "condition" ? w.src.label.split(" (")[0] + (w.byBreed ? " (품종)" : "") + " 주의" : w.kind === "lactose" ? "유당 민감 주의" : WK[w.kind]}`),
    ...j.unknown.map((u: any) => `${u.n}: 근거 자료 없음 (확인 안 됨)`),
  ]) as string[];
  const risks = J.petRisks(p);
  const startSmall = D.general_warnings.find((g: any) => g.id === "start-small");
  const fav = state.favs.has(r.id);
  const [bg, bd, fg] = VB[j.status];
  return (
    <View style={s.overlay}>
      <View style={s.head}>
        <Pressable onPress={onClose} style={s.back} hitSlop={6} accessibilityLabel="닫기">
          <Icon name="chevron-down" size={18} />
        </Pressable>
        <Txt style={{ fontSize: 15.5, fontWeight: "800", flex: 1 }} numberOfLines={1}>{r.title}</Txt>
        <Pressable onPress={() => toggleFav(r.id)} style={s.fav} accessibilityLabel="찜" accessibilityState={{ selected: fav }}>
          <Icon name={fav ? "heart" : "heart-outline"} size={22} color={fav ? "#E5484D" : C.textLight} />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <RecipeVisual r={r} height={170} />
        <View style={s.sec}>
          <View style={[s.verdict, { backgroundColor: bg, borderColor: bd }]}>
            <Txt style={{ fontSize: 14.5, fontWeight: "800", marginBottom: 4, color: fg }}>{head}</Txt>
            {reasons.length ? (
              reasons.map((x) => <Txt key={x} style={{ fontSize: 12.5, color: fg, marginLeft: 4 }} lh={1.5}>•  {x}</Txt>)
            ) : (
              <Txt style={{ fontSize: 12.5, color: fg }} lh={1.5}>{p.name}의 알레르기·건강 상태와 겹치는 재료가 없어요.</Txt>
            )}
          </View>
        </View>
        {risks.length ? (
          <View style={s.sec}>
            <Tip icon="🐕">
              {risks.map((h: any) => (
                <Txt key={h.id} style={s.tipTx} lh={1.5}>{josa(p.breed, "은/는")} <Bold>{h.label.split(" (")[0]}</Bold>에 잘 걸리는 품종으로 알려져 있어요. 관련 재료에 주의를 붙였어요.</Txt>
              ))}
              <SrcChips ev={risks.flatMap((h: any) => h.evidence || [])} ctx={risks.map((h: any) => h.message).join(" ")} />
            </Tip>
          </View>
        ) : null}
        {j.warns.filter((w: any) => w.kind === "general").map((w: any) => (
          <View style={s.sec} key={w.src.id}>
            <Tip icon="🩺" warn>
              <Txt style={[s.tipTx, { color: "#5C3B00" }]} lh={1.5}><Bold>{w.src.label.split(" (")[0]}</Bold>이 등록돼 있어요. {w.src.message}</Txt>
              <SrcChips ev={w.src.evidence || []} ctx={w.src.message} />
            </Tip>
          </View>
        ))}
        <View style={s.sec}>
          <Tip icon="🥄">
            <Txt style={s.tipTx} lh={1.5}>{startSmall.message}</Txt>
            <SrcChips ev={startSmall.evidence} />
          </Tip>
        </View>
        <View style={s.sec}>
          <View style={s.secTitle}>
            <Icon name="list" size={15} />
            <Txt style={{ fontSize: 13.5, fontWeight: "800" }}>재료별 판정 ({p.name} 기준)</Txt>
          </View>
          <Txt style={s.ppNote} lh={1.5}>출처 앞 글자는 근거 수준이에요. A 논문·수의 매뉴얼·국가 기준, B 전문 기관·병원 자료, C 일반 기사. 출처를 누르면 원문을 볼 수 있어요.</Txt>
          {j.items.map((it: any, i: number) => <IngRow key={i} it={it} j={j} p={p} />)}
        </View>
        {r.steps.length ? (
          <View style={s.sec}>
            <View style={s.secTitle}>
              <Icon name="restaurant-outline" size={15} />
              <Txt style={{ fontSize: 13.5, fontWeight: "800" }}>만드는 법</Txt>
            </View>
            {r.steps.map((st, i) => <StepItem key={i} n={i + 1} text={st} />)}
            <Txt style={s.ppNote} lh={1.5}>하루 급여량은 근거 자료가 부족해 아직 안내하지 않아요. 몸무게·활동량에 맞는 양은 동물병원에 물어봐 주세요.</Txt>
          </View>
        ) : null}
        <Rich style={{ fontSize: 12, color: C.textLight, paddingTop: 14, paddingHorizontal: 16 }} lh={1.5} s={`판정은 공개 논문·Merck 수의 매뉴얼·국립축산과학원 자료로 만든 근거 데이터로 계산했어요. 아직 수의사 감수를 받지 않았고, 진료를 대신하지 않아요.`} />
      </ScrollView>
    </View>
  );
}

export function StepItem({ n, text, onDelete }: { n: number; text: string; onDelete?: () => void }) {
  return (
    <View style={s.step}>
      <View style={s.stepNum}><Txt style={{ fontSize: 11, fontWeight: "800", color: C.primaryDark }}>{n}</Txt></View>
      <Txt style={{ flex: 1, fontSize: 13 }} lh={1.45}>{text}</Txt>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={13} style={{ marginLeft: 8 }} accessibilityLabel="지우기">
          <Icon name="close-circle" size={18} color="#EF4444" />
        </Pressable>
      ) : null}
    </View>
  );
}

export const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg, zIndex: 90 },
  head: { backgroundColor: "white", paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.lightBg, alignItems: "center", justifyContent: "center" },
  fav: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.lightBg, alignItems: "center", justifyContent: "center" },
  sec: { paddingTop: 14, paddingHorizontal: 16 },
  secTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  verdict: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1.5 },
  tip: { backgroundColor: C.tipBg, borderWidth: 1, borderColor: C.tipBorder, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row", gap: 8 },
  tipTx: { fontSize: 12, color: C.primaryDark },
  ingRow: { backgroundColor: "white", borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  step: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#F5F8FA", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 },
  ppNote: { fontSize: 12, color: C.textLight, marginTop: 6, marginBottom: 8 },
});
