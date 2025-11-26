import Colors from "@/constants/Colors";
import { useRecipe } from "@/context/RecipeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecipeFormScreen({ navigation }: any) {
  const { addRecipe } = useRecipe();
  const [tagInput, setTagInput] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");
  const [instructionInput, setInstructionInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    category: "주식",
    cookTime: "",
    servings: "",
    difficulty: "보통",
    author: "",
    tags: [] as string[],
    ingredients: [] as string[],
    instructions: [] as string[],
  });

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, ingredientInput.trim()],
      });
      setIngredientInput("");
    }
  };

  const handleAddInstruction = () => {
    if (instructionInput.trim()) {
      setFormData({
        ...formData,
        instructions: [...formData.instructions, instructionInput.trim()],
      });
      setInstructionInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleRemoveInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert("오류", "레시피 제목을 입력해주세요.");
      return;
    }
    if (formData.ingredients.length === 0) {
      Alert.alert("오류", "최소 하나 이상의 재료를 입력해주세요.");
      return;
    }
    if (formData.instructions.length === 0) {
      Alert.alert("오류", "최소 하나 이상의 조리 과정을 입력해주세요.");
      return;
    }

    addRecipe({
      ...formData,
      cookTime: parseInt(formData.cookTime) || 0,
      servings: parseInt(formData.servings) || 1,
      author: formData.author || "익명",
      image:
        formData.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", // Fallback image
      reviews: 0,
      rating: 0,
      reviewList: [],
      nutrition: {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        calcium: 0,
        phosphorus: 0,
      },
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>레시피 등록</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView style={styles.content}>
          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>레시피 제목 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 닭가슴살 야채죽"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>설명</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="레시피에 대한 간단한 설명을 입력하세요"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Image */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>이미지 URL</Text>
            <TextInput
              style={styles.input}
              placeholder="Unsplash 이미지 URL (비워두면 기본값)"
              value={formData.image}
              onChangeText={(text) => setFormData({ ...formData, image: text })}
            />
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>카테고리 *</Text>
            <View style={styles.radioGroup}>
              {["주식", "간식", "건강식", "특별식"].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.radioButton,
                    formData.category === cat && styles.radioButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text
                    style={[
                      styles.radioButtonText,
                      formData.category === cat && styles.radioButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time & Servings */}
          <View style={styles.rowFormGroup}>
            <View style={styles.smallFormGroup}>
              <Text style={styles.label}>조리시간</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                value={formData.cookTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, cookTime: text })
                }
                keyboardType="numeric"
              />
              <Text style={styles.unit}>분</Text>
            </View>

            <View style={styles.smallFormGroup}>
              <Text style={styles.label}>분량</Text>
              <TextInput
                style={styles.input}
                placeholder="2"
                value={formData.servings}
                onChangeText={(text) =>
                  setFormData({ ...formData, servings: text })
                }
                keyboardType="numeric"
              />
              <Text style={styles.unit}>회분</Text>
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>난이도</Text>
            <View style={styles.radioGroup}>
              {["쉬움", "보통", "어려움"].map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.radioButton,
                    formData.difficulty === diff && styles.radioButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, difficulty: diff })}
                >
                  <Text
                    style={[
                      styles.radioButtonText,
                      formData.difficulty === diff &&
                        styles.radioButtonTextActive,
                    ]}
                  >
                    {diff}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Author */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>작성자</Text>
            <TextInput
              style={styles.input}
              placeholder="익명"
              value={formData.author}
              onChangeText={(text) =>
                setFormData({ ...formData, author: text })
              }
            />
          </View>

          {/* Tags */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>태그</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="태그 입력"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddTag}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagContainer}>
              {formData.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(index)}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>재료</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="예: 닭가슴살 100g"
                value={ingredientInput}
                onChangeText={setIngredientInput}
                onSubmitEditing={handleAddIngredient}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddIngredient}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
            {formData.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listItemText}>{ingredient}</Text>
                <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>조리방법</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.tagInput, styles.textarea]}
                placeholder="단계별 조리 방법 입력"
                value={instructionInput}
                onChangeText={setInstructionInput}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddInstruction}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
            {formData.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveInstruction(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.submitButtonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>레시피 등록</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: "transparent",
  },
  radioButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  radioButtonText: {
    color: Colors.textLight,
  },
  radioButtonTextActive: {
    color: Colors.primaryDark,
    fontWeight: "bold",
  },
  rowFormGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  smallFormGroup: {
    flex: 1,
    position: "relative",
  },
  unit: {
    position: "absolute",
    right: 12,
    top: 38,
    color: Colors.textLight,
  },
  tagInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: {
    marginRight: 4,
    color: Colors.text,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  instructionNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: "bold",
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginRight: 8,
  },
  bottomSpacer: {
    height: 40,
  },
  submitButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "white",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
