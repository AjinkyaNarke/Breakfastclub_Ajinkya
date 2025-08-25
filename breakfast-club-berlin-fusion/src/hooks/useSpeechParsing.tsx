import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ParsedDish {
  name?: string;
  description?: string;
  ingredients: string[];
  cuisine_type?: string;
  cooking_method?: string;
  dietary_tags: string[];
  estimated_price?: {
    regular: number;
    student: number;
  };
  confidence_score: number;
  raw_text: string;
}

interface SpeechParsingOptions {
  onSuccess?: (parsedDish: ParsedDish) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
  language?: 'en' | 'de';
  context?: 'menu_creation' | 'ingredient_listing' | 'dish_description';
}

export function useSpeechParsing(options: SpeechParsingOptions = {}) {
  const { t } = useTranslation('admin');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParsedDish, setLastParsedDish] = useState<ParsedDish | null>(null);
  const { 
    showToasts = true, 
    language = 'en', 
    context = 'menu_creation' 
  } = options;

  const parseText = useCallback(async (text: string): Promise<ParsedDish> => {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for parsing');
    }

    setIsParsing(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('speech-parsing', {
        body: {
          text: text.trim(),
          language,
          context
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Speech parsing failed');
      }

      if (!data || !data.success || !data.parsed_dish) {
        throw new Error('Invalid response from speech parsing service');
      }

      const parsedDish = data.parsed_dish as ParsedDish;
      setLastParsedDish(parsedDish);

      if (showToasts) {
        toast.success(
          t('speechParsing.success', 'Speech parsed successfully'),
          {
            description: `Found dish: "${parsedDish.name}" with ${parsedDish.ingredients.length} ingredients`
          }
        );
      }

      options.onSuccess?.(parsedDish);
      return parsedDish;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Speech parsing failed';
      setError(errorMessage);

      if (showToasts) {
        toast.error(
          t('speechParsing.error', 'Speech parsing failed'),
          {
            description: errorMessage
          }
        );
      }

      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsParsing(false);
    }
  }, [language, context, showToasts, t, options]);

  const parseVoiceResult = useCallback(async (transcript: string): Promise<ParsedDish> => {
    return parseText(transcript);
  }, [parseText]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearLastParsed = useCallback(() => {
    setLastParsedDish(null);
  }, []);

  return {
    parseText,
    parseVoiceResult,
    isParsing,
    error,
    lastParsedDish,
    clearError,
    clearLastParsed
  };
}

// Hook for getting speech parsing analytics
export function useSpeechParsingAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: rpcError } = await supabase.rpc('get_speech_parsing_analytics', {
        user_id: user.id
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setAnalytics(data?.[0] || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analytics,
    isLoading,
    error,
    loadAnalytics
  };
}

// Hook for getting popular parsed dishes
export function usePopularParsedDishes() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPopularDishes = useCallback(async (limit: number = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: rpcError } = await supabase.rpc('get_popular_parsed_dishes', {
        user_id: user.id,
        limit_count: limit
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setDishes(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load popular dishes';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    dishes,
    isLoading,
    error,
    loadPopularDishes
  };
}

// Helper function to extract form data from parsed dish
export function extractFormDataFromParsedDish(parsedDish: ParsedDish, currentLanguage: 'en' | 'de' = 'en') {
  const formData: any = {
    name: parsedDish.name || '',
    description: parsedDish.description || '',
    cuisine_type: parsedDish.cuisine_type || 'fusion',
    dietary_tags: parsedDish.dietary_tags || [],
    regular_price: parsedDish.estimated_price?.regular || 0,
    student_price: parsedDish.estimated_price?.student || 0,
    is_available: true,
    is_featured: false
  };

  // Set language-specific fields
  if (currentLanguage === 'en') {
    formData.name_en = parsedDish.name;
    formData.description_en = parsedDish.description;
  } else {
    formData.name_de = parsedDish.name;
    formData.description_de = parsedDish.description;
  }

  return formData;
}

// Helper function to validate parsed dish data
export function validateParsedDish(parsedDish: ParsedDish): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!parsedDish.name || parsedDish.name.trim().length === 0) {
    errors.push('Dish name is required');
  }

  if (!parsedDish.ingredients || parsedDish.ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  }

  if (parsedDish.confidence_score < 0.3) {
    errors.push('Confidence score is too low (below 30%)');
  }

  if (parsedDish.estimated_price?.regular && parsedDish.estimated_price.regular < 0) {
    errors.push('Regular price cannot be negative');
  }

  if (parsedDish.estimated_price?.student && parsedDish.estimated_price.student < 0) {
    errors.push('Student price cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export type { ParsedDish, SpeechParsingOptions };