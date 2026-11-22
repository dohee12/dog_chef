"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 멍슐랭 v12 목업을 React Native 로 옮긴 앱 틀: 웹 소개 칸, 머리, 탭 화면, AI 멍셰프 버튼, 겹쳐 뜨는 화면, 알림, 아래 탭
import React from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { SEASON } from "./logic/common";
import { AddScreen } from "./screens/Add";
import { CalcScreen } from "./screens/Calc";
import { ChatModal, SourceSheet } from "./screens/Chat";
import { DetailOverlay } from "./screens/Detail";
import { FavScreen, HomeScreen } from "./screens/Home";
import { PetScreen, PetSheet, Wizard } from "./screens/Pet";
import { bump, D, pet, SEED, setSeason, showTab, state, switchPet, toggleBigText, useStore, type Season, type Tab } from "./store";
import { Avatar, Bold, C, Icon, ScaleCtx, shadow, Txt } from "./ui/base";

const TABS: [Tab, string, string][] = [
  ["home", "home", "홈"],
  ["fav", "heart", "찜"],
  ["add", "add", "등록"],
  ["calc", "medkit", "먹었어요"],
  ["pet", "paw", "내 반려견"],
];

function Header() {
  const p = pet();
  // 좁은 폰(360px 등, 380px 미만)에서는 머리 글자가 버튼과 붙지 않게 몸무게를 뺀다.
  const narrow = useWindowDimensions().width < 380;
  return (
    <View style={s.header}>
      <Pressable onPress={() => showTab("home")} style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0, marginRight: 8 }}>
        <View style={s.logoIcon}><Icon name="paw" size={15} color="white" /></View>
        <Txt style={s.logoTitle} numberOfLines={1}>멍슐랭</Txt>
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0, flexShrink: 1 }}>
        <Pressable onPress={toggleBigText} accessibilityLabel="큰 글씨" accessibilityState={{ selected: state.bigText }} style={[s.bigBtn, state.bigText && { backgroundColor: C.primary, borderColor: C.primary }]}>
          <Txt style={{ fontSize: 15, fontWeight: "900", color: state.bigText ? "white" : C.primaryDark }}>
            가<Txt style={{ fontSize: 11, fontWeight: "900", color: state.bigText ? "white" : C.primaryDark }}>+</Txt>
          </Txt>
        </Pressable>
        <View style={s.cluster}>
          {state.tab !== "pet"
            ? SEED.pets.map((x) => {
                const on = x.key === state.pet;
                return (
                  <Pressable key={x.key} onPress={() => switchPet(x.key)} accessibilityLabel={x.name} accessibilityState={{ selected: on }}
                    style={[s.hAvatar, on && { borderColor: C.primary, transform: [{ scale: 1.12 }], ...shadow(0, 6, C.primary, 0.4, 2) }]}>
                    <Avatar p={x} size={26} />
                  </Pressable>
                );
              })
            : null}
          <Txt style={{ fontSize: 11, fontWeight: "800", color: C.primaryDark, marginLeft: 2 }} numberOfLines={1}>
            {narrow ? p.name : `${p.name} (${p.weight}kg)`}
          </Txt>
        </View>
      </View>
    </View>
  );
}

function TabBar() {
  return (
    <View style={s.tabbar}>
      {TABS.map(([k, ic, lb]) => {
        const on = state.tab === k;
        if (k === "add")
          return (
            <Pressable key={k} onPress={() => showTab(k)} style={[s.tab, { top: -14 }]} accessibilityLabel={lb}>
              <View style={[s.center, on && { backgroundColor: C.primaryDark }]}><Icon name="add" size={28} color="white" /></View>
              <Txt style={{ fontSize: 10.5, fontWeight: "700", color: on ? C.primary : C.textLight, marginTop: -1 }}>{lb}</Txt>
            </Pressable>
          );
        return (
          <Pressable key={k} onPress={() => showTab(k)} style={s.tab} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Icon name={ic} size={22} color={on ? C.primary : C.textLight} />
            <Txt style={{ fontSize: 10.5, fontWeight: "700", color: on ? C.primary : C.textLight }}>{lb}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// 떠 있는 AI 멍셰프 버튼. 숨길 때는 아래로 살짝 내려가며 사라지고, 눌리지 않게 한다.
function ChefFab({ hidden }: { hidden: boolean }) {
  const anim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: hidden ? 0 : 1, duration: 180, useNativeDriver: Platform.OS !== "web" }).start();
  }, [hidden, anim]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  return (
    <Animated.View style={[s.fabWrap, { opacity: anim, transform: [{ translateY }], pointerEvents: hidden ? "none" : "auto" }]} aria-hidden={hidden}>
      <Pressable onPress={() => { state.chatOpen = true; bump(); }} style={s.fab} accessibilityLabel="AI 멍셰프">
        <Icon name="chatbubble-ellipses" size={20} color="white" />
        <Txt style={{ fontSize: 13.5, fontWeight: "800", color: "white", letterSpacing: -0.3 }}>AI 멍셰프</Txt>
      </Pressable>
    </Animated.View>
  );
}

// 아래로 스크롤하는 동안 버튼을 숨기고, 위로 올리거나 스크롤을 멈추면 다시 보인다.
// 버튼이 그 자리에 온 '재료 넣기(+)'·찜 하트 같은 버튼을 가리지 않게 하려는 것.
const FAB_SHOW_AFTER_IDLE = 700;
function useFabHiddenOnScroll(tab: Tab) {
  const [hidden, setHidden] = React.useState(false);
  const lastY = React.useRef(0);
  const idle = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    setHidden(false);
    lastY.current = 0;
  }, [tab]);
  React.useEffect(() => () => { if (idle.current) clearTimeout(idle.current); }, []);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;
    if (dy > 4 && y > 8) setHidden(true);
    else if (dy < -4) setHidden(false);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setHidden(false), FAB_SHOW_AFTER_IDLE);
  };
  return { hidden, onScroll };
}

