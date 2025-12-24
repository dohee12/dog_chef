export interface Pet {
  id: number | string;
  user_id: string;
  device_id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  is_neutered: boolean;
  image?: string;
  allergies: string[];
  health_conditions: string[];
  birth_date: string;
}
