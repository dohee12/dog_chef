"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 레시피 등록 (목업 renderAdd). 재료를 넣으면 바로 검사하고, 위험 재료가 있으면 등록을 막는다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { CATS, LV, SEASON, suggestMain } from "../logic/common";
import { createRecipe } from "../lib/sync";
import { J, pet, requireLogin, showTab, showToast } from "../store";
import { Bold, C, Icon, Lvl, shadow, Txt } from "../ui/base";
import { StepItem } from "./Detail";

const DESC_MAX = 80;

export function AddScreen() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [ings, setIngs] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [ingIn, setIngIn] = useState("");
  const [stepIn, setStepIn] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [catTouched, setCatTouched] = useState(false);
  const [seasons, setSeasons] = useState<string[]>([]);
  // 대표 사진: 폰 갤러리·카메라에서 1장. 실제 앱은 Supabase Storage에 올리고 주소를 recipes.image에 저장한다.
  const [photo, setPhoto] = useState<string | null>(null);

  const addIng = () => { if (ingIn.trim()) { setIngs([...ings, ingIn.trim()]); setIngIn(""); } };
  const addStep = () => { if (stepIn.trim()) { setSteps([...steps, stepIn.trim()]); setStepIn(""); } };
  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
  };
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (saving) return;
    if (!title.trim()) { showToast("레시피 제목을 넣어 주세요."); return; }
    if (!ings.length) { showToast("재료를 하나 이상 넣어 주세요."); return; }
    // 위험 재료 판정은 앱에서 한다 (서버 판정 submit-recipe Edge Function 은 아직 없음)
    if (ings.some((x) => J.judgeIng(x).level === "danger")) { showToast("위험한 재료를 빼고 다시 등록해 주세요."); return; }
    setSaving(true);
    // 한 줄 소개는 recipes.description, 조리방법은 recipes.instructions 로 간다. 사진은 Storage 준비 전이라 저장하지 않는다.
    const ok = await createRecipe({ title: title.trim(), desc: desc.trim(), category: curCat ?? "", seasons, ingredients: ings, steps });
    setSaving(false);
    if (!ok) return;
    setTitle(""); setDesc(""); setIngs([]); setSteps([]); setIngIn(""); setStepIn(""); setCat(null); setCatTouched(false); setSeasons([]); setPhoto(null);
    showToast(photo ? "레시피를 등록했어요. 사진 저장은 준비 중이라 대표 재료 그림으로 보여요." : "레시피를 등록했어요. 홈 맨 위에서 볼 수 있어요.");
    showTab("home");
  };

  const sug = suggestMain(ings);
  const curCat = catTouched ? cat : sug;
  const p = pet(), jp = J.judgeRecipe(ings, p);
  const js = ings.map((x) => J.judgeIng(x));
  const bad = js.filter((x) => x.level === "danger");

  return (
    <View>
      <View style={s.formHead}>
        <Txt style={{ fontSize: 22, fontWeight: "800" }}>레시피 등록</Txt>
        <Txt style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>재료를 넣으면 바로 검사해요. 위험 재료가 있으면 등록할 수 없어요.</Txt>
      </View>
      <View style={s.group}>
        <Txt style={s.label}>레시피 제목 *</Txt>
        <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="예: 단호박 닭가슴살 쿠키" placeholderTextColor="#8A97A1" />
      </View>
      <View style={s.group}>
        <Txt style={s.label}>한 줄 소개 <Txt style={{ fontSize: 12, fontWeight: "400", color: C.textLight }}>(선택)</Txt></Txt>
        <TextInput style={s.input} value={desc} onChangeText={setDesc} maxLength={DESC_MAX} placeholder="예: 단호박으로 달콤하게, 간식으로 딱 좋아요" placeholderTextColor="#8A97A1" />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Txt style={[s.ppNote, { marginBottom: 0, flex: 1 }]} lh={1.5}>레시피 카드에 한 줄로 보여요.</Txt>
          <Txt style={[s.ppNote, { marginBottom: 0, marginLeft: 8 }]}>{desc.length}/{DESC_MAX}</Txt>
        </View>
      </View>
      <View style={s.group}>
        <Txt style={s.label}>대표 사진</Txt>
        {photo ? (
          <>
            <View style={s.preview}>
              <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} contentFit="cover" accessibilityLabel="올린 사진" />
              <Pressable onPress={() => setPhoto(null)} style={s.photoDel} accessibilityLabel="사진 지우기">
                <Txt style={{ color: "white", fontSize: 18 }}>✕</Txt>
              </Pressable>
            </View>
            <Pressable onPress={pickPhoto} style={[s.photoPick, { minHeight: 44, flexDirection: "row", marginTop: 8 }]}>
              <Txt style={s.photoTx}>다른 사진으로 바꾸기</Txt>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={pickPhoto} style={s.photoPick}>
            <Icon name="camera-outline" size={28} color={C.primary} />
            <Txt style={s.photoTx}>내 폰 갤러리 / 카메라에서 사진 올리기</Txt>
          </Pressable>
        )}
        <Txt style={[s.ppNote, { marginBottom: 0 }]} lh={1.5}>직접 만든 음식 사진을 올려 주세요. 안 올리면 대표 재료 그림으로 보여요.</Txt>
      </View>
      <View style={s.group}>
        <Txt style={s.label}>대표 재료 *</Txt>
        <View style={s.radioGroup}>
          {CATS.map(([k, , lb]) => (
            <Radio key={k} on={k === curCat} onPress={() => { setCat(k); setCatTouched(true); }} label={lb} />
          ))}
          <Txt style={[s.ppNote, { width: "100%", marginBottom: 0 }]} lh={1.5}>
            {catTouched ? "직접 고른 값을 쓸게요." : sug ? "첫 재료를 보고 자동으로 골랐어요. 다르면 바꿔 주세요." : "재료를 넣으면 자동으로 골라 드려요."}
          </Txt>
        </View>
      </View>
      <View style={s.group}>
        <Txt style={s.label}>어울리는 계절</Txt>
        <View style={s.radioGroup}>
          {Object.entries(SEASON).map(([se, ic]) => (
            <Radio key={se} on={seasons.includes(se)} onPress={() => setSeasons(seasons.includes(se) ? seasons.filter((x) => x !== se) : [...seasons, se])} label={`${ic} ${se}`} />
          ))}
          <Txt style={[s.ppNote, { width: "100%", marginBottom: 0 }]} lh={1.5}>여러 개 고를 수 있어요. 안 고르면 사계절 레시피로 보여요.</Txt>
        </View>
      </View>
      <View style={s.group}>
        <Txt style={s.label}>재료</Txt>
        <View style={s.addRow}>
          <TextInput style={[s.input, { flex: 1 }]} value={ingIn} onChangeText={setIngIn} onSubmitEditing={addIng} placeholder="예: 닭가슴살 100g" placeholderTextColor="#8A97A1" returnKeyType="done" />
          <Pressable onPress={addIng} style={s.addBtn} accessibilityLabel="재료 넣기"><Icon name="add" size={20} color="white" /></Pressable>
        </View>
        {ings.length ? (
          <Txt style={s.petNote} lh={1.5}>
            등록 가능 여부는 <Bold>모든 반려견 공통 기준</Bold>(위험 재료)으로 정해요. 아래 &quot;{p.name}&quot; 표시는 지금 선택한 아이 기준이에요.
          </Txt>
        ) : null}
        {js.map((it, i) => {
          const mine = [
            ...jp.blocks.filter((x: any) => x.ing === jp.items[i] && x.kind !== "danger").map((x: any) => ({ c: C.danger, b: true, t: `🚫 ${p.name}: ${x.text}` })),
            ...jp.warns.filter((x: any) => x.ing === jp.items[i] && x.kind !== "caution").map((x: any) => ({ c: C.caution, b: false, t: `⚠️ ${p.name}: ${x.text.split(".")[0]}` })),
          ];
          return (
            <View key={i} style={s.listItem}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={s.bullet} />
                <Txt style={{ flex: 1, fontSize: 13.5 }}>{it.raw}</Txt>
                <Lvl kind={it.level}>{LV[it.level]}</Lvl>
                <Pressable onPress={() => setIngs(ings.filter((_, k) => k !== i))} hitSlop={13} style={{ marginLeft: 8 }} accessibilityLabel="재료 지우기">
                  <Icon name="close-circle" size={18} color="#EF4444" />
                </Pressable>
              </View>
              <View style={{ paddingLeft: 16, marginTop: 4 }}>
                {it.level === "danger" ? <Txt style={[s.live, { color: C.danger, fontWeight: "700" }]} lh={1.5}>⛔ {it.rule.reason}</Txt>
                  : it.level === "caution" ? <Txt style={[s.live, { color: C.caution }]} lh={1.5}>⚠️ {it.rule.reason}</Txt>
                  : it.level === "safe" ? <Txt style={[s.live, { color: C.safety }]} lh={1.5}>✓ {it.rule.conditions || ""}</Txt>
                  : <Txt style={[s.live, { color: C.gray }]} lh={1.5}>❔ 근거 자료에 없는 재료예요. 등록은 되지만 반려견 맞춤 보기에서는 빠져요.</Txt>}
                {it.parts.map((pt: any) => <Txt key={pt.part} style={[s.live, { color: "#8A4B00" }]} lh={1.5}>✂️ {pt.part}: 조리방법에 손질 방법을 꼭 적어 주세요.</Txt>)}
                {it.allergens.length ? <Txt style={[s.live, { color: C.textLight }]} lh={1.5}>알레르기 표시: {it.allergens.map((a: any) => a.label).join(", ")}</Txt> : null}
                {mine.map((m, k) => <Txt key={k} style={[s.live, { color: m.c, fontWeight: m.b ? "700" : "400" }]} lh={1.5}>{m.t}</Txt>)}
              </View>
            </View>
          );
        })}
      </View>
      <View style={s.group}>
        <Txt style={s.label}>조리방법</Txt>
        <View style={s.addRow}>
          <TextInput style={[s.input, { flex: 1 }]} value={stepIn} onChangeText={setStepIn} onSubmitEditing={addStep} placeholder="예: 닭가슴살을 삶아 잘게 찢어요" placeholderTextColor="#8A97A1" returnKeyType="done" />
          <Pressable onPress={addStep} style={s.addBtn} accessibilityLabel="조리 단계 넣기"><Icon name="add" size={20} color="white" /></Pressable>
        </View>
        {steps.map((st, i) => <StepItem key={i} n={i + 1} text={st} onDelete={() => setSteps(steps.filter((_, k) => k !== i))} />)}
      </View>
      <View style={s.submitWrap}>
        {bad.length ? (
          <View style={s.submitBlock}>
            <Txt style={{ fontSize: 12, fontWeight: "700", color: C.danger }} lh={1.5}>⛔ {bad.map((b) => b.n).join(", ")}: 반려견에게 위험한 재료라 등록할 수 없어요. 빼고 다시 등록해 주세요.</Txt>
          </View>
        ) : null}
        <Pressable onPress={() => requireLogin(submit, "등록한 레시피는 계정에 저장돼서 다른 보호자도 볼 수 있어요.")} disabled={!!bad.length} style={[s.submit, !!bad.length && { backgroundColor: C.borderDark, shadowOpacity: 0, elevation: 0 }]}>
          <Txt style={{ fontSize: 16, fontWeight: "800", color: bad.length ? "#52616D" : "white", textAlign: "center" }}>{saving ? "저장하는 중…" : "레시피 등록"}</Txt>
        </Pressable>
      </View>
    </View>
  );
}

