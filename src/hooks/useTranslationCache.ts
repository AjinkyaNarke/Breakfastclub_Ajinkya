import { useState, useCallback } from 'react';
import { translateText } from '@/integrations/deepseek/translate';

interface TranslationCache {
  [key: string]: string;
}

export function useTranslationCache() {
  const [cache, setCache] = useState<TranslationCache>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Key format: `${text}_${sourceLang}_${targetLang}`
  const getTranslation = useCallback(
    async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
      const key = `${text}_${sourceLang}_${targetLang}`;
      if (cache[key]) {
        return cache[key];
      }
      setLoading(true);
      setError(null);
      try {
        const translated = await translateText({ text, sourceLang, targetLang });
        setCache((prev) => ({ ...prev, [key]: translated }));
        setLoading(false);
        return translated;
      } catch (err: any) {
        setError(err.message || 'Translation failed');
        setLoading(false);
        throw err;
      }
    },
    [cache]
  );

  const updateCache = useCallback((text: string, sourceLang: string, targetLang: string, translation: string) => {
    const key = `${text}_${sourceLang}_${targetLang}`;
    setCache((prev) => ({ ...prev, [key]: translation }));
  }, []);

  return { getTranslation, updateCache, loading, error };
} 