function Frame() {
  useStore();
  const [wiz, setWiz] = React.useState(false);
  const fab = useFabHiddenOnScroll(state.tab);
  const scale = state.bigText ? 1.18 : 1;
  const open = (id: number) => { state.detailId = id; bump(); };
  // 먹었어요(계산)는 자체 화면이 있고, 등록은 입력 칸·버튼이 화면 오른쪽 아래까지 차서 버튼을 두지 않는다.
  const showFab = state.tab !== "calc" && state.tab !== "add";
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScaleCtx.Provider value={scale}>
        <View style={{ flex: 1 }}>
          {state.tab === "calc" ? (
            <CalcScreen />
          ) : (
            <ScrollView key={state.tab} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="handled" onScroll={fab.onScroll} scrollEventThrottle={16}>
              {state.tab === "home" ? <HomeScreen onOpen={open} /> : state.tab === "fav" ? <FavScreen onOpen={open} /> : state.tab === "add" ? <AddScreen /> : <PetScreen onWizard={() => setWiz(true)} />}
            </ScrollView>
          )}
        </View>
        {showFab ? <ChefFab hidden={fab.hidden} /> : null}
        {state.chatOpen ? <ChatModal /> : null}
        {state.detailId !== null ? <DetailOverlay id={state.detailId} onClose={() => { state.detailId = null; bump(); }} /> : null}
        {wiz ? <Wizard onClose={() => setWiz(false)} /> : null}
        {state.petSheet ? <PetSheet /> : null}
        {state.source ? <SourceSheet /> : null}
      </ScaleCtx.Provider>
      {state.toast ? (
        <View style={s.toastWrap} pointerEvents="none">
          <View style={s.toast} accessibilityLiveRegion="polite">
            <Txt style={{ color: "white", fontSize: 13.5, fontWeight: "700", textAlign: "center" }}>{state.toast}</Txt>
          </View>
        </View>
      ) : null}
      <TabBar />
    </View>
  );
}

// 웹 주소에 ?demo 를 붙였을 때만 보이는 시연용 화면: 폰 모양 틀 + 왼쪽 개발 안내 칸.
// 고객이 여는 기본 화면에는 보이지 않는다.
const DEMO = Platform.OS === "web" && typeof window !== "undefined" && /[?&]demo(=|&|$)/.test(window.location.search);

