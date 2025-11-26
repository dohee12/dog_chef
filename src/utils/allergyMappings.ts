import { Recipe } from "@/types/Recipe";
import { Pet } from "@/types/Pet";

export const allergyMappings: Record<string, string[]> = {
  '닭고기': ['닭', '치킨', '닭가슴살', '닭다리', '닭날개', '닭안심'],
  '소고기': ['소', '비프', '등심', '안심', '갈비', '우육'],
  '돼지고기': ['돼지', '포크', '삼겹살', '목살', '등갈비'],
  '계란': ['달걀', '에그', '계란'],
  '우유': ['밀크', '유제품', '치즈', '버터', '요구르트'],
  '밀': ['밀가루', '글루텐', '빵', '면'],
  '견과류': ['땅콩', '아몬드', '호두', '피스타치오', '캐슈넛']
};

export const checkAllergy = (recipe: Recipe, pets: Pet[]) => {
  if (!pets || pets.length === 0) return false;
  
  const allAllergies = pets.flatMap(pet => pet.allergies || []);
  if (allAllergies.length === 0) return false;

  return recipe.ingredients.some(ingredient => {
    return allAllergies.some(allergy => {
       const relatedTerms = allergyMappings[allergy] || [allergy];
       return relatedTerms.some(term => ingredient.includes(term));
    });
  });
};

export const getAllergicIngredients = (recipe: Recipe, pets: Pet[]) => {
    const allergicIngredients: string[] = [];
    const affectedPets: string[] = [];

    if (!pets) return { allergicIngredients, affectedPets };

    pets.forEach(pet => {
        const petAllergies = pet.allergies || [];
        const found = recipe.ingredients.filter(ingredient => {
            return petAllergies.some(allergy => {
                const relatedTerms = allergyMappings[allergy] || [allergy];
                return relatedTerms.some(term => ingredient.includes(term));
            });
        });

        if (found.length > 0) {
            allergicIngredients.push(...found);
            if (!affectedPets.includes(pet.name)) {
                affectedPets.push(pet.name);
            }
        }
    });

    return {
        allergicIngredients: [...new Set(allergicIngredients)], // Unique
        affectedPets
    };
};
