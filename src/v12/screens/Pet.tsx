"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 내 반려견 (목업 2안: 한 아이씩 보는 식단 안전 프로필), 고치기 시트, 첫 등록 4단계
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { labelOf, STATUS_NAME } from "../logic/common";
import { josa } from "../logic/josa";
import { auth, bump, D, goStatus, J, openPasswordSheet, pet, requireLogin, SEED, showToast, state, switchPet, type Pet, type Status } from "../store";
import { Avatar, Bold, C, Fold, Icon, Lvl, SrcChips, Txt } from "../ui/base";
import { s as ds } from "./Detail";
import { s as fs } from "./Add";
import { signOut } from "../lib/auth";

// 서버(Supabase)에서도 같은 범위를 CHECK 제약으로 막는다: 이름 1~20자, 몸무게 0.5~100kg, 나이 0~30살
const LIMITS: Record<string, [number, number, string]> = { weight: [0.5, 100, "kg"], age: [0, 30, "살"] };
function validField(f: string, v: any) {
  v = String(v ?? "");
  if (f === "name") return v.trim() && v.trim().length <= 20 ? "" : "이름은 1~20자로 넣어 주세요.";
  if (LIMITS[f]) {
    const [lo, hi, u] = LIMITS[f];
    const n = +v;
    return v !== "" && n >= lo && n <= hi ? "" : `${f === "weight" ? "몸무게" : "나이"}는 ${lo}~${hi}${u} 사이로 넣어 주세요.`;
  }
  return "";
}
function toggleArr(p: Pet, f: "allergies" | "conditions", id: string) {
  p[f] = p[f].includes(id) ? p[f].filter((x) => x !== id) : [...p[f], id];
  bump();
}

