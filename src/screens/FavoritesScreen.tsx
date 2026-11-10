import RecipeCard from "@/components/RecipeCard";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { useRecipe } from "@/context/RecipeContext";
import { Recipe } from "@/types/Recipe";
import { checkAllergy } from "@/utils/allergyMappings";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen({ navigation }: any) {
  const { user } = useAuth();
  const { recipes, toggleLike, loadRecipes } = useRecipe();
  const { pets } = usePet();
  const [refreshing, setRefreshing] = useState(false);

  // 화면에 포커스될 때마다 로그인 체크
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        Alert.alert(
          "로그인 필요",
          "찜한 레시피를 보려면 로그인이 필요합니다.",
          [
            {
              text: "로그인",
              onPress: () => navigation.navigate("Login"),
            },
            {
              text: "취소",
              style: "cancel",
            },
          ]
        );
      }
    }, [user, navigation])
  );

  const favoriteRecipes = recipes.filter((recipe) => recipe.isLiked);

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate("RecipeDetail", { recipe });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>찜한 레시피</Text>
        <Text style={styles.subtitle}>
          {favoriteRecipes.length}개의 레시피를 찜했어요
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favoriteRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="heart-outline" size={48} color="#52616D" />
            </View>
            <Text style={styles.emptyTitle}>찜한 레시피가 없습니다</Text>
            <Text style={styles.emptyText}>
              마음에 드는 레시피의 하트 버튼을 눌러서{"\n"}
              나만의 레시피 컬렉션을 만들어보세요!
            </Text>
          </View>
        ) : (
          <View style={styles.recipeGrid}>
            {favoriteRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onPress={() => handleRecipePress(recipe)}
                onLike={() => toggleLike(Number(recipe.id))}
                hasAllergy={checkAllergy(recipe, pets)}
              />
            ))}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
  recipeGrid: {
    padding: 16,
  },
  bottomSpacer: {
    height: 20,
  },
});
