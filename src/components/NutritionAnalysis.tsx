import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface Analysis {
  nutrition: {
    basis: "author" | "calculated" | "none";
    calculated: {
      items: { input: string; matched_name: string; source: "mfds" | "builtin"; calories: number }[];
      missing: { input: string; reason: string }[];
      sources: ("mfds" | "builtin")[];
    };
  };
  pets: {
    pet_id: number;
    name: string;
    calorie_share: number | null;
    daily_needs: { daily_calories: number } | null;
    allergens: { ingredient: string; allergy: string }[];
  }[];
}

const SOURCE_LABEL = {
  mfds: "식약처 식품영양성분DB",
  builtin: "앱 내장 값",
};

/** 서버의 /recipes/:id/analysis 결과: 영양 값의 출처, 계산에서 빠진 재료, 내 반려견 하루 열량 대비 비율 */
export default function NutritionAnalysis({ recipeId, refreshKey }: { recipeId: number; refreshKey?: unknown }) {
  const { user } = useAuth();
  const [data, setData] = useState<Analysis | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    api
      .get<Analysis>(`/recipes/${recipeId}/analysis`)
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [recipeId, user?.id, refreshKey]);

  if (failed) return null;
  if (!data) return <ActivityIndicator color={Colors.primary} style={{ marginVertical: 8 }} />;

  const { basis, calculated } = data.nutrition;
  const basisText =
    basis === "author"
      ? "작성자가 직접 입력한 값입니다."
      : basis === "calculated"
      ? `재료로 계산한 값입니다 (${calculated.sources.map((s) => SOURCE_LABEL[s]).join(", ")} 기준).`
      : "재료의 양을 알 수 없어 영양을 계산하지 못했습니다.";

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.title}>영양 정보 출처</Text>
      </View>
      <Text style={styles.text}>{basisText}</Text>

      {calculated.items.length > 0 && (
        <View style={styles.list}>
          {calculated.items.map((i) => (
            <Text key={i.input} style={styles.item}>
              · {i.input} → {i.matched_name} ({SOURCE_LABEL[i.source]}) {i.calories}kcal
            </Text>
          ))}
        </View>
      )}
      {calculated.missing.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.subTitle}>계산에서 빠진 재료</Text>
          {calculated.missing.map((m) => (
            <Text key={m.input} style={styles.item}>
              · {m.input}: {m.reason}
            </Text>
          ))}
        </View>
      )}

      {data.pets.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.subTitle}>내 반려견 기준 (1회분)</Text>
          {data.pets.map((p) => (
            <Text key={p.pet_id} style={styles.item}>
              · {p.name}:{" "}
              {p.calorie_share !== null && p.daily_needs
                ? `하루 권장 ${p.daily_needs.daily_calories}kcal 의 ${p.calorie_share}%`
                : "체중이 없어 계산할 수 없어요"}
              {p.allergens.length > 0 ? ` · 알레르기 재료: ${p.allergens.map((a) => a.ingredient).join(", ")}` : ""}
            </Text>
          ))}
        </View>
      )}
      <Text style={styles.note}>참고용 값이며 수의사 상담을 대신하지 않습니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: Colors.lightBackground, borderRadius: 10, padding: 12, marginTop: 12, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontWeight: "700", color: Colors.text, fontSize: 14 },
  subTitle: { fontWeight: "600", color: Colors.text, fontSize: 13, marginBottom: 2 },
  text: { color: Colors.text, fontSize: 13, lineHeight: 19 },
  list: { marginTop: 4 },
  item: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  note: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
});