// PC 웹 왼쪽 소개 칸 (목업 webshell-side)
function Side() {
  return (
    <View style={{ width: 400, marginRight: 40, justifyContent: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <View style={s.sideMark}><Icon name="paw" size={24} color="white" /></View>
        <Txt style={{ fontSize: 28, fontWeight: "800", color: C.primary }}>멍슐랭</Txt>
      </View>
      <Txt style={{ fontSize: 26, fontWeight: "800", marginBottom: 18 }} lh={1.35}>v12 목업{"\n"}근거 데이터로 반려견별 판정</Txt>
      <SideCard icon="shield-checkmark" title="v11에서 바뀐 점" accent>
        · 레시피 배지가 <Bold>고정 문구가 아니라 계산 결과</Bold>예요. 위쪽 강아지 얼굴을 바꿔 눌러 보세요.{"\n"}
        · 재료마다 <Bold>위험·주의·안전·확인 안 됨</Bold>과 <Bold>출처</Bold>가 붙어요. 출처를 누르면 원문 인용이 보여요.{"\n"}
        · 계산기는 Merck 수치로 계산하고, <Bold>&quot;안전&quot; 판정을 내지 않아요.</Bold>{"\n"}
        · AI 멍셰프는 <Bold>근거 데이터에서만</Bold> 답해요. 모르는 재료는 &quot;확인 안 됨&quot;이라고 답해요.
      </SideCard>
      <SideCard icon="flask-outline" title="이렇게 눌러 보세요">
        1. 초코 선택 → &quot;단호박 락토프리 치즈볼&quot;이 유제품 알레르기로 막혀요.{"\n"}
        2. 코코 선택 → 닭고기 알레르기로 닭가슴살 죽이 막히고, 연어에는 교차반응 주의가 떠요.{"\n"}
        3. 보리 선택 → 췌장염 때문에 올리브유·오리고기 레시피에 주의가 떠요.{"\n"}
        4. 레시피 등록에서 &quot;포도&quot;, &quot;체리&quot;, &quot;민트&quot;를 넣어 보세요.
      </SideCard>
      <SideCard icon="leaf-outline" title="계절 추천 칩">
        카테고리 마지막 칸은 <Bold>지금 계절</Bold>에 맞춰 바뀌어요 (오늘 기준). 아래를 눌러 계절을 바꿔 보세요.
      </SideCard>
      <View style={{ flexDirection: "row", gap: 6, marginTop: -4, marginBottom: 12, marginLeft: 16 }}>
        {(Object.entries(SEASON) as [Season, string][]).map(([se, ic]) => {
          const on = se === state.season;
          return (
            <Pressable key={se} onPress={() => setSeason(se)} style={[s.seasonChip, on && { backgroundColor: C.primary, borderColor: C.primary }]}>
              <Txt style={{ fontSize: 12.5, fontWeight: "600", color: on ? "white" : C.textLight }}>{ic} {se}</Txt>
            </Pressable>
          );
        })}
      </View>
      <SideCard icon="help-circle-outline" title="결정할 것">
        1. AI 멍셰프: 데이터 검색형 vs LLM{"\n"}2. 위험 재료 레시피 등록을 막을지{"\n"}3. 섭취 기록 저장 기능 포함 여부
      </SideCard>
      <Txt style={{ fontSize: 11, color: C.textLight }} lh={1.5}>판정 데이터: dog-food-evidence.json v{D.meta.version} · 수의사 감수 전 초안</Txt>
    </View>
  );
}
function SideCard({ icon, title, accent, children }: { icon: string; title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <View style={[s.sideCard, accent && { borderLeftWidth: 4, borderLeftColor: C.primary }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon name={icon} size={14} color={C.primary} />
        <Txt style={{ fontSize: 13.5, fontWeight: "800", color: C.primary }}>{title}</Txt>
      </View>
      <Txt style={{ fontSize: 12, color: C.textLight }} lh={1.5}>{children}</Txt>
    </View>
  );
}

function Shell() {
  useStore();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = Platform.OS === "web" && width > 520;
  if (!wide)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Frame />
      </View>
    );
  // 넓은 화면: 폰 틀 없이 가운데에 앱 너비만큼 세로로 꽉 채운다.
  if (!DEMO)
    return (
      <View style={{ flex: 1, backgroundColor: "#E6EEF3", alignItems: "center" }}>
        <View style={s.column}>
          <Frame />
        </View>
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: "#E6EEF3", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 20 }}>
      {width > 1100 ? <Side /> : null}
      <View style={[s.frame, { height: Math.min(890, height * 0.96) }]}>
        <Frame />
      </View>
    </View>
  );
}

export default function V12App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  column: { flex: 1, width: "100%", maxWidth: 480, backgroundColor: C.bg, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border },
  frame: { width: "100%", maxWidth: 480, backgroundColor: C.bg, borderRadius: 36, borderWidth: 6, borderColor: "#CBD5E1", overflow: "hidden", ...shadow(20, 40, C.primaryDark, 0.18, 8) },
  header: { backgroundColor: "white", paddingVertical: 10, paddingHorizontal: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border },
  logoIcon: { width: 28, height: 28, backgroundColor: C.primary, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  logoTitle: { fontSize: 19, fontWeight: "800", color: C.primary, letterSpacing: -0.5 },
  bigBtn: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", minWidth: 44, height: 36, borderWidth: 1, borderColor: C.border, backgroundColor: C.lightBg, borderRadius: 18, paddingHorizontal: 8, paddingTop: 6 },
  cluster: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.lightBg, paddingVertical: 4, paddingLeft: 6, paddingRight: 10, borderRadius: 24, borderWidth: 1, borderColor: C.border, flexShrink: 1, minHeight: 42 },
  hAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "transparent", padding: 1, alignItems: "center", justifyContent: "center" },
  tabbar: { height: 64, backgroundColor: "white", borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingBottom: 4, zIndex: 10 },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  center: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "white", ...shadow(5, 14, C.primary, 0.4, 6) },
  fabWrap: { position: "absolute", bottom: 90, right: 18, zIndex: 50 },
  fab: { backgroundColor: C.primary, paddingVertical: 10, paddingLeft: 12, paddingRight: 16, borderRadius: 28, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 2, borderColor: "rgba(255,255,255,0.25)", zIndex: 50, ...shadow(6, 18, C.primary, 0.45, 8) },
  toastWrap: { position: "absolute", bottom: 90, left: 0, right: 0, alignItems: "center", zIndex: 200 },
  toast: { maxWidth: "88%", backgroundColor: "#14212B", paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, zIndex: 200 },
  sideMark: { width: 44, height: 44, backgroundColor: C.primary, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sideCard: { backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12, ...shadow(4, 12, "#14212B", 0.05, 1) },
  seasonChip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "white", borderWidth: 1, borderColor: C.border, minHeight: 34, justifyContent: "center" },
});
