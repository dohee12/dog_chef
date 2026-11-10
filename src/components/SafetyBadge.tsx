import Colors from "@/constants/Colors";
import { getRecipeSafety, SafetyLevel, SafetyResult } from "@/utils/ingredientSafety";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

const LOOK: Record<SafetyLevel, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  safe: { color: Colors.safety, bg: Colors.safetyBackground, icon: "shield-checkmark" },
  caution: { color: Colors.caution, bg: Colors.cautionBackground, icon: "alert-circle" },
  danger: { color: Colors.warningText, bg: Colors.warningBackground, icon: "warning" },
};

// "안전함"이라고 말하지 않는다. 목록에 걸린 재료가 없다는 뜻만 적는다.
function badgeText(result: SafetyResult): string {
  if (result.level === "safe") return "위험 재료 없음";
  const n = result.hits.filter((h) => h.level === result.level).length;
  return result.level === "danger" ? `위험 재료 ${n}` : `주의 재료 ${n}`;
}

export function SafetyBadge({ ingredients, style }: { ingredients: string[]; style?: ViewStyle }) {
  const result = getRecipeSafety(ingredients);
  const look = LOOK[result.level];
  return (
    <View style={[styles.badge, { backgroundColor: look.bg }, style]}>
      <Ionicons name={look.icon} size={12} color={look.color} />
      <Text style={[styles.badgeText, { color: look.color }]}>{badgeText(result)}</Text>
    </View>
  );
}

// 상세 화면용: 어떤 재료가 왜 걸렸는지 보여준다
export function SafetyPanel({ ingredients }: { ingredients: string[] }) {
  const result = getRecipeSafety(ingredients);
  const look = LOOK[result.level];
  const title =
    result.level === "danger"
      ? "강아지에게 위험한 재료가 있어요"
      : result.level === "caution"
      ? "양과 손질을 조심할 재료가 있어요"
      : "위험 재료 목록에 걸린 재료가 없어요";

  return (
    <View style={[styles.panel, { backgroundColor: look.bg }]}>
      <View style={styles.panelHeader}>
        <Ionicons name={look.icon} size={20} color={look.color} />
        <Text style={[styles.panelTitle, { color: look.color }]}>{title}</Text>
      </View>
      {result.hits.map((hit, i) => (
        <Text key={i} style={styles.hitText}>
          <Text style={[styles.hitName, { color: LOOK[hit.level].color }]}>
            {hit.level === "danger" ? "위험" : "주의"} · {hit.ingredient}
          </Text>
          {"  "}
          {hit.reason}
        </Text>
      ))}
      <Text style={styles.note}>
        자주 알려진 위험 재료 목록과 재료 이름을 비교한 결과예요. 수의사 진단을 대신하지 않아요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  panel: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 6,
    flex: 1,
  },
  hitText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textDark,
    marginTop: 4,
  },
  hitName: {
    fontWeight: "700",
  },
  note: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
  },
});
