import Colors from "@/constants/Colors";
import { Recipe } from "@/types/Recipe";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface Props {
  recipe: Recipe;
  onPress: () => void;
  onLike: () => void;
  hasAllergy?: boolean;
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 160,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  allergyBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: Colors.warningText,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  allergyBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  likeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 8,
  },
  likeButtonActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  categoryBadge: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.text,
  },
});

export default function RecipeCard({
  recipe,
  onPress,
  onLike,
  hasAllergy,
  style,
}: Props) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
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

        {hasError && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#f3f4f6",
              alignItems: "center",
              justifyContent: "center",
              zIndex: -1,
            }}
          >
            <Ionicons name="image-outline" size={48} color="#d1d5db" />
          </View>
        )}

        {hasAllergy && (
          <View style={styles.allergyBadge}>
            <Ionicons name="warning" size={12} color="white" />
            <Text style={styles.allergyBadgeText}>알러지</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.likeButton, recipe.isLiked && styles.likeButtonActive]}
          onPress={onLike}
        >
          <Ionicons
            name={recipe.isLiked ? "heart" : "heart-outline"}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textLight} />
            <Text style={styles.infoText}>{recipe.cook_time}분</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="people-outline"
              size={14}
              color={Colors.textLight}
            />
            <Text style={styles.infoText}>{recipe.servings}회분</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#eab308" />
            <Text style={styles.ratingText}>{recipe.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{recipe.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
