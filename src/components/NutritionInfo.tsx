import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface NutritionInfoProps {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  servings?: number;
}

export function NutritionInfo({
  calories,
  protein,
  fat,
  carbs,
  fiber,
  servings = 1,
}: NutritionInfoProps) {
  // 영양 정보가 없으면 표시하지 않음
  if (!calories && !protein && !fat && !carbs) {
    return null;
  }

  const renderNutrientBar = (
    label: string,
    value: number | undefined,
    icon: string,
    color: string
  ) => {
    if (value === undefined || value === null || isNaN(value)) return null;

    return (
      <View style={styles.nutrientRow}>
        <View style={styles.nutrientHeader}>
          <Ionicons name={icon as any} size={18} color={color} />
          <Text style={styles.nutrientLabel}>{label}</Text>
        </View>
        <Text style={styles.nutrientValue}>{value.toFixed(1)}g</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="nutrition-outline" size={24} color={Colors.primary} />
        <Text style={styles.title}>영양 정보</Text>
        {servings > 1 && (
          <Text style={styles.servingsText}>({servings}인분 기준)</Text>
        )}
      </View>

      {/* 칼로리 */}
      {calories ? (
        <View style={styles.caloriesCard}>
          <Text style={styles.caloriesLabel}>칼로리</Text>
          <Text style={styles.caloriesValue}>{calories.toFixed(0)} kcal</Text>
        </View>
      ) : null}

      {/* 영양소 */}
      <View style={styles.nutrientsContainer}>
        {renderNutrientBar("단백질", protein, "barbell-outline", "#FF6B6B")}
        {renderNutrientBar("지방", fat, "water-outline", "#4ECDC4")}
        {renderNutrientBar("탄수화물", carbs, "leaf-outline", "#95E1D3")}
        {renderNutrientBar("식이섬유", fiber, "flower-outline", "#F38181")}
      </View>

      {/* 영양소 비율 (시각화) */}
      {protein && fat && carbs && (
        <View style={styles.macroRatioContainer}>
          <Text style={styles.macroRatioTitle}>영양소 비율</Text>
          <View style={styles.macroRatioBar}>
            {(() => {
              const total = protein + fat + carbs;
              const proteinPercent = (protein / total) * 100;
              const fatPercent = (fat / total) * 100;
              const carbsPercent = (carbs / total) * 100;

              return (
                <>
                  <View
                    style={[
                      styles.macroSegment,
                      {
                        width: `${proteinPercent}%`,
                        backgroundColor: "#FF6B6B",
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.macroSegment,
                      { width: `${fatPercent}%`, backgroundColor: "#4ECDC4" },
                    ]}
                  />
                  <View
                    style={[
                      styles.macroSegment,
                      { width: `${carbsPercent}%`, backgroundColor: "#95E1D3" },
                    ]}
                  />
                </>
              );
            })()}
          </View>
          <View style={styles.macroLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "#FF6B6B" }]} />
              <Text style={styles.legendText}>단백질</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "#4ECDC4" }]} />
              <Text style={styles.legendText}>지방</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "#95E1D3" }]} />
              <Text style={styles.legendText}>탄수화물</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  servingsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  caloriesCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  caloriesLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  nutrientsContainer: {
    gap: 12,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nutrientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nutrientLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  macroRatioContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroRatioTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  macroRatioBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  macroSegment: {
    height: "100%",
  },
  macroLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

