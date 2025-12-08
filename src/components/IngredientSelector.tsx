import Colors from "@/constants/Colors";
import { useRecipe } from "@/context/RecipeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedIngredients: string[];
  onToggle: (ingredient: string) => void;
  title?: string;
  subtitle?: string;
}

export default function IngredientSelector({
  visible,
  onClose,
  selectedIngredients,
  onToggle,
  title = "재료 필터",
  subtitle = "원하는 재료를 선택하세요",
}: Props) {
  const { ingredients, addIngredient } = useRecipe();
  const [customInput, setCustomInput] = useState("");

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    // 1. Add to global list if not exists
    addIngredient(trimmed);

    // 2. Select it if not already selected
    if (!selectedIngredients.includes(trimmed)) {
      onToggle(trimmed);
    }

    setCustomInput("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.sheetSubtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Custom Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="목록에 없는 재료 직접 입력"
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={handleAddCustom}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCustom}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.ingredientContainer}>
              {ingredients.map((ingredient, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.ingredientTag,
                    selectedIngredients.includes(ingredient) &&
                      styles.ingredientTagActive,
                  ]}
                  onPress={() => onToggle(ingredient)}
                >
                  <Text
                    style={[
                      styles.ingredientTagText,
                      selectedIngredients.includes(ingredient) &&
                        styles.ingredientTagTextActive,
                    ]}
                  >
                    {ingredient}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeSheetButton} onPress={onClose}>
            <Text style={styles.closeSheetButtonText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "130%",
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: Colors.textDark,
  },
  sheetSubtitle: {
    color: Colors.textLight,
    fontSize: 14,
  },
  scrollContent: {
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 20,
  },
  ingredientContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 0,
  },
  ingredientTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  ingredientTagActive: {
    backgroundColor: "#fff7ed",
    borderColor: Colors.primary,
  },
  ingredientTagText: {
    fontSize: 14,
    color: Colors.text,
  },
  ingredientTagTextActive: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  closeSheetButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeSheetButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
