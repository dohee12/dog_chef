import Colors from "@/constants/Colors";
import { Pet } from "@/types/Pet";
import { Review } from "@/types/Recipe";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  reviews: Review[];
  onAddReview: (review: Omit<Review, "id">) => void;
  userPets: Pet[];
  recipeId: number;
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  summaryCard: {
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    marginBottom: 20,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.textLight,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  formCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 8,
    marginTop: 12,
  },
  ratingInput: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  picker: {
    backgroundColor: Colors.lightBackground,
    marginBottom: 12,
  },
  reviewInput: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  formButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: Colors.lightBackground,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.text,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 16,
  },
  reviewCard: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  reviewUserName: {
    fontWeight: "bold",
    marginRight: 8,
    color: Colors.textDark,
  },
  petBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  petBadgeText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: "bold",
  },
  reviewMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewStars: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  petInfoCard: {
    marginTop: 8,
    backgroundColor: Colors.lightBackground,
    padding: 8,
    borderRadius: 8,
  },
  petInfoText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  petInfoName: {
    fontWeight: "bold",
    color: Colors.textDark,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
});

export default function ReviewSystem({
  reviews,
  onAddReview,
  userPets,
  recipeId,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    selectedPet: "",
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const handleSubmit = () => {
    if (!newReview.comment.trim()) return;

    const selectedPetInfo = userPets.find(
      (p) => p.id.toString() === newReview.selectedPet
    );

    onAddReview({
      userId: "user_1", // Mock user ID
      userName: "나", // Mock user name
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString(),
      petInfo: selectedPetInfo
        ? {
            petName: selectedPetInfo.name,
            breed: selectedPetInfo.breed,
            age: `${selectedPetInfo.age}살`,
          }
        : undefined,
    });

    setNewReview({ rating: 5, comment: "", selectedPet: "" });
    setShowForm(false);
  };

  return (
    <View style={styles.container}>
      {/* 평점 요약 */}
      <View style={styles.summaryCard}>
        <View style={styles.starRow}>
          {[...Array(5)].map((_, i) => (
            <Ionicons
              key={i}
              name={
                i < Math.floor(averageRating + 0.5) ? "star" : "star-outline"
              }
              size={24}
              color="#eab308"
            />
          ))}
        </View>
        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
        <Text style={styles.reviewCount}>{reviews.length}개의 리뷰</Text>
      </View>

      {/* 리뷰 작성 버튼 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.addButtonText}>
          {showForm ? "리뷰 취소" : "리뷰 작성하기"}
        </Text>
      </TouchableOpacity>

      {/* 리뷰 작성 폼 */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>평점</Text>
          <View style={styles.ratingInput}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setNewReview({ ...newReview, rating: star })}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name={star <= newReview.rating ? "star" : "star-outline"}
                  size={32}
                  color="#eab308"
                />
              </TouchableOpacity>
            ))}
          </View>

          {userPets.length > 0 && (
            <>
              <Text style={styles.formLabel}>어떤 반려견이 드셨나요?</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: Colors.borderLight,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Picker
                  selectedValue={newReview.selectedPet}
                  onValueChange={(value) =>
                    setNewReview({ ...newReview, selectedPet: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="선택안함" value="" />
                  {userPets.map((pet) => (
                    <Picker.Item
                      key={pet.id}
                      label={`${pet.name} (${pet.breed}, ${pet.age}살)`}
                      value={pet.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.formLabel}>리뷰</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="레시피에 대한 솔직한 후기를 남겨주세요"
            value={newReview.comment}
            onChangeText={(text) =>
              setNewReview({ ...newReview, comment: text })
            }
            multiline
            numberOfLines={4}
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => setShowForm(false)}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>리뷰 등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 리뷰 목록 */}
      <Text style={styles.listTitle}>리뷰 ({reviews.length})</Text>

      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>아직 리뷰가 없습니다.</Text>
          <Text style={styles.emptySubtext}>첫 번째 리뷰를 작성해보세요!</Text>
        </View>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={16} color="#9ca3af" />
              </View>
              <View style={styles.reviewInfo}>
                <View style={styles.reviewNameRow}>
                  <Text style={styles.reviewUserName}>{review.userName}</Text>
                  {review.petInfo && (
                    <View style={styles.petBadge}>
                      <Text style={styles.petBadgeText}>
                        {review.petInfo.petName}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.reviewMetaRow}>
                  <View style={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? "star" : "star-outline"}
                        size={12}
                        color="#eab308"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.date).toLocaleDateString("ko-KR")}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.reviewComment}>{review.comment}</Text>

            {review.petInfo && (
              <View style={styles.petInfoCard}>
                <Text style={styles.petInfoText}>
                  <Text style={styles.petInfoName}>
                    {review.petInfo.petName}
                  </Text>
                  ({review.petInfo.breed}, {review.petInfo.age})이(가) 맛있게
                  드셨어요!
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}
