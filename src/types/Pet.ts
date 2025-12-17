export interface Pet {
  id: number | string; // Supabase UUID 지원
  name: string;
  breed: string;
  age: number;
  weight: number;
  allergies: string[];
  healthConditions: string[];
  image?: string;
  birthDate: string;
  gender: 'male' | 'female';
  isNeutered: boolean;
}
