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
  id: number;
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
  id: number;
  title: string;
  description: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: string;
  rating: number;
  reviews: number;
  author: string;
  category: string;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  isLiked?: boolean;
  nutrition?: NutritionInfo;
  reviewList?: Review[];
  isUserCreated?: boolean;
  createdDate?: string;
  safetyScore?: number;
  rankingPosition?: number;
}
