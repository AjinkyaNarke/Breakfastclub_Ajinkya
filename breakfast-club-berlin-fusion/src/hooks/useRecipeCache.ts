import { useCallback } from 'react';

export interface CachedRecipe {
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  ingredients: any[]; // Array of ingredient objects or strings
  category_id: string;
  regular_price: number;
  student_price: number;
}

const RECIPE_CACHE_KEY = 'bc_cached_recipe';

export function useRecipeCache() {
  // Save a recipe to local storage
  const saveRecipe = useCallback((recipe: CachedRecipe) => {
    localStorage.setItem(RECIPE_CACHE_KEY, JSON.stringify(recipe));
  }, []);

  // Retrieve the cached recipe from local storage
  const getRecipe = useCallback((): CachedRecipe | null => {
    const data = localStorage.getItem(RECIPE_CACHE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as CachedRecipe;
    } catch {
      return null;
    }
  }, []);

  // Clear the cached recipe
  const clearRecipe = useCallback(() => {
    localStorage.removeItem(RECIPE_CACHE_KEY);
  }, []);

  return { saveRecipe, getRecipe, clearRecipe };
} 