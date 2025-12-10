import { Recipe } from '../types';

export const calculateNutrition = (ingredients: string[]) => {
  // Mock calculation logic
  // In a real app, this would parse ingredients and look up a database
  return {
    calories: ingredients.length * 50,
    protein: ingredients.length * 5,
    fat: ingredients.length * 2,
    carbs: ingredients.length * 8,
  };
};

export const calculateDailyNeeds = (weight: number, age: number) => {
    // Basic RER calculation
    const rer = 70 * Math.pow(weight, 0.75);
    return Math.round(rer * 1.6); // Maintenance for neutered adult
};

