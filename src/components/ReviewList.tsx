import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Review, useReviews } from "@/context/ReviewContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";

interface ReviewListProps {
  recipeId: number;
}

const REVIEW_COMMENT_TTL = 24 * 60 * 60 * 1000;

export function ReviewList({ recipeId }: ReviewListProps) {
  const { reviews, loading, loadReviews, deleteReview } = useReviews();
  const { user } = useAuth();

  React.useEffect(() => {
    loadReviews(recipeId);
  }, [recipeId]);

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color={star <= rating ? Colors.primary : Colors.textSecondary}
          />
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: Review }) => {
    const isMyReview = user?.id === item.user_id;
    const isExpired = Date.now() - new Date(item.created_at).getTime() > REVIEW_COMMENT_TTL;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewAuthor}>
              {item.user_email || "익명"}
            </Text>
            {renderStars(item.rating)}
          </View>
          {isMyReview && (
            <TouchableOpacity
              onPress={() => deleteReview(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.reviewComment}>
          {isExpired ? "24시간이 지나 댓글이 숨김 처리되었습니다." : item.comment}
        </Text>

        <Text style={styles.reviewDate}>
          {new Date(item.created_at).toLocaleDateString("ko-KR")}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>리뷰 로딩 중...</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="chatbubble-outline"
          size={48}
          color={Colors.textSecondary}
        />
        <Text style={styles.emptyText}>아직 리뷰가 없습니다</Text>
        <Text style={styles.emptySubText}>첫 번째 리뷰를 작성해보세요!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>리뷰 ({reviews.length})</Text>
      </View>
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  listContainer: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  emptySubText: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

