import Colors from "@/constants/Colors";
import { Pet } from "@/types/Pet";
import { Recipe } from "@/types/Recipe";
import { allergyMappings } from "@/utils/allergyMappings";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import RecipeCard from "./RecipeCard";

interface Props {
  recipes: Recipe[];
  pets: Pet[];
  onRecipePress: (recipe: Recipe) => void;
  onLike: (id: number) => void;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyText: {
    color: Colors.textLight,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
});

export default function PetCuration({
  recipes,
  pets,
  onRecipePress,
  onLike,
}: Props) {
  if (pets.length === 0) return null;

  // Simple curation: Recommend recipes that don't contain allergies for the first pet
  const mainPet = pets[0];

  // Find recipes safe for this pet
  const safeRecipes = recipes
    .filter((recipe) => {
      const petAllergies = mainPet.allergies || [];
      // Check if any ingredient maps to an allergy
      const hasAllergy = recipe.ingredients.some((ingredient) => {
        return petAllergies.some((allergy) => {
          const relatedTerms = allergyMappings[allergy] || [allergy];
          return relatedTerms.some((term) => ingredient.includes(term));
        });
      });
      return !hasAllergy;
    })
    .slice(0, 2); // Take top 2

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{mainPet.name}를 위한 추천</Text>
        <Text style={styles.subtitle}>알러지 걱정 없는 안전한 레시피에요</Text>
      </View>

      {safeRecipes.length > 0 ? (
        safeRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onPress={() => onRecipePress(recipe)}
            onLike={() => onLike(Number(recipe.id))}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>추천할 만한 레시피를 찾고 있어요!</Text>
      )}
    </View>
  );
}
