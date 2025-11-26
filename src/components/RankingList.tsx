import Colors from "@/constants/Colors";
import { Pet } from "@/types/Pet";
import { Recipe } from "@/types/Recipe";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  recipes: Recipe[];
  pets: Pet[];
  onLike: (id: number) => void;
  onRecipePress: (recipe: Recipe) => void;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rank: {
    width: 30,
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    textAlign: "center",
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 4,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  statText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
});

export default function RankingList({ recipes, onRecipePress, onLike }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>레시피 랭킹</Text>
      {recipes.map((recipe, index) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.item}
          onPress={() => onRecipePress(recipe)}
        >
          <Text style={styles.rank}>{index + 1}</Text>
          <Image source={{ uri: recipe.image }} style={styles.image} />
          <View style={styles.content}>
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={12} color="#eab308" />
                <Text style={styles.statText}>{recipe.rating.toFixed(1)}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={12} color={Colors.primary} />
                <Text style={styles.statText}>
                  {recipe.isLiked ? "찜됨" : "찜하기"}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => onLike(recipe.id)}>
            <Ionicons
              name={recipe.isLiked ? "heart" : "heart-outline"}
              size={20}
              color={recipe.isLiked ? Colors.primary : Colors.textLight}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
}
