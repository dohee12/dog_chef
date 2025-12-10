import CategoryTabs from "@/components/CategoryTabs";
import IngredientSelector from "@/components/IngredientSelector";
import PetCuration from "@/components/PetCuration";
import RankingList from "@/components/RankingList";
import RecipeCard from "@/components/RecipeCard";
import Colors from "@/constants/Colors";
import { usePet } from "@/context/PetContext";
import { useRecipe } from "@/context/RecipeContext";
import { Recipe } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "recipe" | "popular" | "recommendation";

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ navigation }: any) {
  // 레시피 데이터와 좋아요 함수 가져오기
  const { recipes, toggleLike, loadRecipes } = useRecipe();
  // 반려동물 데이터 가져오기
  const { pets, loadPets } = usePet();
  // 현재 선택된 카테고리
  const [activeCategory, setActiveCategory] = useState("전체");
  // 현재 활성화된 탭
  const [activeTab, setActiveTab] = useState<TabType>("recipe");
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // 필터 상태
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showIngredientSheet, setShowIngredientSheet] = useState(false);

  // FAB 상태 및 애니메이션
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;

  // 탭 목록 정의
  const tabs: { key: TabType; label: string }[] = [
    { key: "recipe", label: "전체 레시피" },
    { key: "popular", label: "인기 레시피" },
    { key: "recommendation", label: "맞춤 추천" },
  ];

  // 재료 선택 토글 함수
  const toggleIngredient = (ing: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  // 레시피 필터링 함수
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    // 1. 카테고리 필터 저장
    if (activeCategory !== "전체") {
      result = result.filter((r) => r.category === activeCategory);
    }

    // 2. 재료 필터 적용
    if (selectedIngredients.length > 0) {
      result = result.filter((recipes) => {
        return selectedIngredients.some((ing) =>
          recipes.ingredients.some((ri) => ri.includes(ing))
        );
      });
    }

    return result;
  }, [recipes, activeCategory, selectedIngredients]);

  // 인기 레시피 정렬
  const topRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => b.rating - a.rating);
  }, [recipes]);

  // 레시피 상세 화면으로 이동
  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate("RecipeDetail", { recipe }); // RootNavigator 이름과 일치시킴
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRecipes(), loadPets()]);
    setRefreshing(false);
  };

  const handleLogoPress = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // FAB Toggle
  const toggleFab = () => {
    const toValue = isFabOpen ? 0 : 1;
    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 5,
    }).start();
    setIsFabOpen(!isFabOpen);
  };

  const closeFab = () => {
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
    setIsFabOpen(false);
  };

  // FAB Animations
  const dogStyle = {
    transform: [
      { scale: fabAnimation },
      {
        translateY: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -70], // 더 아래쪽 (Main 버튼 바로 위)
        }),
      },
    ],
    opacity: fabAnimation,
  };

  const recipeStyle = {
    transform: [
      { scale: fabAnimation },
      {
        translateY: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -130], // 더 위쪽 (반려견 버튼 위)
        }),
      },
    ],
    opacity: fabAnimation,
  };

  const dimOpacity = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 (로고) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={handleLogoPress}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.logoText}>멍슐랭</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 타이틀 섹션 */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>멍슐랭 레시피</Text>
          <Text style={styles.subtitle}>우리 강아지를 위한 건강한 레시피</Text>
        </View>

        {/* 상단 '내 레시피 추가' 버튼 제거됨 */}

        {/* 탭 바 */}
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 탭 컨텐츠 */}
        {activeTab === "recipe" && (
          <>
            {/* 필터 버튼 및 카테고리 탭 */}
            <View style={styles.filterHeader}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedIngredients.length > 0 && styles.filterButtonActive,
                ]}
                onPress={() => setShowIngredientSheet(true)}
              >
                <Ionicons
                  name="filter"
                  size={20}
                  color={
                    selectedIngredients.length > 0 ? "white" : Colors.textLight
                  }
                />
                {selectedIngredients.length > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {selectedIngredients.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <CategoryTabs
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
              </View>
            </View>

            <View style={styles.countContainer}>
              <Text style={styles.countText}>
                전체 {filteredRecipes.length}개
              </Text>
            </View>

            <View style={styles.recipeList}>
              {filteredRecipes.map((recipe) => {
                const hasAllergy = pets.some((pet) =>
                  pet.allergies.some((allergy) =>
                    recipe.ingredients.some((ing) => ing.includes(allergy))
                  )
                );

                return (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onPress={() => handleRecipePress(recipe)}
                    onLike={() => toggleLike(recipe.id)}
                    hasAllergy={hasAllergy}
                    style={{ marginBottom: 16 }}
                  />
                );
              })}
            </View>
          </>
        )}

        {activeTab === "popular" && (
          <RankingList
            recipes={topRecipes}
            pets={pets}
            onLike={toggleLike}
            onRecipePress={handleRecipePress}
          />
        )}

        {activeTab === "recommendation" && (
          <>
            {pets.length > 0 ? (
              <PetCuration
                recipes={recipes}
                pets={pets}
                onRecipePress={handleRecipePress}
                onLike={toggleLike}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  반려동물을 등록하고 맞춤 추천을 받아보세요!
                </Text>
                <TouchableOpacity
                  style={styles.addPetButton}
                  onPress={() => navigation.navigate("PetForm")}
                >
                  <Text style={styles.addPetButtonText}>반려동물 등록하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Custom FAB Implementation in HomeScreen */}
      <Modal visible={isFabOpen} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeFab}>
          <Animated.View
            style={[styles.dimBackground, { opacity: dimOpacity }]}
          />
        </TouchableWithoutFeedback>

        {/* Floating Menu Items */}
        <View style={styles.fabMenuContainer} pointerEvents="box-none">
          {/* 1. 레시피 등록 */}
          <Animated.View style={[styles.fabSubButtonWrapper, recipeStyle]}>
            <TouchableOpacity
              style={styles.fabSubButton}
              onPress={() => {
                closeFab();
                navigation.navigate("RecipeForm"); // 네비게이션 연결
              }}
            >
              <Ionicons name="restaurant" size={20} color="white" />
              <Text style={styles.fabSubButtonText}>레시피 등록</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* 2. 반려견 등록 */}
          <Animated.View style={[styles.fabSubButtonWrapper, dogStyle]}>
            <TouchableOpacity
              style={styles.fabSubButton}
              onPress={() => {
                closeFab();
                navigation.navigate("PetForm"); // 네비게이션 연결
              }}
            >
              <Ionicons name="paw" size={20} color="white" />
              <Text style={styles.fabSubButtonText}>반려견 등록</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Main FAB Button (Always Visible) */}
      <TouchableOpacity
        style={styles.fabMainButton}
        activeOpacity={0.9}
        onPress={toggleFab}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.fabMainText}>추가</Text>
      </TouchableOpacity>

      <IngredientSelector
        visible={showIngredientSheet}
        onClose={() => setShowIngredientSheet(false)}
        selectedIngredients={selectedIngredients}
        onToggle={toggleIngredient}
        title="재료 필터"
        subtitle="원하는 재료를 선택하여 레시피를 필터링하세요"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  tabBarContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 4,
    borderRadius: 25,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.textDark,
  },
  recipeList: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: Colors.textLight,
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  addPetButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addPetButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  bottomSpacer: {
    height: 100, // FAB 공간 확보
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 24,
    marginBottom: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 0,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "white",
  },
  filterBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  countContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  countText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // FAB Styles
  fabMainButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  fabMainText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  dimBackground: {
    flex: 1,
    backgroundColor: "black",
  },
  fabMenuContainer: {
    position: "absolute",
    bottom: 24 + 56 + 16, // FAB 높이 + 마진
    right: 24,
    alignItems: "flex-end",
  },
  fabSubButtonWrapper: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  fabSubButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight, // 보조 색상 (살짝 연한 주황)
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  fabSubButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 14,
  },
});
