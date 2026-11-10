import { ApiError, api, getCurrentUser, toRemoteImages } from "@/lib/api";
import { confirmAsync, notify } from "@/lib/dialog";
import React, { createContext, useContext, useState } from "react";

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

const isValidRating = (rating: number) => rating >= 1 && rating <= 5;

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReviews = async (recipeId: number) => {
    setLoading(true);
    try {
      setReviews(await api.get<Review[]>(`/recipes/${recipeId}/reviews`));
    } catch (error) {
      console.error("리뷰 로드 실패:", error);
      notify("오류", "리뷰를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (
    recipeId: number,
    rating: number,
    comment: string,
    images: string[] = []
  ) => {
    if (!getCurrentUser()) {
      notify("로그인 필요", "리뷰를 작성하려면 로그인이 필요합니다.");
      return;
    }
    if (!isValidRating(rating)) {
      notify("오류", "평점은 1~5점 사이여야 합니다.");
      return;
    }
    try {
      images = await toRemoteImages(images);
      await api.post(`/recipes/${recipeId}/reviews`, { rating, comment, images });
      notify("성공", "리뷰가 작성되었습니다.");
      await loadReviews(recipeId);
    } catch (error) {
      // 이미 쓴 리뷰가 있으면 서버가 409 와 기존 리뷰 id 를 준다
      if (error instanceof ApiError && error.status === 409 && error.body?.review_id) {
        const ok = await confirmAsync(
          "알림",
          "이미 이 레시피에 리뷰를 작성하셨습니다. 수정하시겠습니까?",
          "수정"
        );
        if (ok) await updateReview(error.body.review_id, rating, comment, images, recipeId);
        return;
      }
      console.error("리뷰 작성 실패:", error);
      notify("실패", `리뷰 작성에 실패했습니다.${error instanceof ApiError ? `\n${error.message}` : ""}`);
    }
  };

  const updateReview = async (
    reviewId: number,
    rating: number,
    comment: string,
    images: string[] = [],
    recipeId?: number
  ) => {
    if (!getCurrentUser()) {
      notify("로그인 필요", "리뷰를 수정하려면 로그인이 필요합니다.");
      return;
    }
    if (!isValidRating(rating)) {
      notify("오류", "평점은 1~5점 사이여야 합니다.");
      return;
    }
    try {
      const saved = await api.patch<Review>(`/reviews/${reviewId}`, {
        rating,
        comment,
        images: await toRemoteImages(images),
      });
      notify("성공", "리뷰가 수정되었습니다.");
      await loadReviews(recipeId ?? saved.recipe_id);
    } catch (error) {
      console.error("리뷰 수정 실패:", error);
      notify("실패", `리뷰 수정에 실패했습니다.${error instanceof ApiError ? `\n${error.message}` : ""}`);
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!getCurrentUser()) {
      notify("로그인 필요", "리뷰를 삭제하려면 로그인이 필요합니다.");
      return;
    }
    const ok = await confirmAsync(
      "리뷰 삭제",
      "정말로 이 리뷰를 삭제하시겠습니까?",
      "삭제",
      true
    );
    if (!ok) return;
    try {
      const { recipe_id } = await api.delete<{ recipe_id: number }>(`/reviews/${reviewId}`);
      notify("성공", "리뷰가 삭제되었습니다.");
      await loadReviews(recipe_id);
    } catch (error) {
      console.error("리뷰 삭제 실패:", error);
      notify("실패", "리뷰 삭제에 실패했습니다.");
    }
  };

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        loading,
        loadReviews,
        addReview,
        updateReview: (id, rating, comment, images) =>
          updateReview(id, rating, comment, images),
        deleteReview,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReviews는 ReviewProvider 내에서 사용해야 합니다.");
  }
  return context;
}
