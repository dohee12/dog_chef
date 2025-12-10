import { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { mockRecipes } from '../utils/mockData';

export const usePopularRecipes = () => {
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPopular = async () => {
        setLoading(true);
        // Simulate fetch
        await new Promise(resolve => setTimeout(resolve, 500));
        const sorted = [...mockRecipes].sort((a, b) => b.rating - a.rating).slice(0, 5);
        setPopularRecipes(sorted);
        setLoading(false);
    };
    fetchPopular();
  }, []);

  return { popularRecipes, loading };
};