function Radio({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityState={{ selected: on }} style={[s.radio, on && { backgroundColor: C.primaryLight, borderColor: C.primary }]}>
      <Txt style={{ fontSize: 12.5, fontWeight: on ? "800" : "600", color: on ? C.primaryDark : C.textLight }}>{label}</Txt>
    </Pressable>
  );
}

export const s = StyleSheet.create({
  formHead: { paddingTop: 4, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 18 },
  group: { marginBottom: 20 },
  label: { fontSize: 13.5, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: C.lightBg, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14.5, color: C.text, borderWidth: 1, borderColor: "transparent" },
  ppNote: { fontSize: 12, color: C.textLight, marginTop: 6, marginBottom: 8 },
  radioGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  radio: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.lightBg, borderWidth: 1, borderColor: "transparent", minHeight: 38, justifyContent: "center" },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  addBtn: { backgroundColor: C.primary, borderRadius: 8, width: 44, alignItems: "center", justifyContent: "center" },
  petNote: { fontSize: 12.5, color: C.primaryDark, backgroundColor: C.tipBg, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginTop: 4, marginBottom: 8 },
  listItem: { backgroundColor: "#F5F8FA", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, marginRight: 10 },
  live: { fontSize: 12 },
  submitWrap: { paddingTop: 14, paddingBottom: 24, borderTopWidth: 1, borderTopColor: C.border, marginTop: 14 },
  submitBlock: { backgroundColor: C.dangerBg, borderWidth: 1, borderColor: C.dangerBorder, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10 },
  submit: { backgroundColor: C.primary, borderRadius: 12, padding: 15, ...shadow(4, 12, C.primary, 0.25, 3) },
  photoPick: { alignItems: "center", justifyContent: "center", gap: 4, minHeight: 96, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#9CC3D6", borderRadius: 12, backgroundColor: "#F5FAFD", padding: 12 },
  photoTx: { fontSize: 13, fontWeight: "800", color: C.primary, textAlign: "center" },
  preview: { borderRadius: 12, overflow: "hidden", aspectRatio: 4 / 3, backgroundColor: C.lightBg },
  photoDel: { position: "absolute", top: 8, right: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(20,33,43,0.7)", alignItems: "center", justifyContent: "center" },
});
