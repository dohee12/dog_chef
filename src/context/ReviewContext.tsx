import { supabase } from "@/lib/supabase";
import React, { createContext, useContext, useState } from "react";
import { Alert } from "react-native";

export interface Review {
  id: number;
  user_id: string;
  recipe_id: number;
  rating: number; // 1~5
  comment: string;
  images?: string[]; // 리뷰 사진들
  created_at: string;
  updated_at: string;
  user_email?: string; // 리뷰 작성자 이메일 (표시용)
}

interface ReviewContextType {
  reviews: Review[];
  loading: boolean;
  loadReviews: (recipeId: number) => Promise<void>;
  addReview: (
    recipeId: number,
    rating: number,
    comment: string,
    images?: string[]
  ) => Promise<void>;
  updateReview: (
    reviewId: number,
    rating: number,
    comment: string,
    images?: string[]
  ) => Promise<void>;
  deleteReview: (reviewId: number) => Promise<void>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 특정 레시피의 리뷰 목록 불러오기
   */
  const loadReviews = async (recipeId: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setReviews(
          data.map((review) => ({
            ...review,
            id: Number(review.id),
            recipe_id: Number(review.recipe_id),
            images: review.images || [],
          }))
        );
      }
    } catch (error) {
      console.error("리뷰 로드 실패:", error);
      Alert.alert("오류", "리뷰를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 리뷰 작성
   */
  const addReview = async (
    recipeId: number,
    rating: number,
    comment: string,
    images: string[] = []
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("로그인 필요", "리뷰를 작성하려면 로그인이 필요합니다.");
        return;
      }

      // 평점 유효성 검사
      if (rating < 1 || rating > 5) {
        Alert.alert("오류", "평점은 1~5점 사이여야 합니다.");
        return;
      }

      // 이미 리뷰를 작성했는지 확인
      const { data: existingReviews } = await supabase
        .from("reviews")
        .select("id")
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id);

      if (existingReviews && existingReviews.length > 0) {
        Alert.alert(
          "알림",
          "이미 이 레시피에 리뷰를 작성하셨습니다. 수정하시겠습니까?",
          [
            { text: "취소", style: "cancel" },
            {
              text: "수정",
              onPress: () =>
                updateReview(
                  Number(existingReviews[0].id),
                  rating,
                  comment,
                  images
                ),
            },
          ]
        );
        return;
      }

      const { error } = await supabase.from("reviews").insert([
        {
          recipe_id: recipeId,
          user_id: user.id,
          rating,
          comment,
          images: images.length > 0 ? images : null,
        },
      ]);

      if (error) throw error;

      Alert.alert("성공", "리뷰가 작성되었습니다.");
      await loadReviews(recipeId);
    } catch (error: any) {
      console.error("리뷰 작성 실패:", error.message);
      Alert.alert("실패", "리뷰 작성에 실패했습니다.");
    }
  };

  /**
   * 리뷰 수정
   */
  const updateReview = async (
    reviewId: number,
    rating: number,
    comment: string,
    images: string[] = []
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("로그인 필요", "리뷰를 수정하려면 로그인이 필요합니다.");
        return;
      }

      // 평점 유효성 검사
      if (rating < 1 || rating > 5) {
        Alert.alert("오류", "평점은 1~5점 사이여야 합니다.");
        return;
      }

      const { error } = await supabase
        .from("reviews")
        .update({
          rating,
          comment,
          images: images.length > 0 ? images : null,
        })
        .eq("id", reviewId)
        .eq("user_id", user.id); // 자신의 리뷰만 수정 가능

      if (error) throw error;

      Alert.alert("성공", "리뷰가 수정되었습니다.");

      // 현재 리뷰 목록에서 recipe_id 찾기
      const review = reviews.find((r) => r.id === reviewId);
      if (review) {
        await loadReviews(review.recipe_id);
      }
    } catch (error: any) {
      console.error("리뷰 수정 실패:", error.message);
      Alert.alert("실패", "리뷰 수정에 실패했습니다.");
    }
  };

  /**
   * 리뷰 삭제
   */
  const deleteReview = async (reviewId: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("로그인 필요", "리뷰를 삭제하려면 로그인이 필요합니다.");
        return;
      }

      Alert.alert("리뷰 삭제", "정말로 이 리뷰를 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("reviews")
              .delete()
              .eq("id", reviewId)
              .eq("user_id", user.id); // 자신의 리뷰만 삭제 가능

            if (error) throw error;

            Alert.alert("성공", "리뷰가 삭제되었습니다.");

            // 현재 리뷰 목록에서 recipe_id 찾기
            const review = reviews.find((r) => r.id === reviewId);
            if (review) {
              await loadReviews(review.recipe_id);
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error("리뷰 삭제 실패:", error.message);
      Alert.alert("실패", "리뷰 삭제에 실패했습니다.");
    }
  };

  const value: ReviewContextType = {
    reviews,
    loading,
    loadReviews,
    addReview,
    updateReview,
    deleteReview,
  };

  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReviews는 ReviewProvider 내에서 사용해야 합니다.");
  }
  return context;
}

