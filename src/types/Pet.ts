export interface Pet {
  id: number;
  name: string;
  breed: string;
  age: number;
  weight: number;
  allergies: string[];
  healthConditions: string[];
  profileImage?: string;
  birthDate: string;
  gender: 'male' | 'female';
  isNeutered: boolean;
}
