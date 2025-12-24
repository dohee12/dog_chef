import Colors from "@/constants/Colors";
import { Pet } from "@/types/Pet";
import { Recipe } from "@/types/Recipe";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

const RankingItem = ({
  recipe,
  index,
  onPress,
  onLike,
}: {
  recipe: Recipe;
  index: number;
  onPress: () => void;
  onLike: () => void;
}) => {
  const [hasError, setHasError] = React.useState(false);

  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.rank}>{index + 1}</Text>
      <Image
        source={{
          uri:
            !hasError && recipe.image
              ? recipe.image
              : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        onError={() => setHasError(true)}
      />
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
      <TouchableOpacity onPress={onLike}>
        <Ionicons
          name={recipe.isLiked ? "heart" : "heart-outline"}
          size={20}
          color={recipe.isLiked ? Colors.primary : Colors.textLight}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function RankingList({ recipes, onRecipePress, onLike }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>인기 레시피</Text>
      {recipes.map((recipe, index) => (
        <RankingItem
          key={recipe.id}
          recipe={recipe}
          index={index}
          onPress={() => onRecipePress(recipe)}
          onLike={() => onLike(Number(recipe.id))}
        />
      ))}
    </View>
  );
}