export function PetScreen({ onWizard }: { onWizard: () => void }) {
  const p = pet();
  const counts: Record<Status, number> = { ok: 0, caution: 0, no: 0, unknown: 0 };
  for (const r of SEED.recipes) counts[J.judgeRecipe(r.ingredients, p).status]++;
  const al = p.allergies.map((id) => labelOf(D.allergens.items, id));
  const cross = D.allergens.cross_reactivity.filter((c: any) => c.pair.length === 2 && c.pair.some((x: string) => p.allergies.includes(x)));
  const cd = D.health_conditions.filter((h: any) => p.conditions.includes(h.id));
  const risks = J.petRisks(p);
  const bs = D.breed_sensitivities.filter((b: any) => b.breeds_ko.some((x: string) => p.breed && (p.breed.includes(x) || x.includes(p.breed))));
  const breedEv = [...risks.flatMap((h: any) => h.evidence || []), ...bs.flatMap((b: any) => b.evidence || [])];
  const open = (t: "basic" | "allergy" | "health") => requireLogin(() => { state.petSheet = t; bump(); }, "반려견 정보는 계정에 저장돼서 다른 기기에서도 볼 수 있어요.");
  const addPet = () => requireLogin(onWizard, "반려견 정보는 계정에 저장돼서 다른 기기에서도 볼 수 있어요.");
  const STAT: [Status, string, string][] = [["ok", C.safetyBg, C.safety], ["caution", C.cautionBg, C.caution], ["no", C.dangerBg, C.danger], ["unknown", "#EEF1F4", C.gray]];

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.selector}>
        {SEED.pets.map((x) => {
          const on = x.key === state.pet;
          return (
            <Pressable key={x.key} onPress={() => switchPet(x.key)} style={s.psItem} accessibilityState={{ selected: on }}>
              <View style={[s.psAv, on && { borderColor: C.primary }]}>
                <Avatar p={x} size={43} />
                {on ? <View style={s.psCheck}><Icon name="checkmark" size={13} color="white" /></View> : null}
              </View>
              <Txt style={{ fontSize: 12.5, fontWeight: on ? "900" : "700", color: on ? C.primaryDark : C.textLight }}>{x.name}</Txt>
            </Pressable>
          );
        })}
        <Pressable onPress={addPet} style={s.psItem}>
          <View style={[s.psAv, s.psAdd]}><Icon name="add" size={22} color={C.textLight} /></View>
          <Txt style={{ fontSize: 12.5, fontWeight: "700", color: C.textLight }}>추가</Txt>
        </Pressable>
      </ScrollView>

      <View style={s.hero}>
        <Avatar p={p} size={64} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Txt style={{ fontSize: 19, fontWeight: "900" }}>{p.name}</Txt>
            {p.gender ? <Icon name={p.gender} size={16} color={p.gender === "male" ? "#3B82F6" : "#EC4899"} /> : null}
          </View>
          <Txt style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{p.breed || "품종 미입력"} · {p.age}살 · {p.weight}kg</Txt>
        </View>
        <Pressable onPress={() => open("basic")} style={s.edit}>
          <Icon name="create-outline" size={15} color={C.primaryDark} />
          <Txt style={{ fontSize: 13, fontWeight: "800", color: C.primaryDark }}>편집</Txt>
        </Pressable>
      </View>

      <View style={s.box}>
        <Txt style={s.boxH}>레시피 {SEED.recipes.length}개를 {p.name} 기준으로 보면</Txt>
        <View style={s.stats}>
          {STAT.map(([k, bg, fg]) => (
            <Pressable key={k} onPress={() => goStatus(k)} style={[s.stat, { backgroundColor: bg }]}>
              <Txt style={{ fontSize: 20, fontWeight: "800", color: fg }}>{counts[k]}</Txt>
              <Txt style={{ fontSize: 12, fontWeight: "800", color: fg }}>{STATUS_NAME[k]}</Txt>
            </Pressable>
          ))}
        </View>
        <Txt style={fs.ppNote} lh={1.5}>숫자를 누르면 그 레시피만 모아 보여 줘요.</Txt>
      </View>

      <View style={s.box}>
        <View style={s.boxHRow}>
          <Txt style={s.boxH}>🚫 막는 재료</Txt>
          <Pressable onPress={() => open("allergy")} hitSlop={10}><Txt style={s.link}>고치기 ›</Txt></Pressable>
        </View>
        {al.length ? (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
              {al.map((x) => <Lvl key={x} kind="no">{x} 알레르기</Lvl>)}
            </View>
            <Txt style={s.text} lh={1.55}>{josa(al.join(", "), "이/가")} 든 레시피는 &quot;안 돼요&quot;로 표시하고, 맞춤 보기에서 숨겨요.</Txt>
            {cross.map((c: any, i: number) => <Txt key={i} style={s.text} lh={1.55}>🔁 {c.message}</Txt>)}
            {cross.length ? <SrcChips ev={cross.flatMap((c: any) => c.evidence || [])} /> : null}
          </>
        ) : (
          <Txt style={s.text} lh={1.55}>등록된 알레르기가 없어요. 알레르기 진단을 받은 음식이 있으면 추가해 주세요.</Txt>
        )}
        {p.lactose_sensitive ? <Txt style={s.text} lh={1.55}>🥛 유당 민감: 유당이 든 유제품에 &quot;주의&quot;를 붙여요. 락토프리 우유는 유당 문제는 줄지만 우유 단백질은 그대로예요.</Txt> : null}
      </View>

      <Fold
        key={"cd" + p.key}
        initial={cd.length > 0}
        style={s.box}
        summary={(o) => (
          <View style={[s.boxHRow, { marginBottom: o ? 8 : 0, minHeight: 28 }]}>
            <Txt style={[s.boxH, { marginBottom: 0 }]}>🩺 건강 상태</Txt>
            <Txt style={{ fontSize: 12.5, fontWeight: "700", color: C.textLight }}>{cd.length ? cd.length + "개" : "없음"} {o ? "▴" : "▾"}</Txt>
          </View>
        )}
      >
        {cd.length ? (
          <>
            {cd.map((h: any) => <Txt key={h.id} style={s.text} lh={1.55}><Bold>{h.label.split(" (")[0]}</Bold> · {h.message}</Txt>)}
            <SrcChips ev={cd.flatMap((h: any) => h.evidence || [])} />
          </>
        ) : (
          <Txt style={s.text} lh={1.55}>등록된 건강 상태가 없어요.</Txt>
        )}
        <Pressable onPress={() => open("health")} style={{ marginTop: 6, paddingVertical: 6 }}><Txt style={s.link}>건강 상태 고치기 ›</Txt></Pressable>
      </Fold>

      {risks.length || bs.length ? (
        <Fold
          key={"br" + p.key}
          style={[s.box, { backgroundColor: "#FFFBF3", borderColor: "#F1D58F" }]}
          summary={(o) => (
            <View style={[s.boxHRow, { marginBottom: o ? 8 : 0, minHeight: 28 }]}>
              <Txt style={[s.boxH, { marginBottom: 0, flex: 1 }]}>🐕 {josa(p.breed, "이라/라")} 알아 두세요</Txt>
              <Txt style={{ fontSize: 12.5, fontWeight: "700", color: C.textLight }}>{risks.length + bs.length}개 {o ? "▴" : "▾"}</Txt>
            </View>
          )}
        >
          {risks.map((h: any) => <Txt key={h.id} style={s.text} lh={1.55}><Bold>{h.label.split(" (")[0]}</Bold>에 잘 걸리는 품종으로 알려져 있어요. {h.message}</Txt>)}
          {bs.map((b: any, i: number) => <Txt key={i} style={s.text} lh={1.55}>{b.message}</Txt>)}
          <SrcChips ev={breedEv} />
        </Fold>
      ) : null}
      <AccountBox />
    </View>
  );
}

