import AllergyWarning from "@/components/AllergyWarning";
import ReviewSystem from "@/components/ReviewSystem";
import { NutritionInfo } from "@/components/NutritionInfo";
import { RecipeActions } from "@/components/RecipeActions";
import { ReviewList } from "@/components/ReviewList";
import { ReviewForm } from "@/components/ReviewForm";
import Colors from "@/constants/Colors";
import { usePet } from "@/context/PetContext";
import { useRecipe } from "@/context/RecipeContext";
import { useAuth } from "@/context/AuthContext";
import { useReviews } from "@/context/ReviewContext";
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
  const { recipes, toggleLike } = useRecipe();
  const { pets } = usePet();
  const { user, requireAuth } = useAuth();
  const { reviews } = useReviews();
  const [activeTab, setActiveTab] = useState<"nutrition" | "reviews">(
    "nutrition"
  );
  const [reviewFormVisible, setReviewFormVisible] = useState(false);

  // Get latest recipe data from context to ensure updates (like review count) are reflected
  const recipe =
    recipes.find((r) => r.id === initialRecipe.id) || initialRecipe;

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>레시피 정보를 불러올 수 없습니다.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.primary, marginTop: 10 }}>
            뒤로 가기
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const matchingReviews = reviews.filter(
    (review) => Number(review.recipe_id) === Number(recipe.id)
  );
  const reviewsCount =
    matchingReviews.length > 0 ? matchingReviews.length : recipe.reviews_count || 0;
  const averageRating =
    matchingReviews.length > 0
      ? matchingReviews.reduce((sum, review) => sum + review.rating, 0) /
        matchingReviews.length
      : recipe.average_rating || 0;

  const { allergicIngredients, affectedPets } = getAllergicIngredients(
    recipe,
    pets
  );
  const hasAllergy = allergicIngredients.length > 0;

  // Calculate nutrition needs if pets exist (using first pet for demo)
  const targetPet = pets.length > 0 ? pets[0] : null;
  const dailyNeeds = targetPet
    ? getDailyNeeds(targetPet.weight, targetPet.is_neutered, targetPet.age)
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
            onPress={() => toggleLike(recipe.id as number)}
          >
            <Ionicons
              name={recipe.isLiked ? "heart" : "heart-outline"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailContent}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.title}>{recipe.title}</Text>
            <Text style={styles.description}>{recipe.description}</Text>

            <View style={styles.deleteNotice}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.deleteNoticeText}>
                신선한 정보 유지를 위해 들록 후 24시간 동안만 공유되는
                게시물입니다.
              </Text>
            </View>
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
              <Text style={styles.infoValue}>{recipe.cook_time}분</Text>
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

          {/* Recipe Actions (수정/삭제 버튼) */}
          <RecipeActions recipe={recipe} />

          {/* Rating & Stats */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingLeft}>
              <Ionicons name="star" size={20} color="#eab308" />
              <Text style={styles.ratingValue}>
                {averageRating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({reviewsCount}개 리뷰)
              </Text>
            </View>
            <View style={styles.statsRight}>
              <Ionicons name="heart" size={16} color={Colors.primary} />
              <Text style={styles.likesCount}>{recipe.likes_count || 0}</Text>
            </View>
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
            <View>
              <NutritionInfo
                calories={recipe.calories}
                protein={recipe.protein}
                fat={recipe.fat}
                carbs={recipe.carbs}
                fiber={recipe.fiber}
                servings={recipe.servings}
              />
            </View>
          ) : (
            <View>
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => {
                  if (!user) {
                    requireAuth(navigation, "리뷰를 작성하려면 로그인이 필요합니다.");
                    return;
                  }
                  setReviewFormVisible(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.addReviewButtonText}>리뷰 작성</Text>
              </TouchableOpacity>

              <ReviewList recipeId={Number(recipe.id)} />

              <ReviewForm
                recipeId={Number(recipe.id)}
                visible={reviewFormVisible}
                onClose={() => setReviewFormVisible(false)}
              />
            </View>
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
  statsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addReviewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  deleteNotice: {
    flexDirection: "row",
    backgroundColor: Colors.lightBackground,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  deleteNoticeText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 6,
  },
});
