import AllergyWarning from "@/components/AllergyWarning";
import ReviewSystem from "@/components/ReviewSystem";
import Colors from "@/constants/Colors";
import { usePet } from "@/context/PetContext";
import { useRecipe } from "@/context/RecipeContext";
import { Recipe } from "@/types/Recipe";
import { getAllergicIngredients } from "@/utils/allergyMappings";
import { getDailyNeeds } from "@/utils/nutritionCalculator";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecipeDetailScreen({ route, navigation }: any) {
  const { recipe: initialRecipe } = route.params as { recipe: Recipe };
  const { recipes, toggleLike, addReview } = useRecipe();
  const { pets } = usePet();
  const [activeTab, setActiveTab] = useState<"nutrition" | "reviews">(
    "nutrition"
  );

  // Get latest recipe data from context to ensure updates (like review count) are reflected
  const recipe =
    recipes.find((r) => r.id === initialRecipe.id) || initialRecipe;

  const { allergicIngredients, affectedPets } = getAllergicIngredients(
    recipe,
    pets
  );
  const hasAllergy = allergicIngredients.length > 0;

  // Calculate nutrition needs if pets exist (using first pet for demo)
  const targetPet = pets.length > 0 ? pets[0] : null;
  const dailyNeeds = targetPet
    ? getDailyNeeds(targetPet.weight, targetPet.isNeutered, targetPet.age)
    : null;

  const getPercentage = (value: number, total: number) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `레시피 상세 - ${recipe.title}`,
    });
  }, [navigation, recipe]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <ScrollView style={styles.content}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[
              styles.likeButton,
              recipe.isLiked && styles.likeButtonActive,
            ]}
            onPress={() => toggleLike(recipe.id)}
          >
            <Ionicons
              name={recipe.isLiked ? "heart" : "heart-outline"}
              size={24}
              color={recipe.isLiked ? "white" : "#6b7280"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailContent}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.title}>{recipe.title}</Text>
            <Text style={styles.description}>{recipe.description}</Text>
          </View>

          {/* Allergy Warning */}
          {hasAllergy && (
            <AllergyWarning
              allergicIngredients={allergicIngredients}
              affectedPets={affectedPets}
            />
          )}

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={24} color={Colors.primary} />
              <Text style={styles.infoLabel}>조리시간</Text>
              <Text style={styles.infoValue}>{recipe.cookTime}분</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons
                name="people-outline"
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.infoLabel}>분량</Text>
              <Text style={styles.infoValue}>{recipe.servings}회분</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons
                name="restaurant-outline"
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.infoLabel}>난이도</Text>
              <Text style={styles.infoValue}>{recipe.difficulty}</Text>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingLeft}>
              <Ionicons name="star" size={20} color="#eab308" />
              <Text style={styles.ratingValue}>{recipe.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({recipe.reviews}개 리뷰)</Text>
            </View>
            <Text style={styles.author}>작성자: {recipe.author}</Text>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>태그</Text>
            <View style={styles.tagContainer}>
              {recipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>재료</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.bullet} />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>조리 방법</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Warning */}
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={20} color="#d97706" />
              <Text style={styles.warningTitle}>주의사항</Text>
            </View>
            <Text style={styles.warningText}>
              레시피는 일반적인 가이드이며, 반려견의 건강 상태와 알러지를 항상
              확인하세요. 새로운 음식을 처음 급여할 때는 소량부터 시작하세요.
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "nutrition" && styles.tabActive,
              ]}
              onPress={() => setActiveTab("nutrition")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "nutrition" && styles.tabTextActive,
                ]}
              >
                영양정보
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "reviews" && styles.tabActive]}
              onPress={() => setActiveTab("reviews")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "reviews" && styles.tabTextActive,
                ]}
              >
                리뷰
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "nutrition" ? (
            recipe.nutrition ? (
              <View style={styles.nutritionGrid}>
                {dailyNeeds && (
                  <View style={styles.nutritionSummary}>
                    <Text style={styles.summaryTitle}>
                      {targetPet?.name}의 하루 권장량 대비
                    </Text>
                    <Text style={styles.summarySubtitle}>
                      (DER: {dailyNeeds.dailyCalories}kcal 기준)
                    </Text>
                  </View>
                )}

                <View
                  style={[styles.nutritionCard, { backgroundColor: "#dbeafe" }]}
                >
                  <Text style={[styles.nutritionValue, { color: "#1e40af" }]}>
                    {recipe.nutrition.calories}
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: "#1e40af" }]}>
                    칼로리 (kcal)
                  </Text>
                  {dailyNeeds && (
                    <Text style={styles.percentageText}>
                      {getPercentage(
                        recipe.nutrition.calories,
                        dailyNeeds.dailyCalories
                      )}
                      %
                    </Text>
                  )}
                </View>
                <View
                  style={[styles.nutritionCard, { backgroundColor: "#dcfce7" }]}
                >
                  <Text style={[styles.nutritionValue, { color: "#15803d" }]}>
                    {recipe.nutrition.protein}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: "#15803d" }]}>
                    단백질
                  </Text>
                </View>
                <View
                  style={[styles.nutritionCard, { backgroundColor: "#fef9c3" }]}
                >
                  <Text style={[styles.nutritionValue, { color: "#854d0e" }]}>
                    {recipe.nutrition.fat}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: "#854d0e" }]}>
                    지방
                  </Text>
                </View>
                <View
                  style={[styles.nutritionCard, { backgroundColor: "#fee2e2" }]}
                >
                  <Text style={[styles.nutritionValue, { color: "#991b1b" }]}>
                    {recipe.nutrition.carbs}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: "#991b1b" }]}>
                    탄수화물
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyNutrition}>
                <Text style={styles.emptyNutritionText}>
                  영양 정보가 아직 분석되지 않았습니다.
                </Text>
              </View>
            )
          ) : (
            <ReviewSystem
              reviews={recipe.reviewList || []}
              onAddReview={(review) => addReview(recipe.id, review)}
              userPets={pets}
              recipeId={recipe.id}
            />
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 240,
    width: "100%",
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  likeButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 30,
    padding: 12,
  },
  likeButtonActive: {
    backgroundColor: Colors.primary,
  },
  detailContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  infoCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  ratingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  ratingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginLeft: 6,
    marginRight: 6,
  },
  reviewCount: {
    color: Colors.textLight,
    fontSize: 14,
  },
  author: {
    fontSize: 14,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: Colors.text,
    fontSize: 14,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 16,
    color: Colors.text,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: "bold",
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  warningCard: {
    backgroundColor: "#fff7ed",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    color: "#d97706",
    fontWeight: "bold",
    marginLeft: 8,
  },
  warningText: {
    color: "#92400e",
    fontSize: 14,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textLight,
    fontSize: 16,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  nutritionCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
  },
  percentageText: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: "600",
  },
  nutritionSummary: {
    width: "100%",
    marginBottom: 16,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  summarySubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  emptyNutrition: {
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
  },
  emptyNutritionText: {
    color: Colors.textLight,
  },
});
