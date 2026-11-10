import IngredientSelector from "@/components/IngredientSelector";
import RecipeCard from "@/components/RecipeCard";
import Colors from "@/constants/Colors";
import { useRecipe } from "@/context/RecipeContext";
import { Recipe } from "@/types/Recipe";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const popularSearches = [
  "닭가슴살",
  "요구르트",
  "고구마",
  "연어",
  "바나나",
  "당근",
];
const categories = [
  {
    name: "주식",
    icon: "restaurant" as const,
    bgColor: "#dbeafe",
    color: "#1e40af",
  },
  {
    name: "간식",
    icon: "fast-food" as const,
    bgColor: "#dcfce7",
    color: "#15803d",
  },
  {
    name: "건강식",
    icon: "heart" as const,
    bgColor: "#fce7f3",
    color: "#be185d",
  },
  {
    name: "특별식",
    icon: "gift" as const,
    bgColor: "#f3e8ff",
    color: "#7e22ce",
  },
];

export default function SearchScreen({ navigation, route }: any) {
  const { recipes, toggleLike } = useRecipe();
  const [searchQuery, setSearchQuery] = useState("");

  // PC 웹 왼쪽 검색창에서 넘어온 검색어
  const incomingQuery: string | undefined = route?.params?.q;
  useEffect(() => {
    if (incomingQuery) setSearchQuery(incomingQuery);
  }, [incomingQuery]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showIngredientSheet, setShowIngredientSheet] = useState(false);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem("recentSearches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  const saveRecentSearch = async (term: string) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter((t) => t !== term)].slice(
      0,
      10
    );
    setRecentSearches(newRecent);
    await AsyncStorage.setItem("recentSearches", JSON.stringify(newRecent));
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem("recentSearches");
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedIngredients([]);
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = recipe.title.toLowerCase().includes(query);
        const matchesDesc = recipe.description?.toLowerCase().includes(query);
        const matchesIng = recipe.ingredients.some((i) =>
          i.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDesc && !matchesIng) return false;
      }

      // Categories
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(recipe.category)) return false;
      }

      // Ingredients
      if (selectedIngredients.length > 0) {
        const hasIngredient = selectedIngredients.some((ing) =>
          recipe.ingredients.some((ri) => ri.includes(ing))
        );
        if (!hasIngredient) return false;
      }

      return true;
    });
  }, [recipes, searchQuery, selectedCategories, selectedIngredients]);

  const handleRecipePress = (recipe: Recipe) => {
    if (searchQuery) saveRecentSearch(searchQuery);
    navigation.navigate("RecipeDetail", { recipe });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>검색</Text>
        <Text style={styles.subtitle}>원하는 레시피를 찾아보세요</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#52616D" />
          <TextInput
            style={styles.searchInput}
            placeholder="반려견 음식명, 재료명으로 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => saveRecentSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#52616D" />
            </TouchableOpacity>
          )}
        </View>
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
            color={selectedIngredients.length > 0 ? "white" : "#52616D"}
          />
          {selectedIngredients.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {selectedIngredients.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!searchQuery &&
        selectedCategories.length === 0 &&
        selectedIngredients.length === 0 ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="time-outline" size={20} color="#52616D" />
                    <Text style={styles.sectionTitle}>최근 검색어</Text>
                  </View>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearButton}>전체 삭제</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagContainer}>
                  {recentSearches.map((term, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.tag}
                      onPress={() => setSearchQuery(term)}
                    >
                      <Text style={styles.tagText}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Popular Searches */}
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="trending-up" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>인기 검색어</Text>
              </View>
              <View style={styles.tagContainer}>
                {popularSearches.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.tag, styles.popularTag]}
                    onPress={() => setSearchQuery(term)}
                  >
                    <Text style={styles.popularTagText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>카테고리</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: selectedCategories.includes(cat.name)
                          ? Colors.primary
                          : cat.bgColor,
                      },
                    ]}
                    onPress={() => toggleCategory(cat.name)}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={24}
                      color={
                        selectedCategories.includes(cat.name)
                          ? "white"
                          : cat.color
                      }
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        {
                          color: selectedCategories.includes(cat.name)
                            ? "white"
                            : cat.color,
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Active Filters */}
            {(selectedCategories.length > 0 ||
              selectedIngredients.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>선택된 필터</Text>
                <View style={styles.tagContainer}>
                  {selectedCategories.map((cat, index) => (
                    <View key={`cat-${index}`} style={styles.activeFilter}>
                      <Text style={styles.activeFilterText}>{cat}</Text>
                      <TouchableOpacity onPress={() => toggleCategory(cat)}>
                        <Ionicons
                          name="close"
                          size={16}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {selectedIngredients.map((ing, index) => (
                    <View key={`ing-${index}`} style={styles.activeFilter}>
                      <Text style={styles.activeFilterText}>{ing}</Text>
                      <TouchableOpacity onPress={() => toggleIngredient(ing)}>
                        <Ionicons
                          name="close"
                          size={16}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearAllFilters}
                >
                  <Text style={styles.clearFiltersButtonText}>전체 초기화</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Search Results */}
            <View style={styles.section}>
              <Text style={styles.resultTitle}>
                {searchQuery ? `"${searchQuery}" 검색 결과` : "필터 결과"}
              </Text>
              <Text style={styles.resultCount}>
                {filteredRecipes.length}개의 레시피
              </Text>
            </View>

            {filteredRecipes.length > 0 ? (
              <View style={styles.recipeGrid}>
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onPress={() => handleRecipePress(recipe)}
                    onLike={() => toggleLike(Number(recipe.id))}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#B8C6CF" />
                <Text style={styles.emptyStateTitle}>검색 결과가 없습니다</Text>
                <Text style={styles.emptyStateText}>
                  다른 검색어로 시도해보세요
                </Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

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
    borderBottomColor: "#DDE5EA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  searchSection: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF3F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: "#EEF3F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3F6",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textDark,
    marginLeft: 6,
  },
  clearButton: {
    fontSize: 12,
    color: Colors.textLight,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#EEF3F6",
    borderRadius: 16,
  },
  tagText: {
    color: Colors.text,
    fontSize: 14,
  },
  popularTag: {
    backgroundColor: "#E2EEF4",
    borderWidth: 1,
    borderColor: "#C5DCE8",
  },
  popularTagText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryButton: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  categoryButtonText: {
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 14,
  },
  activeFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2EEF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  activeFilterText: {
    color: Colors.primary,
    marginRight: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  clearFiltersButton: {
    marginTop: 16,
    alignItems: "center",
  },
  clearFiltersButtonText: {
    color: Colors.textLight,
    textDecorationLine: "underline",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  resultCount: {
    color: Colors.textLight,
  },
  recipeGrid: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: Colors.textLight,
  },
});
