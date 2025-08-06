import { useState, useCallback } from 'react';
import { translateText } from '../integrations/deepseek/translate';

interface UseAutoTranslateOptions {
  onSuccess?: (translation: string) => void;
  onError?: (error: string) => void;
}

export function useAutoTranslate(options: UseAutoTranslateOptions = {}) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (
    text: string,
    sourceLang: 'en' | 'de',
    targetLang: 'en' | 'de'
  ) => {
    if (!text.trim()) {
      return '';
    }

    setIsTranslating(true);
    setError(null);

    try {
      const translation = await translateText({
        text: text.trim(),
        sourceLang,
        targetLang
      });

      options.onSuccess?.(translation);
      return translation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsTranslating(false);
    }
  }, [options]);

  const translateToGerman = useCallback((text: string) => {
    return translate(text, 'en', 'de');
  }, [translate]);

  const translateToEnglish = useCallback((text: string) => {
    return translate(text, 'de', 'en');
  }, [translate]);

  return {
    translate,
    translateToGerman,
    translateToEnglish,
    isTranslating,
    error,
    clearError: () => setError(null)
  };
}