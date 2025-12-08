/**
 * Veterinary Nutrition Calculator
 * Based on WSAVA (World Small Animal Veterinary Association) guidelines
 */

export interface PetNutritionNeeds {
  dailyCalories: number; // kcal/day
  waterNeeds: number; // ml/day
  protein: {
    min: number;
    max: number;
  }; // g/day
}

/**
 * Calculate Resting Energy Requirement (RER)
 * Formula: 70 * (weight in kg) ^ 0.75
 */
export const calculateRER = (weightKg: number): number => {
  if (!weightKg || weightKg <= 0) return 0;
  return 70 * Math.pow(weightKg, 0.75);
};

/**
 * Calculate Daily Energy Requirement (DER) based on life stage/activity
 * Factors based on WSAVA guidelines
 */
export const calculateDER = (
  rer: number,
  isNeutered: boolean,
  age: number, // years
  activityLevel: "low" | "moderate" | "high" = "moderate"
): number => {
  let factor = 1.6; // Default: Adult intact

  if (isNeutered) {
    factor = 1.6; // Adult neutered
  } else {
    factor = 1.8; // Adult intact
  }

  // Life stage adjustments
  if (age < 1) factor = 3.0; // Puppy (growth)
  else if (age > 7) factor = 1.4; // Senior

  // Activity adjustments (simplified)
  if (activityLevel === "low") factor -= 0.2;
  if (activityLevel === "high") factor += 0.4;

  return Math.round(rer * factor);
};

/**
 * Get daily recommended nutritional needs
 */
export const getDailyNeeds = (
  weightKg: number,
  isNeutered: boolean,
  age: number
): PetNutritionNeeds => {
  const rer = calculateRER(weightKg);
  const der = calculateDER(rer, isNeutered, age);

  // Protein needs approx 4.5g per 100kcal for adult maintenance (AAFCO)
  const proteinMin = Math.round((der / 100) * 4.5);
  const proteinMax = Math.round((der / 100) * 6.0);

  return {
    dailyCalories: der,
    waterNeeds: Math.round(der), // Roughly 1ml per 1kcal
    protein: {
      min: proteinMin,
      max: proteinMax,
    },
  };
};