// ---------- 계정 (로그인 상태 · 로그아웃) ----------
function AccountBox() {
  const u = auth.user;
  // 버튼은 글 아래 왼쪽에 둔다. 오른쪽 아래에 떠 있는 AI 멍셰프 버튼에 가리지 않게.
  return (
    <View style={[s.box, { gap: 10, marginTop: 6 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Icon name="person-circle-outline" size={26} color={C.primaryDark} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt style={{ fontSize: 13.5, fontWeight: "800" }} numberOfLines={1}>{u ? u.email || "로그인됨" : "로그인하지 않았어요"}</Txt>
          <Txt style={{ fontSize: 12, color: C.textLight, marginTop: 2 }} lh={1.4}>
            {u ? "계정 저장은 아직 준비 중이에요. 지금은 새로고침하거나 로그아웃하면 찜·반려견 정보가 사라져요." : "레시피는 그냥 볼 수 있어요. 저장할 때만 로그인해요."}
          </Txt>
        </View>
      </View>
      {u ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => openPasswordSheet("change")} style={[s.edit, { minHeight: 40 }]} accessibilityRole="button">
            <Txt style={{ fontSize: 13, fontWeight: "800", color: C.primaryDark }}>비밀번호 바꾸기</Txt>
          </Pressable>
          <Pressable onPress={signOut} style={[s.edit, { minHeight: 40 }]} accessibilityRole="button">
            <Txt style={{ fontSize: 13, fontWeight: "800", color: C.primaryDark }}>로그아웃</Txt>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: "row" }}>
          <Pressable onPress={() => requireLogin(() => {})} style={[s.edit, { minHeight: 40 }]} accessibilityRole="button">
            <Txt style={{ fontSize: 13, fontWeight: "800", color: C.primaryDark }}>로그인</Txt>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------- 칩 ----------
function ChipToggle({ on, cond, big, onPress, children }: { on: boolean; cond?: boolean; big?: boolean; onPress: () => void; children: React.ReactNode }) {
  const [bg, bd, fg] = on ? (cond ? [C.cautionBg, "#F1D58F", C.caution] : [C.dangerBg, C.dangerBorder, C.danger]) : [C.lightBg, C.border, C.textLight];
  return (
    <Pressable onPress={onPress} accessibilityState={{ selected: on }}
      style={[{ backgroundColor: bg, borderColor: bd, borderWidth: 1, borderRadius: 16, justifyContent: "center" }, big ? { paddingVertical: 10, paddingHorizontal: 13, minHeight: 44, marginRight: 4, marginBottom: 6 } : { paddingVertical: 6, paddingHorizontal: 11, minHeight: 36 }]}>
      <Txt style={{ fontSize: big ? 13 : 12.5, fontWeight: "700", color: fg }}>{children}</Txt>
    </Pressable>
  );
}
function AllergyChips({ p, onToggle }: { p: Pet; onToggle: (id: string) => void }) {
  return (
    <View style={s.chipWrap}>
      {D.allergens.items.map((a: any) => (
        <ChipToggle key={a.id} big on={p.allergies.includes(a.id)} onPress={() => onToggle(a.id)}>
          {a.label}<Txt style={{ fontSize: 10, opacity: 0.75 }}> {a.pct}%</Txt>
        </ChipToggle>
      ))}
      <ChipToggle big on={false} onPress={() => showToast("목록에 없는 알레르기 직접 입력은 준비 중이에요.")}>+ 직접 입력</ChipToggle>
    </View>
  );
}
function HealthChips({ p, onToggle }: { p: Pet; onToggle: (id: string) => void }) {
  return (
    <View style={s.chipWrap}>
      {D.health_conditions.map((h: any) => (
        <ChipToggle key={h.id} big cond on={p.conditions.includes(h.id)} onPress={() => onToggle(h.id)}>{h.label.split(" (")[0]}</ChipToggle>
      ))}
    </View>
  );
}
function LactoseChip({ p, onToggle }: { p: Pet; onToggle: () => void }) {
  return (
    <>
      <Txt style={[fs.ppNote, { marginTop: 4 }]} lh={1.5}>진단은 없지만 이런 경우도 있나요?</Txt>
      <View style={{ flexDirection: "row" }}>
        <ChipToggle big cond on={!!p.lactose_sensitive} onPress={onToggle}>🥛 우유를 먹으면 배탈 (유당 민감)</ChipToggle>
      </View>
    </>
  );
}

// ---------- 고치기 시트 ----------
function Field({ label, hint, value, onCommit, numeric, unit, placeholder }: { label: string; hint?: string; value: string; onCommit: (v: string) => void; numeric?: boolean; unit?: string; placeholder?: string }) {
  const [v, setV] = useState(value);
  return (
    <View style={{ flex: 1 }}>
      <Txt style={fs.label}>{label}{hint ? <Txt style={{ fontSize: 12, fontWeight: "400", color: C.textLight }}> {hint}</Txt> : null}</Txt>
      <View style={{ justifyContent: "center" }}>
        <TextInput style={fs.input} value={v} onChangeText={setV} onBlur={() => onCommit(v)} onSubmitEditing={() => onCommit(v)} keyboardType={numeric ? "decimal-pad" : "default"} placeholder={placeholder} placeholderTextColor="#8A97A1" />
        {unit ? <Txt style={{ position: "absolute", right: 14, color: C.textLight, fontSize: 13, fontWeight: "600" }}>{unit}</Txt> : null}
      </View>
    </View>
  );
}
export function PetSheet() {
  const p = pet(), tab = state.petSheet!;
  const setField = (f: keyof Pet, v: string) => {
    const err = validField(f as string, v);
    if (err) { showToast(err); bump(); return; }
    (p as any)[f] = LIMITS[f as string] ? +v : v.trim();
    bump();
  };
  const T: [typeof tab, string][] = [["basic", "기본 정보"], ["allergy", "알레르기"], ["health", "건강 상태"]];
  const close = () => { state.petSheet = null; bump(); };
  return (
    <Sheet onClose={close}>
      <View style={s.grab} />
      <Txt style={{ fontSize: 15, fontWeight: "800", marginBottom: 6 }}>{p.name} 정보 고치기</Txt>
      <View style={s.seg}>
        {T.map(([k, l]) => (
          <Pressable key={k} onPress={() => { state.petSheet = k; bump(); }} style={[s.segBtn, k === tab && s.segOn]}>
            <Txt style={{ fontSize: 13, fontWeight: "700", color: k === tab ? C.primaryDark : C.textLight }}>{l}</Txt>
          </Pressable>
        ))}
      </View>
      {tab === "basic" ? (
        <View key={p.key}>
          <Field label="이름" value={p.name} onCommit={(v) => setField("name", v)} />
          <View style={{ height: 10 }} />
          <Field label="품종" hint="(예: 진돗개, 미니어처 슈나우저)" value={p.breed} onCommit={(v) => setField("breed", v)} />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <Field label="나이" numeric unit="살" value={String(p.age)} onCommit={(v) => setField("age", v)} />
            <Field label="몸무게" numeric unit="kg" value={String(p.weight)} onCommit={(v) => setField("weight", v)} />
          </View>
          <Txt style={[fs.ppNote, { marginTop: 6 }]} lh={1.5}>몸무게는 먹었어요 계산에 쓰여요. 최근에 잰 값을 넣어 주세요.</Txt>
        </View>
      ) : tab === "allergy" ? (
        <View>
          <Txt style={fs.ppNote} lh={1.5}>알레르기 진단을 받은 음식을 모두 골라 주세요. 숫자는 음식 알레르기가 있는 개 297마리 중 비율이에요.</Txt>
          <AllergyChips p={p} onToggle={(id) => toggleArr(p, "allergies", id)} />
          <LactoseChip p={p} onToggle={() => { p.lactose_sensitive = !p.lactose_sensitive; bump(); }} />
          <SrcChips ev={[{ source: "mueller-2016" }]} ctx="개 음식 알레르기 원인 비율(297마리)" />
        </View>
      ) : (
        <View>
          <Txt style={fs.ppNote} lh={1.5}>진단받은 병이나 병력을 골라 주세요. 관련 재료에 주의가 붙어요.</Txt>
          <HealthChips p={p} onToggle={(id) => toggleArr(p, "conditions", id)} />
        </View>
      )}
      <Pressable onPress={close} style={[s.sheetClose, { backgroundColor: C.primary, minHeight: 46, marginTop: 12 }]}>
        <Txt style={{ fontSize: 14, fontWeight: "800", color: "white" }}>저장하고 닫기</Txt>
      </Pressable>
    </Sheet>
  );
}

/** 아래에서 올라오는 시트 (.sheet-bg / .sheet) */
export function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <View style={s.sheetBg}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
      <View style={s.sheet}>
        <ScrollView contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 18, paddingBottom: 24 }}>{children}</ScrollView>
      </View>
    </View>
  );
}

