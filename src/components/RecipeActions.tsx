import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRecipe } from "@/context/RecipeContext";
import { Recipe } from "@/types/Recipe";
import Colors from "@/constants/Colors";
import { useNavigation } from "@react-navigation/native";

interface RecipeActionsProps {
  recipe: Recipe;
}

export function RecipeActions({ recipe }: RecipeActionsProps) {
  const { user } = useAuth();
  const { deleteRecipe } = useRecipe();
  const navigation = useNavigation<any>();

  // 내가 작성한 레시피인지 확인
  const isMyRecipe = user?.id === recipe.user_id;

  if (!isMyRecipe) {
    return null; // 내 레시피가 아니면 버튼 표시 안 함
  }

  const handleEdit = () => {
    navigation.navigate("RecipeForm", { recipe });
  };

  const handleDelete = async () => {
    await deleteRecipe(Number(recipe.id));
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>수정</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>삭제</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

