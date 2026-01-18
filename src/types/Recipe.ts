export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  calcium: number;
  phosphorus: number;
}

export interface Review {
  id: number | string; // Supabase UUID 지원
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  petInfo?: {
    petName: string;
    breed: string;
    age: string;
  };
}

export interface Recipe {
  id: number | string;
  user_id?: string;
  title: string;
  description: string;
  image: string;
  category: string;
  author: string;
  cook_time: number;
  servings: number;
  rating: number;
  reviews: number;
  safety_score: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  nutrition: NutritionInfo;
  difficulty: string;
  is_user_created: boolean;
  isLiked: boolean;
  review_list: Review[];
  // 새로운 필드들 (Supabase 데이터베이스 스키마와 일치)
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  likes_count?: number;
  reviews_count?: number;
  average_rating?: number;
}