// ---------- 첫 등록 4단계 ----------
type WizPet = Omit<Pet, "age" | "weight"> & { age: string | number; weight: string | number };
export function Wizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<WizPet>(() => ({ key: "new" + Date.now(), name: "", breed: "", age: "", weight: "", gender: "", allergies: [], conditions: [], lactose_sensitive: false, img: null }));
  const S = ["기본 정보", "알레르기", "건강 상태", "확인"];
  const nm = p.name || "우리 아이";
  // 1단계 칸별 오류. 토스트는 금방 사라지므로, 고칠 때까지 칸 아래에 남겨 둔다.
  const [errs, setErrs] = useState<{ name?: string; age?: string; weight?: string }>({});
  const up = (o: Partial<WizPet>) => {
    setP({ ...p, ...o });
    const changed = Object.keys(o).filter((k) => k in errs);
    if (changed.length) setErrs((e) => { const n = { ...e }; changed.forEach((k) => delete (n as any)[k]); return n; });
  };
  const tog = (f: "allergies" | "conditions", id: string) => up({ [f]: p[f].includes(id) ? p[f].filter((x) => x !== id) : [...p[f], id] } as any);
  const back = () => (step === 0 ? onClose() : setStep(step - 1));
  const next = (skip?: boolean) => {
    if (step === 0) {
      const fe = { name: validField("name", p.name), age: validField("age", p.age), weight: validField("weight", p.weight) };
      const shown = Object.fromEntries(Object.entries(fe).filter(([, v]) => v));
      setErrs(shown);
      const err = fe.name || fe.weight || fe.age;
      if (err) { showToast(skip ? "이름·나이·몸무게는 건너뛸 수 없어요. " + err : err); return; }
    }
    if (step < 3) { setStep(step + 1); return; }
    SEED.pets.push({ ...p, weight: +p.weight, age: +p.age });
    state.pet = p.key;
    onClose();
    bump();
  };
  const risks = step === 3 ? J.petRisks(p) : [];
  return (
    <View style={ds.overlay}>
      <View style={ds.head}>
        <Pressable onPress={back} style={ds.back} hitSlop={6} accessibilityLabel="이전"><Icon name="chevron-back" size={18} /></Pressable>
        <Txt style={{ fontSize: 15.5, fontWeight: "800" }}>새 반려견 등록</Txt>
        <Pressable onPress={() => next(true)} style={{ marginLeft: "auto", paddingVertical: 10, paddingHorizontal: 4 }}>
          <Txt style={{ color: C.primary, fontSize: 13, fontWeight: "800" }}>건너뛰기</Txt>
        </Pressable>
      </View>
      <View style={{ paddingTop: 10, paddingHorizontal: 16, backgroundColor: "white" }}>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {S.map((_, i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? C.primary : C.border }} />)}
        </View>
        <Txt style={{ fontSize: 12, color: C.textLight, fontWeight: "700", paddingTop: 6, paddingBottom: 4 }}>{step + 1} / 4 · {S[step]}</Txt>
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: "white" }} contentContainerStyle={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        {step === 0 ? (
          <View>
            <Txt style={s.wizQ} lh={1.35}>어떤 아이인가요?</Txt>
            <Txt style={fs.label}>이름</Txt>
            <TextInput style={[fs.input, errs.name ? s.inputErr : null]} placeholder="예: 초코" placeholderTextColor="#8A97A1" value={p.name} onChangeText={(v) => up({ name: v })} aria-invalid={!!errs.name} />
            {errs.name ? <Txt style={s.fieldErr} lh={1.4}>{errs.name}</Txt> : null}
            <Txt style={[fs.label, { marginTop: 10 }]}>품종</Txt>
            <TextInput style={fs.input} placeholder="예: 말티즈, 진돗개" placeholderTextColor="#8A97A1" value={p.breed} onChangeText={(v) => up({ breed: v })} />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Txt style={fs.label}>나이</Txt>
                <TextInput style={[fs.input, errs.age ? s.inputErr : null]} keyboardType="number-pad" placeholder="예: 3" placeholderTextColor="#8A97A1" value={String(p.age)} onChangeText={(v) => up({ age: v })} aria-invalid={!!errs.age} />
                <Txt style={s.unit}>살</Txt>
                {errs.age ? <Txt style={s.fieldErr} lh={1.4}>{errs.age}</Txt> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={fs.label}>몸무게</Txt>
                <TextInput style={[fs.input, errs.weight ? s.inputErr : null]} keyboardType="decimal-pad" placeholder="예: 4.5" placeholderTextColor="#8A97A1" value={String(p.weight)} onChangeText={(v) => up({ weight: v })} aria-invalid={!!errs.weight} />
                <Txt style={s.unit}>kg</Txt>
                {errs.weight ? <Txt style={s.fieldErr} lh={1.4}>{errs.weight}</Txt> : null}
              </View>
            </View>
          </View>
        ) : step === 1 ? (
          <View>
            <Txt style={s.wizQ} lh={1.35}>{josa(nm, "이/가")} 알레르기 진단을 받은 음식이 있나요?</Txt>
            <Txt style={fs.ppNote} lh={1.5}>많이 보고된 순서예요. 없으면 &quot;다음&quot;을 눌러 주세요.</Txt>
            <View style={s.chipWrap}>
              {D.allergens.items.map((a: any) => (
                <ChipToggle key={a.id} big on={p.allergies.includes(a.id)} onPress={() => tog("allergies", a.id)}>
                  {a.label}<Txt style={{ fontSize: 10, opacity: 0.75 }}> {a.pct}%</Txt>
                </ChipToggle>
              ))}
            </View>
            <LactoseChip p={p as Pet} onToggle={() => up({ lactose_sensitive: !p.lactose_sensitive })} />
          </View>
        ) : step === 2 ? (
          <View>
            <Txt style={s.wizQ} lh={1.35}>{nm}에게 진단받은 병이나 병력이 있나요?</Txt>
            <Txt style={fs.ppNote} lh={1.5}>없으면 &quot;다음&quot;을 눌러 주세요.</Txt>
            <View style={s.chipWrap}>
              {D.health_conditions.map((h: any) => (
                <ChipToggle key={h.id} big cond on={p.conditions.includes(h.id)} onPress={() => tog("conditions", h.id)}>{h.label.split(" (")[0]}</ChipToggle>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <Txt style={s.wizQ} lh={1.35}>이렇게 등록할게요</Txt>
            <View style={s.box}>
              <Txt style={s.text} lh={1.55}><Bold>{nm}</Bold> · {p.breed || "품종 미입력"} · {p.age}살 · {p.weight}kg</Txt>
              <Txt style={s.text} lh={1.55}>알레르기: {p.allergies.length ? p.allergies.map((id) => labelOf(D.allergens.items, id)).join(", ") : "없음"}{p.lactose_sensitive ? " · 유당 민감" : ""}</Txt>
              <Txt style={s.text} lh={1.55}>건강 상태: {p.conditions.length ? p.conditions.map((id) => labelOf(D.health_conditions, id)).join(", ") : "없음"}</Txt>
              {risks.map((h: any) => <Txt key={h.id} style={[s.text, { color: C.caution }]} lh={1.55}>🐕 {p.breed}: {h.label.split(" (")[0]}에 잘 걸리는 품종이라 관련 재료에 주의를 붙여요.</Txt>)}
            </View>
          </View>
        )}
      </ScrollView>
      <View style={s.wizFoot}>
        <Pressable onPress={back} style={[s.wizBtn, { flex: 0.6, backgroundColor: C.lightBg }]}><Txt style={{ fontSize: 14, fontWeight: "800", color: C.primaryDark }}>이전</Txt></Pressable>
        <Pressable onPress={() => next()} style={s.wizBtn}><Txt style={{ fontSize: 14, fontWeight: "800", color: "white" }}>{step === 3 ? "등록하기" : `다음 · ${S[step + 1]}`}</Txt></Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  selector: { flexDirection: "row", gap: 14, paddingTop: 2, paddingHorizontal: 2, paddingBottom: 12 },
  psItem: { alignItems: "center", gap: 4, minWidth: 56 },
  psAv: { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, borderColor: "transparent", padding: 2, alignItems: "center", justifyContent: "center" },
  psCheck: { position: "absolute", right: -4, bottom: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "white" },
  psAdd: { borderWidth: 1.5, borderStyle: "dashed", borderColor: "#B8C6CF" },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "white", borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  edit: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: C.primaryLight },
  box: { backgroundColor: "white", borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  boxH: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  boxHRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { color: C.primary, fontSize: 13, fontWeight: "800" },
  text: { fontSize: 13, marginTop: 4 },
  stats: { flexDirection: "row", gap: 6 },
  stat: { flex: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 2, minHeight: 60, alignItems: "center", justifyContent: "center" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", alignSelf: "center", marginBottom: 10 },
  seg: { flexDirection: "row", backgroundColor: C.lightBg, borderRadius: 12, padding: 3, marginTop: 4, marginBottom: 12 },
  segBtn: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  sheetBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,33,43,0.45)", zIndex: 120, justifyContent: "flex-end" },
  sheet: { backgroundColor: "white", width: "100%", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%" },
  sheetClose: { width: "100%", marginTop: 8, padding: 11, borderRadius: 10, backgroundColor: C.lightBg, alignItems: "center", justifyContent: "center" },
  wizQ: { fontSize: 18, fontWeight: "900", marginBottom: 8 },
  unit: { position: "absolute", right: 14, top: 38, color: C.textLight, fontSize: 13, fontWeight: "600" },
  inputErr: { borderColor: C.danger, backgroundColor: C.dangerBg },
  fieldErr: { color: C.danger, fontSize: 12.5, fontWeight: "700", marginTop: 5 },
  wizFoot: { flexDirection: "row", gap: 8, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: "white" },
  wizBtn: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
});
export { s as petStyles };
