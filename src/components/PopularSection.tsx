import Colors from "@/constants/Colors";
import { Pet } from "@/types/Pet";
import { Recipe } from "@/types/Recipe";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import RecipeCard from "./RecipeCard";

interface Props {
  recipes: Recipe[];
  onRecipePress: (recipe: Recipe) => void;
  pets?: Pet[];
  onLike?: (id: number) => void;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  cardWrapper: {
    width: 280,
    marginRight: 16,
  },
});

// Check allergy logic needs to be passed down or implemented here
// For simplicity, assuming checkAllergy is handled by parent or not critical for this view unless required.
// But RecipeCard accepts hasAllergy.
// Since this is a display component, I'll leave allergy check to be passed if needed,
// but for now I won't implement complex logic inside this component to keep it clean.
// Wait, I can import checkAllergy from utils/allergyMappings if I want to show it.
// Let's keep it simple as per props in 멍슐랭.txt it doesn't explicitly demand it here but good to have.

export default function PopularSection({
  recipes,
  onRecipePress,
  onLike,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>인기 레시피 TOP 3</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recipes.slice(0, 3).map((recipe) => (
          <View key={recipe.id} style={styles.cardWrapper}>
            <RecipeCard
              recipe={recipe}
              onPress={() => onRecipePress(recipe)}
              onLike={() => onLike && onLike(Number(recipe.id))}
              // hasAllergy={/* passed from parent if needed */}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
