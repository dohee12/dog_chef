"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 먹었어요 계산기 화면 (목업 renderCalc / updateCalc). 누가 → 무엇 → 얼마나 → 판정 → 전화 요약 → 근거 → 기록
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type LayoutChangeEvent } from "react-native";
import {
  amountText, ateText, BUBBLE, calc, CALC, calcPet, computeCalc, curItem, delHistory, history, LNAME, LTITLE, pickFood, pickSub, PL, plain,
  saveIntake, setAmount, setAte, setItem, setItemCount, setMode, setPortion, setTempWeight, setUnknownAmt, stepAmount, subText, tox, unitOf,
} from "../logic/calc";
import { bump, pet, requireLogin, SEED, showToast, state, switchPet } from "../store";
import { Avatar, C, Fold, Icon, Rich, shadow, SrcChips, Txt } from "../ui/base";

const callToast = () => showToast("전화 연결은 준비 중이에요. 가까운 동물병원에 직접 전화해 주세요.");

function CallBtn({ mini }: { mini?: boolean }) {
  return (
    <Pressable onPress={callToast} style={[s.vbCall, mini && { minHeight: 44, minWidth: 64, flexDirection: "row", gap: 4, paddingHorizontal: 10 }]} accessibilityLabel="병원 전화">
      <Icon name="call" size={20} color="white" />
      <Txt style={{ fontSize: 13, fontWeight: "800", color: "white" }}>병원 전화</Txt>
    </Pressable>
  );
}

/** 숫자 입력칸. 입력 중에는 글자를 그대로 두고, 밖에서 값이 바뀌면 따라간다. */
function NumInput({ value, onChange, onCommit, style, placeholder, decimal = true, label }: { value: number | null | undefined; onChange?: (v: string) => void; onCommit?: (v: string) => void; style?: any; placeholder?: string; decimal?: boolean; label?: string }) {
  const [tx, setTx] = useState(value ? String(value) : "");
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setTx(value ? String(value) : "");
  }, [value]);
  return (
    <TextInput
      value={tx}
      onChangeText={(v) => { setTx(v); onChange?.(v); }}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; onCommit?.(tx); }}
      onSubmitEditing={() => onCommit?.(tx)}
      keyboardType={decimal ? "decimal-pad" : "number-pad"}
      placeholder={placeholder}
      placeholderTextColor="#8A97A1"
      accessibilityLabel={label}
      style={style}
    />
  );
}

function Chip({ on, onPress, children, radio }: { on: boolean; onPress: () => void; children: React.ReactNode; radio?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={radio ? "radio" : "button"} accessibilityState={radio ? { checked: on } : { selected: on }} style={[s.subChip, on && s.subChipOn]}>
      {typeof children === "string" ? <Txt style={{ fontSize: 14, fontWeight: "700", color: on ? "white" : C.text }}>{children}</Txt> : children}
    </Pressable>
  );
}

