"use no memo";
// 목업처럼 전역 값을 직접 바꾸고 다시 그리므로 React Compiler 자동 메모를 끈다.
// 홈(레시피 피드)과 찜 화면, 레시피 카드 (목업 renderFeed / cardHtml / renderFav)
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { blockReason, CATS, SEASON, SEASON_ICON, STATUS_NAME } from "../logic/common";
import { bump, J, pet, requireLogin, SEED, state, toggleFav, type Pet, type Recipe, type RecipeId } from "../store";
import { C, Fold, Icon, Lvl, shadow, Txt } from "../ui/base";

function StatusBadge({ j, p }: { j: any; p: Pet }) {
  const n = p.name;
  if (j.status === "no") return <Lvl kind="no">🚫 {n}에겐 안 돼요</Lvl>;
  if (j.status === "caution") return <Lvl kind="caution">⚠️ {n}: 주의 {j.warns.length}</Lvl>;
  if (j.status === "unknown") return <Lvl kind="unknown">❔ 확인 안 됨 {j.unknown.length}</Lvl>;
  return <Lvl kind="ok">✓ {n}에게 괜찮아요</Lvl>;
}

// 목업 시드는 내용과 맞는 사진이 없어 주재료 그림으로 대신한다. 실제 앱은 작성자가 올린 사진을 쓴다.
export function RecipeVisual({ r, height }: { r: Recipe; height: number }) {
  if (r.image) return <Image source={{ uri: r.image }} style={{ width: "100%", height }} contentFit="cover" />;
  const c = CATS.find((x) => x[0] === r.category) || ["", "restaurant-outline", ""];
  return (
    <View style={{ height, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#D8E7EF" }}>
      <Icon name={c[1]} size={44} color={C.primary} />
      <Txt style={{ fontSize: 12, fontWeight: "700", color: C.textLight }}>{c[2]}</Txt>
    </View>
  );
}

export function RecipeCard({ r, j, p, onOpen }: { r: Recipe; j: any; p: Pet; onOpen: (id: RecipeId) => void }) {
  const fav = state.favs.has(r.id);
  return (
    <Pressable onPress={() => onOpen(r.id)} style={[s.card, j.status === "no" && { opacity: 0.62 }]}>
      <View style={{ height: 160 }}>
        <RecipeVisual r={r} height={160} />
        <Pressable onPress={() => requireLogin(() => toggleFav(r.id), "찜한 레시피는 계정에 저장돼서 다른 기기에서도 볼 수 있어요.")} style={s.heart} accessibilityLabel="찜" accessibilityState={{ selected: fav }}>
          <Icon name={fav ? "heart" : "heart-outline"} size={19} color={fav ? "#E5484D" : C.textLight} />
        </Pressable>
      </View>
      <View style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <View style={s.badges}>
          <StatusBadge j={j} p={p} />
          {j.status !== "unknown" && j.unknown.length ? <Lvl kind="unknown">❔ 확인 안 됨 {j.unknown.length}</Lvl> : null}
          {j.notes.length ? <Lvl kind="unknown">✂️ 손질 안내 {j.notes.length}</Lvl> : null}
        </View>
        {j.status === "no" ? <Txt style={s.reason}>{blockReason(j)}</Txt> : null}
        <Txt style={{ fontSize: 16, fontWeight: "800", marginBottom: 4 }}>
          {r.title}
          {r.seasons.length ? <Txt style={{ fontSize: 11, fontWeight: "700", color: C.textLight }}> {r.seasons.map((x) => SEASON[x] + x).join(" ")}</Txt> : null}
        </Txt>
        <Txt style={{ fontSize: 12.5, color: C.textLight, marginBottom: 8 }}>{r.desc}</Txt>
        <View style={s.cardFoot}>
          <Txt style={{ fontSize: 12, color: C.textLight }}>
            ⭐ {r.rating} ({r.reviews})
          </Txt>
          <Txt style={{ fontSize: 12, color: C.textLight }}>
            작성자: <Txt style={{ fontSize: 12, fontWeight: "800", color: C.textLight }}>{r.author}</Txt>
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

export function HomeScreen({ onOpen }: { onOpen: (id: RecipeId) => void }) {
  const p = pet();
  const seasonChip: [string, string, string] = ["season", SEASON_ICON[state.season], state.season + " 추천"];
  const chips: [string, string, string][] = [["all", "apps-outline", "전체"], ...CATS, seasonChip];
  const catName = state.cat === "season" ? `${SEASON[state.season]} ${state.season} 추천` : (CATS.find((c) => c[0] === state.cat) || ["", "", "전체"])[2];
  const title = (state.statusFilter ? `${STATUS_NAME[state.statusFilter]} · ` : "") + catName + " 레시피";

  let list = SEED.recipes.map((r) => ({ r, j: J.judgeRecipe(r.ingredients, p) }));
  if (state.cat === "season") list = list.filter((x) => (x.r.seasons || []).includes(state.season));
  else if (state.cat !== "all") list = list.filter((x) => x.r.category === state.cat);
  const q = state.query.trim();
  if (q) list = list.filter((x) => x.r.title.includes(q) || x.r.ingredients.some((i) => i.includes(q)));
  const hiddenList = state.fitOnly ? list.filter((x) => x.j.status === "no" || x.j.status === "unknown") : [];
  const hidden = hiddenList.length;
  if (state.fitOnly) list = list.filter((x) => x.j.status !== "no" && x.j.status !== "unknown");
  if (state.statusFilter) list = list.filter((x) => x.j.status === state.statusFilter);

  return (
    <View>
      {state.recipeSource === "error" ? (
        <Txt style={{ fontSize: 12, color: C.textLight, marginBottom: 8 }} lh={1.5}>서버에 연결하지 못해 예시 레시피를 보여 드려요.</Txt>
      ) : null}
      <View style={s.search}>
        <Icon name="search" size={18} color={C.textLight} />
        <TextInput
          value={state.query}
          onChangeText={(v) => { state.query = v; bump(); }}
          placeholder="재료나 레시피 이름으로 찾기 (예: 닭가슴살, 연어, 단호박)"
          placeholderTextColor="#8A97A1"
          style={s.searchInput}
        />
      </View>
      <View style={s.fit}>
        <Txt style={{ fontSize: 12.5, fontWeight: "700", flex: 1 }}>🐶 {p.name}에게 맞는 레시피만 보기</Txt>
        <Pressable
          onPress={() => { state.fitOnly = !state.fitOnly; bump(); }}
          hitSlop={12}
          accessibilityRole="switch"
          accessibilityState={{ checked: state.fitOnly }}
          style={[s.switch, state.fitOnly && { backgroundColor: C.primary }]}
        >
          <View style={[s.knob, state.fitOnly && { left: 21 }]} />
        </Pressable>
      </View>
      <View style={s.catGrid}>
        {chips.map(([k, ic, lb]) => {
          const on = state.cat === k, season = k === "season";
          const bg = on ? (season ? "#A4520A" : C.primary) : season ? "#FFF3E3" : C.lightBg;
          const fg = on ? "white" : season ? "#9A4A06" : C.textLight;
          return (
            <Pressable key={k} onPress={() => { state.cat = k; bump(); }} style={[s.catChip, { backgroundColor: bg }, state.bigText && { width: "31%" }]}>
              <Icon name={ic} size={15} color={on ? "white" : season ? "#C2620A" : C.primary} />
              <Txt style={{ fontSize: 12, fontWeight: "700", color: fg, letterSpacing: -0.3 }} numberOfLines={1}>
                {lb}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Txt style={{ fontSize: 14, fontWeight: "800" }}>{title}</Txt>
        <Txt style={{ fontSize: 11.5, color: C.textLight, fontWeight: "600" }}>
          {list.length}개{hidden ? ` · ${hidden}개 숨김` : ""}
        </Txt>
      </View>
      {state.statusFilter ? (
        <View style={s.filterBar}>
          <Txt style={{ fontSize: 13, color: C.primaryDark, flex: 1 }}>
            {p.name} 기준 <Txt style={{ fontSize: 13, fontWeight: "800", color: C.primaryDark }}>{STATUS_NAME[state.statusFilter]}</Txt> 레시피만 보는 중
          </Txt>
          <Pressable onPress={() => { state.statusFilter = null; bump(); }} style={s.filterClear}>
            <Txt style={{ fontSize: 13, fontWeight: "800", color: "white" }}>전체 보기</Txt>
          </Pressable>
        </View>
      ) : null}
      {hidden ? (
        <Fold
          style={s.hiddenWhy}
          summaryStyle={{ minHeight: 40, justifyContent: "center" }}
          summary={(open) => (
            <Txt style={{ fontSize: 13, fontWeight: "800", color: C.primary }}>
              {open ? "▾ " : "▸ "}
              {hidden}개를 숨겼어요 · 이유 보기
            </Txt>
          )}
        >
          {hiddenList.map((x) => (
            <View key={x.r.id} style={s.hiddenRow}>
              <Txt style={{ fontSize: 12.5 }} lh={1.5}>
                <Txt style={{ fontSize: 12.5, fontWeight: "800" }}>{x.r.title}</Txt> ·{" "}
                {x.j.status === "no" ? blockReason(x.j) : x.j.unknown.map((u: any) => u.n).join(", ") + " 근거 없음 (빼면 다시 보여요)"}
              </Txt>
            </View>
          ))}
        </Fold>
      ) : null}
      {list.length ? (
        list.map(({ r, j }) => <RecipeCard key={r.id} r={r} j={j} p={p} onOpen={onOpen} />)
      ) : (
        <Txt style={{ textAlign: "center", padding: 30, fontSize: 13, color: C.textLight }}>조건에 맞는 레시피가 없어요.</Txt>
      )}
    </View>
  );
}

export function FavScreen({ onOpen }: { onOpen: (id: RecipeId) => void }) {
  const p = pet(), list = SEED.recipes.filter((r) => state.favs.has(r.id));
  return (
    <View>
      <View style={{ paddingTop: 6, paddingBottom: 12, marginBottom: 12 }}>
        <Txt style={{ fontSize: 24, fontWeight: "800" }}>
          찜한 레시피 <Txt style={{ fontSize: 14, color: C.textLight }}>{list.length}개</Txt>
        </Txt>
        <Txt style={{ fontSize: 13.5, color: C.textLight, marginTop: 4 }}>배지는 지금 선택한 반려견 기준으로 다시 계산돼요.</Txt>
      </View>
      {list.length ? (
        list.map((r) => <RecipeCard key={r.id} r={r} j={J.judgeRecipe(r.ingredients, p)} p={p} onOpen={onOpen} />)
      ) : (
        <Txt style={{ textAlign: "center", paddingVertical: 40, paddingHorizontal: 20, fontSize: 13, color: C.textLight }} lh={1.6}>
          아직 찜한 레시피가 없어요.{"\n"}레시피 사진의 ♡를 누르면 여기에 모여요.
        </Txt>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: "white", borderRadius: 16, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: C.border, ...shadow(2, 6, "#000", 0.04, 1) },
  heart: { position: "absolute", top: 10, right: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", ...shadow(2, 6, "#000", 0.12, 2) },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  reason: { fontSize: 12, color: C.danger, fontWeight: "700", marginTop: -2, marginBottom: 6 },
  cardFoot: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  search: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 13.5, color: C.text, padding: 0, outlineStyle: "none" as any },
  fit: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12 },
  switch: { width: 40, height: 22, borderRadius: 11, backgroundColor: C.borderDark },
  knob: { position: "absolute", top: 3, left: 3, width: 16, height: 16, borderRadius: 8, backgroundColor: "white" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  catChip: { width: "23.5%", flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, height: 34, borderRadius: 17 },
  filterBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.tipBorder, borderRadius: 12, paddingVertical: 8, paddingLeft: 12, paddingRight: 8, marginBottom: 10 },
  filterClear: { minHeight: 40, borderRadius: 10, backgroundColor: C.primary, paddingHorizontal: 14, justifyContent: "center" },
  hiddenWhy: { backgroundColor: "white", borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, marginBottom: 10 },
  hiddenRow: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.border },
});
