import { useState, useCallback } from 'react';
import { translateRecipe, translateBatchRecipes } from '../integrations/deepseek/recipeTranslate';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface RecipeData {
  name?: string;
  description?: string;
  ingredients?: string[];
  dietary_tags?: string[];
  category?: string;
}

interface TranslatedRecipeData {
  name_en?: string;
  name_de?: string;
  description_en?: string;
  description_de?: string;
  ingredients_en?: string[];
  ingredients_de?: string[];
  dietary_tags_en?: string[];
  dietary_tags_de?: string[];
}

interface UseRecipeTranslationOptions {
  onSuccess?: (translation: TranslatedRecipeData) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
}

export function useRecipeTranslation(options: UseRecipeTranslationOptions = {}) {
  const { t } = useTranslation('admin');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToasts = true } = options;

  const translate = useCallback(async (
    recipe: RecipeData,
    sourceLang: 'en' | 'de',
    targetLang: 'en' | 'de'
  ): Promise<TranslatedRecipeData> => {
    if (sourceLang === targetLang) {
      throw new Error('Source and target languages must be different');
    }

    setIsTranslating(true);
    setError(null);

    try {
      const translation = await translateRecipe({
        recipe,
        sourceLang,
        targetLang
      });

      if (showToasts) {
        toast.success(t('translation.recipeSuccess', 'Recipe translated successfully'));
      }
      
      options.onSuccess?.(translation);
      return translation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Recipe translation failed';
      setError(errorMessage);
      
      if (showToasts) {
        toast.error(t('translation.recipeError', `Recipe translation failed: ${errorMessage}`));
      }
      
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsTranslating(false);
    }
  }, [options, showToasts, t]);

  const translateToGerman = useCallback((recipe: RecipeData) => {
    return translate(recipe, 'en', 'de');
  }, [translate]);

  const translateToEnglish = useCallback((recipe: RecipeData) => {
    return translate(recipe, 'de', 'en');
  }, [translate]);

  const translateBatch = useCallback(async (
    recipes: RecipeData[],
    sourceLang: 'en' | 'de',
    targetLang: 'en' | 'de'
  ): Promise<TranslatedRecipeData[]> => {
    if (recipes.length === 0) {
      return [];
    }

    setIsTranslating(true);
    setError(null);

    try {
      const translations = await translateBatchRecipes({
        recipes,
        sourceLang,
        targetLang
      });

      if (showToasts) {
        toast.success(t('translation.batchSuccess', `${translations.length} recipes translated successfully`));
      }

      return translations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch translation failed';
      setError(errorMessage);
      
      if (showToasts) {
        toast.error(t('translation.batchError', `Batch translation failed: ${errorMessage}`));
      }
      
      throw err;
    } finally {
      setIsTranslating(false);
    }
  }, [showToasts, t]);

  const translateRecipeToAllLanguages = useCallback(async (
    recipe: RecipeData,
    sourceLang: 'en' | 'de'
  ): Promise<TranslatedRecipeData> => {
    const targetLang = sourceLang === 'en' ? 'de' : 'en';
    return translate(recipe, sourceLang, targetLang);
  }, [translate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    translate,
    translateToGerman,
    translateToEnglish,
    translateBatch,
    translateRecipeToAllLanguages,
    isTranslating,
    error,
    clearError
  };
}

// Helper function to merge original recipe with translations
export function mergeRecipeWithTranslations(
  originalRecipe: RecipeData,
  translations: TranslatedRecipeData,
  originalLang: 'en' | 'de'
): RecipeData & TranslatedRecipeData {
  const merged: RecipeData & TranslatedRecipeData = {
    ...originalRecipe,
    ...translations
  };

  // Set the original language fields
  if (originalLang === 'en') {
    merged.name_en = originalRecipe.name;
    merged.description_en = originalRecipe.description;
    merged.ingredients_en = originalRecipe.ingredients;
    merged.dietary_tags_en = originalRecipe.dietary_tags;
  } else {
    merged.name_de = originalRecipe.name;
    merged.description_de = originalRecipe.description;
    merged.ingredients_de = originalRecipe.ingredients;
    merged.dietary_tags_de = originalRecipe.dietary_tags;
  }

  return merged;
}

// Helper function to extract recipe data from form values
export function extractRecipeFromForm(formData: any): RecipeData {
  return {
    name: formData.name || formData.name_en || formData.name_de,
    description: formData.description || formData.description_en || formData.description_de,
    ingredients: formData.ingredients || formData.ingredients_en || formData.ingredients_de || [],
    dietary_tags: formData.dietary_tags || formData.dietary_tags_en || formData.dietary_tags_de || [],
    category: formData.category
  };
}