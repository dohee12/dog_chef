import CategoryTabs from "@/components/CategoryTabs";
import PetCuration from "@/components/PetCuration";
import PopularSection from "@/components/PopularSection";
import RankingList from "@/components/RankingList";
import Colors from "@/constants/Colors";
import { usePet } from "@/context/PetContext";
import { useRecipe } from "@/context/RecipeContext";
import { Recipe } from "@/types/Recipe";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen({ navigation }: any) {
  const { recipes, toggleLike } = useRecipe();
  const { pets } = usePet();
  const [activeCategory, setActiveCategory] = useState("전체");

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    if (activeCategory === "전체") return recipes;
    return recipes.filter((r) => r.category === activeCategory);
  }, [recipes, activeCategory]);

  // Top recipes (sorted by rating)
  const topRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => b.rating - a.rating);
  }, [recipes]);

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate("RecipeDetail", { recipe });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🐾 멍슐랭</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>멍슐랭 레시피</Text>
          <Text style={styles.subtitle}>우리 강아지를 위한 건강한 레시피</Text>
        </View>

        {/* Add Recipe Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("RecipeForm")}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>내 레시피 추가</Text>
        </TouchableOpacity>

        {/* Categories */}
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Popular Recipes */}
        <PopularSection
          recipes={topRecipes}
          onRecipePress={handleRecipePress}
          onLike={toggleLike}
        />

        {/* Ranking */}
        <RankingList
          recipes={filteredRecipes.slice(0, 5)} // Show top 5 matching category
          pets={pets}
          onLike={toggleLike}
          onRecipePress={handleRecipePress}
        />

        {/* Pet Curation */}
        {pets.length > 0 && (
          <PetCuration
            recipes={recipes}
            pets={pets}
            onRecipePress={handleRecipePress}
            onLike={toggleLike}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
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
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    marginBottom: 24,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  bottomSpacer: {
    height: 80,
  },
});
