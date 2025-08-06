import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { translateIngredient, translateIngredientBatch, translateIngredientName } from '@/integrations/deepseek/ingredientTranslate';

interface IngredientData {
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  dietary_properties?: string[];
  allergens?: string[];
  category?: string;
  supplier_info?: string;
  notes?: string;
}

interface TranslatedIngredientData {
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  dietary_properties: string[];
  allergens: string[];
  category: string;
  supplier_info: string;
  notes: string;
  confidence: number;
}

export function useIngredientTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const translate = async (
    ingredient: IngredientData,
    sourceLang: 'en' | 'de',
    targetLang: 'en' | 'de'
  ): Promise<TranslatedIngredientData | null> => {
    if (sourceLang === targetLang) {
      toast({
        title: 'Translation Error',
        description: 'Source and target languages cannot be the same',
        variant: 'destructive'
      });
      return null;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translateIngredient({
        ingredient,
        sourceLang,
        targetLang
      });

      toast({
        title: 'Translation Successful',
        description: `Ingredient translated from ${sourceLang} to ${targetLang} (${Math.round(result.confidence * 100)}% confidence)`,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      
      toast({
        title: 'Translation Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  const translateToGerman = async (ingredient: IngredientData): Promise<TranslatedIngredientData | null> => {
    return translate(ingredient, 'en', 'de');
  };

  const translateToEnglish = async (ingredient: IngredientData): Promise<TranslatedIngredientData | null> => {
    return translate(ingredient, 'de', 'en');
  };

  const translateBatch = async (
    ingredients: IngredientData[],
    sourceLang: 'en' | 'de',
    targetLang: 'en' | 'de',
    onProgress?: (completed: number, total: number) => void
  ): Promise<TranslatedIngredientData[]> => {
    if (sourceLang === targetLang) {
      toast({
        title: 'Translation Error',
        description: 'Source and target languages cannot be the same',
        variant: 'destructive'
      });
      return [];
    }

    setIsTranslating(true);
    setError(null);

    try {
      const results = await translateIngredientBatch({
        ingredients,
        sourceLang,
        targetLang,
        onProgress
      });

      const successCount = results.filter(r => r.confidence > 0.5).length;
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

      toast({
        title: 'Batch Translation Complete',
        description: `${successCount}/${results.length} ingredients translated successfully (${Math.round(avgConfidence * 100)}% avg confidence)`,
      });

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch translation failed';
      setError(errorMessage);
      
      toast({
        title: 'Batch Translation Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      return [];
    } finally {
      setIsTranslating(false);
    }
  };

  const translateName = async (
    name: string,
    sourceLang: 'en' | 'de',
    targetLang: 'en' | 'de'
  ): Promise<{ translatedName: string; confidence: number } | null> => {
    if (sourceLang === targetLang || !name.trim()) {
      return null;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translateIngredientName({
        name: name.trim(),
        sourceLang,
        targetLang
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Name translation failed';
      setError(errorMessage);
      
      // Don't show toast for individual name translation failures (too noisy)
      console.error('Name translation error:', errorMessage);
      
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  const clearError = () => setError(null);

  return {
    translate,
    translateToGerman,
    translateToEnglish,
    translateBatch,
    translateName,
    isTranslating,
    error,
    clearError
  };
}