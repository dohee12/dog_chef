import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useReviews } from "@/context/ReviewContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";

interface ReviewFormProps {
  recipeId: number;
  visible: boolean;
  onClose: () => void;
}

export function ReviewForm({ recipeId, visible, onClose }: ReviewFormProps) {
  const { addReview } = useReviews();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    await addReview(recipeId, rating, comment);
    setRating(5);
    setComment("");
    onClose();
  };

  const renderStarButton = (starNumber: number) => {
    const isSelected = starNumber <= rating;

    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => setRating(starNumber)}
        style={styles.starButton}
      >
        <Ionicons
          name={isSelected ? "star" : "star-outline"}
          size={32}
          color={isSelected ? Colors.primary : Colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>리뷰 작성</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* 평점 선택 */}
            <View style={styles.section}>
              <Text style={styles.label}>평점</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => renderStarButton(star))}
              </View>
              <Text style={styles.ratingText}>{rating}점</Text>
            </View>

            {/* 리뷰 내용 */}
            <View style={styles.section}>
              <Text style={styles.label}>리뷰 내용</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                value={comment}
                onChangeText={setComment}
                placeholder="이 레시피에 대한 의견을 남겨주세요..."
                placeholderTextColor={Colors.textSecondary}
                textAlignVertical="top"
              />
            </View>

            {/* 작성 버튼 */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !comment.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!comment.trim()}
            >
              <Text style={styles.submitButtonText}>리뷰 작성</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
  },
  textArea: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