export function CalcScreen() {
  const p = calcPet(), rp = pet(), f = calc.food ? CALC[calc.food] : null, t = f && tox(calc.food!);
  const r = computeCalc(calc, p);
  const isGrape = calc.food === "grapes-raisins", isXy = calc.food === "xylitol", m = calc.mode, itm = curItem();
  const u = f ? unitOf(f) : "", gu = f?.gramUnit || "g";
  const lit = r.level >= 1 ? r.level : -1;
  const who = `${p.name} ${p.weight ? p.weight + "kg" : ""} 기준`;
  const shown = !!f && (r.level >= 1 || r.level === -2);

  // 판정 띠
  let title: string, sub: string, cls: string, btn: React.ReactNode = null;
  if (r.level === -1) {
    cls = "lv0"; title = `${p.name}의 몸무게를 먼저 넣어 주세요`; sub = "몸무게가 있어야 위험도를 계산할 수 있어요.";
    btn = (
      <Pressable onPress={() => requireLogin(() => { state.tab = "pet"; state.petSheet = "basic"; bump(); }, "반려견 정보는 계정에 저장돼서 다른 기기에서도 볼 수 있어요.")} style={[s.vbCall, { backgroundColor: C.primary }]}>
        <Icon name="create-outline" size={20} color="white" />
        <Txt style={{ fontSize: 13, fontWeight: "800", color: "white" }}>몸무게 넣기</Txt>
      </Pressable>
    );
  } else if (r.level === -2) { cls = "lvx"; title = "❓ 계산할 수 없어요 · 병원에 전화하세요"; sub = r.band; btn = <CallBtn />; }
  else if (r.level === 0) { cls = "lv0"; title = r.need; sub = r.needSub || "고르면 바로 계산해요."; }
  else { cls = "lv" + r.level; title = LTITLE[r.level]; sub = r.band; btn = <CallBtn />; }
  const band = BAND[cls];
  const r0 = p.weightTemp && f ? computeCalc(calc, rp) : null;
  const wwarn = r0 && r0.level > r.level && r0.level >= 1 ? r0 : null;
  const bl = BUBBLE[Math.max(0, r.level)];

  // 큰 판정이 화면 밖이면 위에 작은 판정 줄을 붙인다
  const scrollRef = useRef<ScrollView>(null);
  const [view, setView] = useState({ y: 0, h: 600 });
  const card = useRef({ y: 0, h: 0 });
  const [, force] = useState(0);
  const onCard = (e: LayoutChangeEvent) => { card.current = { y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height }; force((x) => x + 1); };
  const vis = card.current.h ? Math.max(0, Math.min(view.y + view.h, card.current.y + card.current.h) - Math.max(view.y, card.current.y)) / card.current.h : 1;
  const hasMini = r.level !== 0 || !!calc.food;
  const miniShow = hasMini && vis < 0.35;
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, []);
  const lastTop = useRef(state.calcScrollTop);
  useEffect(() => {
    if (state.calcScrollTop !== lastTop.current) { lastTop.current = state.calcScrollTop; scrollRef.current?.scrollTo({ y: 0, animated: false }); }
  });

  const curN = calc.mode === "count" ? calc.count : calc.grams;
  const direct = m !== "item";
  const unitTxt = calc.mode === "count" ? u : gu;
  const pre = calc.mode === "count" ? (calc.food === "macadamia" ? [1, 3, 5, 10] : [1, 2, 3, 5]) : isXy ? [500, 1000, 2000, 5000] : [5, 10, 20, 30, 50];
  const ul = isXy && calc.mode === "count" ? "몇 개인지 몰라요" : "양을 몰라요";
  const callLines = shown ? [`${p.name} · ${+p.weight > 0 ? p.weight + "kg" : "몸무게 모름"}${p.breed ? " · " + p.breed : ""}`, `${subText(f!)} ${amountText(f!)}`, `먹은 시각: ${ateText()}`, ...(r.num ? ["계산: " + plain(r.num)] : [])] : [];
  const copy = () => {
    const tx = callLines.join("\n");
    const nav: any = Platform.OS === "web" ? (globalThis as any).navigator : null;
    if (nav && nav.clipboard) nav.clipboard.writeText(tx).then(() => showToast("복사했어요. 병원에 문자로 보낼 수 있어요."), () => showToast("이 브라우저에서는 복사할 수 없어요."));
    else showToast("이 브라우저에서는 복사할 수 없어요.");
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={s.body}
        scrollEventThrottle={32}
        onScroll={(e) => setView({ y: e.nativeEvent.contentOffset.y, h: e.nativeEvent.layoutMeasurement.height })}
        onLayout={(e) => setView((v) => ({ ...v, h: e.nativeEvent.layout.height }))}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.main, hasMini && { marginTop: 68 }]}>
          {/* 1. 누가 */}
          <View style={s.sec}>
            <SecH n={1}>누가 먹었나요?</SecH>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {SEED.pets.map((x) => {
                const on = x.key === state.pet, w = on ? p.weight : x.weight;
                return (
                  <Pressable key={x.key} onPress={() => switchPet(x.key)} accessibilityState={{ selected: on }} style={[s.cpet, on && s.cpetOn]}>
                    {/* 큰 글씨에서는 몸무게가 잘리지 않게 사진을 뺀다 */}
                    {state.bigText ? null : <Avatar p={x} size={28} />}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt style={{ fontSize: 15, fontWeight: "800" }} numberOfLines={1}>{x.name}</Txt>
                      <Txt style={{ fontSize: 13, fontWeight: "600", color: on ? C.primaryDark : C.gray }} numberOfLines={1}>{w ? w + "kg" : "몸무게 없음"}</Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {+rp.weight > 0 ? (
              <View style={s.cwRow}>
                <Txt style={{ fontSize: 14, fontWeight: "700" }}>계산할 몸무게</Txt>
                <NumInput value={+p.weight} onCommit={(v) => setTempWeight(v)} style={s.cwInput} label="계산할 몸무게" />
                <Txt style={{ fontSize: 14, fontWeight: "700" }}>kg</Txt>
                <View style={{ flexBasis: "100%", flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                  {p.weightTemp ? (
                    <>
                      <Txt style={s.cwNote}>오늘만 바꿔서 계산해요 (등록 {rp.weight}kg) </Txt>
                      <Pressable onPress={() => setTempWeight(0)} style={{ minHeight: 32, justifyContent: "center" }}>
                        <Txt style={{ color: C.primary, fontWeight: "800", fontSize: 13, textDecorationLine: "underline" }}>되돌리기</Txt>
                      </Pressable>
                    </>
                  ) : (
                    <Txt style={s.cwNote}>오늘 몸무게가 다르면 고쳐 주세요</Txt>
                  )}
                </View>
              </View>
            ) : null}
          </View>

          {/* 2. 무엇을 */}
          <View style={s.sec}>
            <SecH n={2}>무엇을 먹었나요?</SecH>
            {/* 한 줄에 다섯 칸이면 '포도·건포/도'처럼 글자 중간에서 끊겨, 한 줄에 세 칸씩 놓는다. */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {Object.entries(CALC).map(([k, v]) => {
                const on = k === calc.food;
                return (
                  <Pressable key={k} onPress={() => pickFood(k)} accessibilityState={{ selected: on }} style={[s.foodTile, on && { backgroundColor: C.primaryLight, borderColor: C.primary }]}>
                    <Txt style={{ fontSize: 22 }}>{v.icon}</Txt>
                    <Txt style={{ fontSize: 13, fontWeight: on ? "800" : "700", color: on ? C.primaryDark : C.textLight, textAlign: "center" }} lh={1.15} numberOfLines={1}>{v.tile}</Txt>
                  </Pressable>
                );
              })}
            </View>
            {f && f.subs && (!f.items || m === "gram") ? (
              <View style={s.subRow} accessibilityRole="radiogroup">
                <Txt style={s.subQ}>어떤 {f.name.split(" ")[0]}인가요?</Txt>
                {f.subs.map((sb, i) => <Chip key={i} radio on={i === calc.sub} onPress={() => pickSub(i)}>{sb[0]}</Chip>)}
                {calc.food === "chocolate" && calc.sub !== null && f.subs[calc.sub] && f.subs[calc.sub][1] === "cacao" ? (
                  <View style={s.inlineIn}>
                    <Txt style={s.inlineTx}>카카오</Txt>
                    <NumInput value={calc.cacao} onChange={(v) => { calc.cacao = v === "" ? null : Math.min(100, Math.max(0, +v)); bump(); }} style={s.inlineInput} placeholder="예: 70" label="카카오 %" />
                    <Txt style={s.inlineTx}>%</Txt>
                    <Txt style={s.uwNote} lh={1.45}>포장지 앞면이나 성분표에 &quot;카카오 ○○%&quot;로 적혀 있어요</Txt>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* 3. 얼마나 */}
          {f ? (
            <View style={s.sec}>
              <SecH n={3}>
                {isGrape ? (
                  <>몇 알 먹었나요? <Txt style={{ fontSize: 13, fontWeight: "600", color: C.gray }}> 기록용 · 안 넣어도 돼요</Txt></>
                ) : m === "item" ? `${f.itemQ} 먹었나요?` : isXy ? "몇 개 먹었나요?" : calc.food === "macadamia" && m === "count" ? "몇 알 먹었나요?" : "얼마나 먹었나요?"}
              </SecH>
              {m === "item" && f.items ? (
                <View style={{ gap: 8 }}>
                  <View style={s.itemGrid} accessibilityRole="radiogroup">
                    {f.items.map((it, i) => {
                      const on = calc.item === it.k, wide = i === f.items!.length - 1 && f.items!.length % 2 === 1;
                      return (
                        <Pressable key={it.k} onPress={() => setItem(it.k)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                          style={[s.itemCard, on && s.itemOn, wide && { width: "100%", minHeight: 64, flexDirection: "row", justifyContent: "center", gap: 8 }]}>
                          <Txt style={{ fontSize: wide ? 22 : 30 }} lh={1.1}>{it.icon}</Txt>
                          <Txt style={{ fontSize: 15, fontWeight: "800", textAlign: "center" }}>{it.name}</Txt>
                          <Txt style={{ fontSize: 12.5, fontWeight: "600", color: C.gray }}>{it.ex}</Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                  {itm && !itm.fixed && !itm.unknown ? (
                    <>
                      {itm.unit ? (
                        <>
                          <Txt style={[s.subQ, { marginTop: 6 }]}>몇 {itm.unit} 먹었나요?</Txt>
                          <View style={s.subRow}>
                            {[1, 2, 3, 5].map((n) => <Chip key={n} radio on={calc.count === n && !calc.unknownAmt} onPress={() => setItemCount(n)}>{n + itm.unit!}</Chip>)}
                            <Chip radio on={calc.unknownAmt} onPress={() => setPortion("unknown")}>몰라요</Chip>
                          </View>
                          <View style={s.inlineIn}>
                            <Txt style={s.inlineTx}>직접</Txt>
                            <NumInput value={calc.count && ![1, 2, 3, 5].includes(calc.count) ? calc.count : null} onChange={(v) => setItemCount(v)} style={s.inlineInput} placeholder="예: 4" decimal={false} label={`먹은 ${itm.unit} 수`} />
                            <Txt style={s.inlineTx}>{itm.unit}</Txt>
                          </View>
                        </>
                      ) : (
                        <>
                          <Txt style={[s.subQ, { marginTop: 6 }]}>얼마나 먹었나요?</Txt>
                          <View style={s.subRow}>
                            {[0.25, 0.5, 1].map((v, i) => {
                              const on = calc.portion === v;
                              return (
                                <Chip key={v} radio on={on} onPress={() => setPortion(v)}>
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <View style={[s.pbar, { borderColor: on ? "white" : C.text }]}>
                                      <View style={{ width: `${v * 100}%`, height: "100%", backgroundColor: on ? "white" : C.text }} />
                                    </View>
                                    <Txt style={{ fontSize: 14, fontWeight: "700", color: on ? "white" : C.text }}>{(itm.pl || PL)[i]}</Txt>
                                  </View>
                                </Chip>
                              );
                            })}
                            <Chip radio on={calc.portion === "n"} onPress={() => setPortion("n")}>여러 개</Chip>
                            <Chip radio on={calc.portion === "unknown"} onPress={() => setPortion("unknown")}>몰라요</Chip>
                          </View>
                          {calc.portion === "n" ? (
                            <View style={s.inlineIn}>
                              <Txt style={s.inlineTx}>모두</Txt>
                              <NumInput value={calc.count || null} onChange={(v) => setItemCount(v)} style={s.inlineInput} placeholder="예: 2" label="먹은 개수" />
                              <Txt style={s.inlineTx}>개 먹었어요</Txt>
                            </View>
                          ) : null}
                        </>
                      )}
                      <Txt style={s.uwNote} lh={1.45}>{itm.upper ? "과자 전체를 밀크 초콜릿으로 보고 계산해요. 실제보다 높게 나올 수 있어요. " : ""}{f.wsrc}</Txt>
                    </>
                  ) : null}
                </View>
              ) : null}
              {direct ? (
                <View>
                  <View style={s.amountRow}>
                    <Pressable onPress={() => stepAmount(-1)} style={s.amtBtn} accessibilityLabel={`1${unitTxt} 줄이기`}><Txt style={s.amtBtnTx}>−</Txt></Pressable>
                    <View style={s.amtField}>
                      <NumInput value={calc.unknownAmt ? null : curN} onChange={(v) => setAmount(v)} placeholder={calc.unknownAmt ? "모름" : "0"} style={s.amtInput} label="먹은 양" />
                      <Txt style={{ fontSize: 18, fontWeight: "800", color: C.primaryDark, marginLeft: 6 }}>{unitTxt}</Txt>
                    </View>
                    <Pressable onPress={() => stepAmount(1)} style={s.amtBtn} accessibilityLabel={`1${unitTxt} 늘리기`}><Txt style={s.amtBtnTx}>+</Txt></Pressable>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {pre.map((n) => {
                      const on = !calc.unknownAmt && n === curN;
                      return (
                        <Pressable key={n} onPress={() => setAmount(n)} accessibilityState={{ selected: on }} style={[s.preset, on && { backgroundColor: C.primary, borderColor: C.primary }]}>
                          <Txt style={{ fontSize: 15, fontWeight: "700", color: on ? "white" : C.text }} numberOfLines={1}>{n}{unitTxt}</Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                  {isXy && calc.mode === "count" ? (
                    <View style={s.uwRow}>
                      <View style={s.inlineIn}>
                        <Txt style={s.inlineTx}>1개 자일리톨 함량 <Txt style={{ fontSize: 13, fontWeight: "600", color: C.gray }}>아는 경우만</Txt></Txt>
                        <NumInput value={calc.unitW} onChange={(v) => { calc.unitW = +v > 0 ? +v : null; bump(); }} style={s.inlineInput} placeholder="예: 1000" label="1개 자일리톨 함량" />
                        <Txt style={s.inlineTx}>mg</Txt>
                      </View>
                      <Txt style={s.uwNote} lh={1.45}>성분표에 1개 함량이 없으면 비워 두세요. 함량을 모르면 위험한 양일 수 있어 응급으로 봐요.</Txt>
                    </View>
                  ) : calc.food === "macadamia" && calc.mode === "count" ? (
                    <View style={s.uwRow}><Txt style={s.uwNote} lh={1.45}>1알 약 2.8g으로 계산해요 (USDA 표준 분량: 28g에 10~12알).</Txt></View>
                  ) : null}
                  {!isGrape ? (
                    <Pressable onPress={setUnknownAmt} accessibilityState={{ selected: calc.unknownAmt }} style={[s.unknownBtn, calc.unknownAmt && { borderWidth: 2, borderStyle: "solid", borderColor: "#F97316", backgroundColor: "#FFF7ED" }]}>
                      <Txt style={{ fontSize: 15, fontWeight: "800", color: calc.unknownAmt ? "#7A2E00" : C.primaryDark }}>{calc.unknownAmt ? `✓ ${ul} · 알면 위에 넣어 주세요` : ul}</Txt>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              {!isGrape ? (
                <Pressable onPress={() => setMode(m === "gram" ? (f.items ? "item" : "count") : "gram")} style={{ alignSelf: "center", marginTop: 10, minHeight: 40, justifyContent: "center" }}>
                  <Txt style={{ color: C.primaryDark, fontSize: 14, fontWeight: "700", textDecorationLine: "underline" }}>
                    {m === "gram" ? (f.items ? "← 그림으로 고를래요" : isXy ? "← 개수로 넣을래요" : "← 알 수로 넣을래요") : isXy ? "자일리톨 양(mg)을 정확히 알아요" : "먹은 무게(g)를 정확히 알아요"}
                  </Txt>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* 판정 */}
          <View onLayout={onCard} style={{ paddingTop: 4, paddingBottom: 8 }}>
            <View style={s.lights} accessibilityRole="image" accessibilityLabel={"신호등: " + (lit > 0 ? LNAME[lit] : "판정 전")}>
              {LAMP.map((col, i) => (
                <View key={i} style={[s.lamp, { backgroundColor: col, opacity: i === lit ? 1 : 0.35 }, i === lit && { transform: [{ scale: 1.18 }], borderWidth: 3, borderColor: "white", ...shadow(0, 16, col, 0.9, 4) }]} />
              ))}
            </View>
            <View style={s.lampLabels}>
              {["안 먹음", "물어보기", "병원 가기", "응급"].map((lb, i) => (
                <View key={lb} style={[s.lampLabel, i === lit && { backgroundColor: "#14212B" }]}>
                  <Txt style={{ fontSize: i === lit ? 14 : 13, fontWeight: i === lit ? "800" : "700", color: i === lit ? "white" : C.gray, textAlign: "center" }}>{lb}</Txt>
                </View>
              ))}
            </View>
            <View style={[s.band, { backgroundColor: band[0], borderColor: band[1], borderWidth: cls === "lvx" ? 2 : 1.5 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={{ fontSize: cls === "lvx" ? 18 : 19, fontWeight: "900", color: band[2] }} lh={1.25}>{title}</Txt>
                {r.level >= 1 || r.level === -2 ? <Txt style={{ fontSize: 14, fontWeight: "800", marginTop: 2, color: band[2] }}>{who}</Txt> : null}
                <Txt style={{ fontSize: 14, fontWeight: "600", marginTop: 2, color: band[2] }} lh={1.4}>{sub}</Txt>
              </View>
              {btn}
            </View>
            {wwarn ? (
              <View style={s.wwarn}>
                <Txt style={{ fontSize: 14, fontWeight: "700", color: "#7A2E00" }} lh={1.5}>
                  ⚠️ 등록 몸무게({rp.weight}kg)로 계산하면 <Txt style={{ fontSize: 14, fontWeight: "900", color: "#7A2E00" }}>{LTITLE[wwarn.level]}</Txt>예요. 오늘 몸무게가 맞는지 다시 확인해 주세요.
                </Txt>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <View style={s.face}><Txt style={{ fontSize: 22 }}>{bl[0]}</Txt></View>
              <View style={s.bubble}><Txt style={{ fontSize: 14, fontWeight: "700" }} lh={1.45}>{r.level === -2 ? "병원에 전화해서 물어봐 주세요!" : bl[1]}</Txt></View>
            </View>
            {f && r.level !== 0 && r.level !== -1 ? (
              <View>
                {r.num ? (
                  <>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: 8, rowGap: 4 }}>
                      <Rich s={r.num} style={{ fontSize: 17, fontWeight: "700" }} />
                      <Txt style={{ fontSize: 13, fontWeight: "700", color: C.gray }}>{f.ref || ""}</Txt>
                    </View>
                    <Txt style={{ fontSize: 13, color: C.gray, marginTop: 2, marginBottom: 10 }}>{f.agent || ""} 기준으로 계산했어요</Txt>
                  </>
                ) : null}
                {r.breed ? <View style={s.cfBreed}><Txt style={{ fontSize: 14, fontWeight: "800", color: C.danger }} lh={1.5}>🐕 {r.breed}</Txt></View> : null}
                <View style={s.signs}>
                  <Txt style={{ fontSize: 14 }} lh={1.55}><Txt style={{ fontSize: 14, fontWeight: "800" }}>이런 증상이 보이면 바로 병원에</Txt>{"\n"}{t?.signs || ""}</Txt>
                </View>
              </View>
            ) : null}
          </View>

          {/* 병원에 전화할 때 말할 것 */}
          {shown ? (
            <View style={s.callCard}>
              <View style={s.callH}>
                <Txt style={{ fontSize: 15, fontWeight: "800", flex: 1 }}>📞 병원에 전화할 때 말할 것</Txt>
                <Pressable onPress={copy} style={s.copy}><Txt style={{ fontSize: 14, fontWeight: "800", color: C.primaryDark }}>복사</Txt></Pressable>
              </View>
              <View style={{ marginBottom: 10 }}>
                {callLines.map((l, i) => <Txt key={i} style={{ fontSize: 17, fontWeight: "700" }} lh={1.55}>{l}</Txt>)}
              </View>
              <Txt style={{ fontSize: 14, fontWeight: "800", marginBottom: 6 }}>먹은 시각</Txt>
              <View style={s.subRow}>
                {([[0, "방금"], [30, "30분 전"], [60, "1시간 전"], [120, "2시간 전"], ["custom", "직접"]] as const).map(([mm, lb]) => (
                  <Chip key={lb} on={calc.ate === mm} onPress={() => setAte(mm)}>{lb}</Chip>
                ))}
                {calc.ate === "custom" ? (
                  <View style={s.inlineIn}>
                    <Txt style={s.inlineTx}>먹은 시각</Txt>
                    <TextInput defaultValue={calc.ateCustom} onEndEditing={(e) => { calc.ateCustom = e.nativeEvent.text.trim(); bump(); }} onBlur={(e: any) => { const v = e?.nativeEvent?.text ?? e?.target?.value; if (typeof v === "string") { calc.ateCustom = v.trim(); bump(); } }} placeholder="예: 12:30" placeholderTextColor="#8A97A1" style={[s.inlineInput, { width: 120 }]} accessibilityLabel="먹은 시각" />
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* 근거 */}
          {shown && t ? (
            <Fold
              key={calc.food!}
              style={{ marginBottom: 12, marginTop: 8 }}
              summaryStyle={{ paddingVertical: 10, minHeight: 44, justifyContent: "center" }}
              summary={(o) => <Txt style={{ fontSize: 14, fontWeight: "800", color: C.primary }}>{o ? "▾ " : "▸ "}왜 이 단계인가요? (근거·용량표·출처)</Txt>}
            >
              {r.why ? <Txt style={s.evWhy} lh={1.55}>{r.why}</Txt> : null}
              {r.note && calc.sub !== 2 ? <Txt style={s.evWhy} lh={1.55}>{r.note}</Txt> : null}
              {f!.hint ? <Txt style={s.evHint} lh={1.5}>{f!.hint}</Txt> : null}
              <View style={{ marginTop: 8 }}>
                {(t.doses || []).map((d: any, i: number) => (
                  <View key={i} style={[s.doseRow, i === r.hit && { backgroundColor: "#FFF4E5" }]}>
                    <Txt style={{ flex: 1, fontSize: 13, fontWeight: i === r.hit ? "800" : "400" }}>{i === r.hit ? "▶ 지금 여기 " : ""}{d.amount}</Txt>
                    <Txt style={{ flex: 1, fontSize: 13, fontWeight: i === r.hit ? "800" : "400" }}>{d.effect}</Txt>
                  </View>
                ))}
              </View>
              <Txt style={s.evHint} lh={1.5}>Merck 수의 매뉴얼·국립축산과학원 자료로 계산해요.</Txt>
              <SrcChips ev={[...(t.evidence || []), ...(t.doses || []).map((d: any) => ({ source: d.source })), ...(f!.src ? [{ source: f!.src }] : [])]} ctx={t.label + ": " + t.reason} />
            </Fold>
          ) : null}
          {shown ? (
            <Pressable onPress={() => requireLogin(saveIntake, "먹은 기록은 계정에 저장돼서 나중에 병원에서 보여 줄 수 있어요.")} style={s.saveBtn}>
              <Icon name="bookmark-outline" size={18} color={C.primaryDark} />
              <Txt style={{ fontSize: 14, fontWeight: "800", color: C.primaryDark }}>먹은 기록 남기기</Txt>
            </Pressable>
          ) : null}
        </View>

        {history.length ? (
          <View style={s.histCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Txt style={{ fontSize: 16, fontWeight: "800" }}>먹은 기록</Txt>
              <Txt style={{ fontSize: 13, color: C.gray, fontWeight: "800" }}>{history.length}건</Txt>
            </View>
            {history.map((h, i) => (
              <View key={h.key} style={s.histItem}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt style={{ fontSize: 14, fontWeight: "800" }} lh={1.4}>{h.icon} {h.pet} ({h.w}kg) · {h.what}</Txt>
                  <Txt style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>먹은 시각 {h.ate}{h.num ? "\n" + h.num : ""}</Txt>
                  <View style={{ marginTop: 6, alignSelf: "flex-start", borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, backgroundColor: h.lv === 1 ? C.cautionBg : h.lv === -2 ? "#EEF1F4" : C.dangerBg }}>
                    <Txt style={{ fontSize: 12, fontWeight: "800", color: h.lv === 1 ? C.caution : h.lv === -2 ? "#5B6670" : C.danger }}>{h.lv === -2 ? "계산 못 함" : LNAME[h.lv]}</Txt>
                  </View>
                </View>
                <Pressable onPress={() => delHistory(i)} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }} accessibilityLabel="기록 지우기">
                  <Txt style={{ fontSize: 16, color: C.gray }}>✕</Txt>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* 작은 판정 줄 */}
      {miniShow ? (
        <View style={s.mini} pointerEvents="box-none">
          <View style={[s.miniDot, cls === "lvx" ? { backgroundColor: "white", borderWidth: 3, borderColor: "#F97316" } : { backgroundColor: MINI_DOT[cls] || "#B8C2CA" }]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt style={{ fontSize: 16, fontWeight: "800" }} numberOfLines={r.level >= 1 || r.level === -2 ? 1 : 2}>
              {r.level >= 1 ? ["", "전화로 물어보기", "병원 가기", "응급"][r.level] : r.level === -2 ? "계산할 수 없어요" : title}
            </Txt>
            {r.level >= 1 || r.level === -2 ? <Txt style={{ fontSize: 13 }}>{who}</Txt> : null}
          </View>
          {r.level >= 1 || r.level === -2 ? <CallBtn mini /> : null}
        </View>
      ) : null}
    </View>
  );
}

function SecH({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <View style={s.step}><Txt style={{ fontSize: 13, fontWeight: "800", color: "white" }}>{n}</Txt></View>
      <Txt style={{ fontSize: 16, fontWeight: "800", flex: 1 }}>{children}</Txt>
    </View>
  );
}

const LAMP = ["#10B981", "#F59E0B", "#F97316", "#EF4444"];
const MINI_DOT: Record<string, string> = { lv1: "#F5B800", lv2: "#F97316", lv3: "#E5484D" };
// [배경, 테두리, 글자]
const BAND: Record<string, [string, string, string]> = {
  lv0: [C.lightBg, C.border, C.text],
  lv1: ["#FFF8E1", "#F1D58F", "#5C3B00"],
  lv2: ["#FFEFE3", "#F7B98A", "#7A2E00"],
  lv3: [C.dangerBg, C.dangerBorder, "#7A1A12"],
  lvx: ["#FFF7ED", "#F97316", "#5A2400"],
};

const s = StyleSheet.create({
  body: { padding: 16, paddingBottom: 96 },
  main: { backgroundColor: "white", borderRadius: 24, paddingVertical: 20, paddingHorizontal: 18, borderWidth: 1, borderColor: C.border, marginBottom: 16, ...shadow(4, 16, C.primary, 0.08, 2) },
  sec: { paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  step: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  cpet: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, minHeight: 56, paddingVertical: 6, paddingHorizontal: 7, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: "white", minWidth: 0 },
  cpetOn: { borderWidth: 2, borderColor: C.primary, backgroundColor: C.primaryLight },
  cwRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 8, rowGap: 6, marginTop: 10 },
  cwInput: { width: 72, height: 44, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, fontSize: 16, fontWeight: "800", textAlign: "center", color: C.text },
  cwNote: { fontSize: 13, fontWeight: "600", color: C.gray },
  foodTile: { flexGrow: 1, flexBasis: "30%", minWidth: 0, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 64, paddingVertical: 6, paddingHorizontal: 2, backgroundColor: C.lightBg, borderWidth: 1.5, borderColor: "transparent", borderRadius: 12 },
  subRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subQ: { width: "100%", fontSize: 14, fontWeight: "800", marginTop: 4, marginBottom: 2 },
  subChip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1.5, borderColor: C.border, backgroundColor: "white", justifyContent: "center" },
  subChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  inlineIn: { width: "100%", flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 },
  inlineTx: { fontSize: 14, fontWeight: "700" },
  inlineInput: { width: 96, height: 44, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, fontSize: 16, fontWeight: "800", textAlign: "center", color: C.text },
  uwNote: { width: "100%", fontSize: 13, fontWeight: "600", color: C.gray },
  uwRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#F5FAFD" },
  itemGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  itemCard: { width: "48.5%", flexGrow: 1, alignItems: "center", gap: 2, minHeight: 96, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: "white" },
  itemOn: { borderWidth: 2, borderColor: C.primary, backgroundColor: C.primaryLight },
  pbar: { width: 22, height: 14, borderRadius: 3, borderWidth: 1.5, overflow: "hidden" },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  amtBtn: { width: 52, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  amtBtnTx: { fontSize: 26, fontWeight: "700", color: C.primaryDark },
  amtField: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", height: 56, borderWidth: 2, borderColor: C.primary, borderRadius: 14, backgroundColor: "white", paddingHorizontal: 14 },
  amtInput: { flex: 1, minWidth: 0, fontSize: 28, fontWeight: "800", color: C.text, textAlign: "right", padding: 0, outlineStyle: "none" as any },
  preset: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.lightBg, alignItems: "center", justifyContent: "center" },
  unknownBtn: { width: "100%", minHeight: 48, marginTop: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#9CC3D6", backgroundColor: "white", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  lights: { flexDirection: "row", justifyContent: "center", gap: 12, backgroundColor: "#1E293B", paddingVertical: 10, paddingHorizontal: 22, borderRadius: 30, alignSelf: "center", marginBottom: 6 },
  lamp: { width: 22, height: 22, borderRadius: 11 },
  lampLabels: { flexDirection: "row", justifyContent: "center", gap: 4, marginBottom: 10 },
  lampLabel: { width: 70, paddingVertical: 3, borderRadius: 10 },
  band: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12 },
  vbCall: { alignItems: "center", justifyContent: "center", gap: 2, minWidth: 72, minHeight: 56, borderRadius: 12, backgroundColor: C.danger, paddingHorizontal: 6 },
  wwarn: { backgroundColor: "#FFEFE3", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginTop: -4, marginBottom: 12 },
  face: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  bubble: { flex: 1, backgroundColor: C.lightBg, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1, borderColor: C.border },
  cfBreed: { backgroundColor: C.dangerBg, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 10 },
  signs: { backgroundColor: C.lightBg, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  callCard: { marginTop: 14, marginBottom: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: "#14212B", backgroundColor: "white" },
  callH: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  copy: { minHeight: 40, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: "white", justifyContent: "center" },
  evWhy: { fontSize: 14, marginVertical: 8 },
  evHint: { fontSize: 13, color: C.gray, marginVertical: 6 },
  doseRow: { flexDirection: "row", gap: 8, paddingVertical: 5, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: C.border },
  saveBtn: { width: "100%", backgroundColor: "white", borderWidth: 2, borderColor: C.primary, padding: 13, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  histCard: { backgroundColor: "white", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  histItem: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, backgroundColor: C.lightBg, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  mini: { position: "absolute", top: 0, left: 14, right: 14, zIndex: 30, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingRight: 8, paddingLeft: 14, minHeight: 56, borderRadius: 14, backgroundColor: "white", borderWidth: 1.5, borderColor: C.border, ...shadow(4, 14, "#14212B", 0.16, 6) },
  miniDot: { width: 16, height: 16, borderRadius: 8 },
});
