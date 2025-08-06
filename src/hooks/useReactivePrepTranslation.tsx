import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

interface PrepData {
  id: string;
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  instructions?: string;
  instructions_de?: string;
  instructions_en?: string;
}

interface TranslationOptions {
  translateOnLanguageChange?: boolean;
  sourceLanguage?: 'en' | 'de';
}

export const useReactivePrepTranslation = (
  prep: PrepData,
  options: TranslationOptions = {}
) => {
  const { i18n } = useTranslation();
  const [translatedPrep, setTranslatedPrep] = useState<PrepData>(prep);
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastTranslationLanguage, setLastTranslationLanguage] = useState<string>('');

  const { 
    translateOnLanguageChange = true, 
    sourceLanguage = 'en' 
  } = options;

  const translatePrepContent = useCallback(async (
    targetLanguage: 'en' | 'de'
  ): Promise<PrepData | null> => {
    if (isTranslating) return null;

    try {
      setIsTranslating(true);

      const response = await supabase.functions.invoke('deepseek-translate', {
        body: {
          prep: {
            name: prep.name,
            name_de: prep.name_de,
            name_en: prep.name_en,
            description: prep.description,
            description_de: prep.description_de,
            description_en: prep.description_en,
            instructions: prep.instructions,
            instructions_de: prep.instructions_de,
            instructions_en: prep.instructions_en,
          },
          sourceLang: sourceLanguage,
          targetLang: targetLanguage,
          mode: 'prep'
        }
      });

      if (response.error) {
        console.error('Translation error:', response.error);
        return null;
      }

      if (response.data?.success && response.data?.translation) {
        const translatedData = response.data.translation;
        
        const updatedPrep = {
          ...prep,
          name_de: translatedData.name_de || prep.name_de,
          name_en: translatedData.name_en || prep.name_en,
          description_de: translatedData.description_de || prep.description_de,
          description_en: translatedData.description_en || prep.description_en,
          instructions_de: translatedData.instructions_de || prep.instructions_de,
          instructions_en: translatedData.instructions_en || prep.instructions_en,
        };

        setTranslatedPrep(updatedPrep);
        setLastTranslationLanguage(targetLanguage);
        
        return updatedPrep;
      }

      return null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, [prep, sourceLanguage, isTranslating]);

  const getDisplayText = useCallback((
    field: 'name' | 'description' | 'instructions'
  ): string => {
    const currentLang = i18n.language;
    const deField = `${field}_de` as keyof PrepData;
    const enField = `${field}_en` as keyof PrepData;
    
    if (currentLang === 'de' && translatedPrep[deField]) {
      return translatedPrep[deField] as string;
    }
    if (currentLang === 'en' && translatedPrep[enField]) {
      return translatedPrep[enField] as string;
    }
    return translatedPrep[field] || translatedPrep[deField] || translatedPrep[enField] || '';
  }, [translatedPrep, i18n.language]);

  const hasTranslationForLanguage = useCallback((language: 'en' | 'de'): boolean => {
    const deFields = ['name_de', 'description_de', 'instructions_de'] as const;
    const enFields = ['name_en', 'description_en', 'instructions_en'] as const;
    
    const fields = language === 'de' ? deFields : enFields;
    
    return fields.some(field => 
      translatedPrep[field] && (translatedPrep[field] as string).trim().length > 0
    );
  }, [translatedPrep]);

  // Auto-translate when language changes if content is missing
  useEffect(() => {
    if (!translateOnLanguageChange) return;
    
    const currentLang = i18n.language as 'en' | 'de';
    
    // Skip if we just translated to this language
    if (lastTranslationLanguage === currentLang) return;
    
    // Skip if we already have content in the current language
    if (hasTranslationForLanguage(currentLang)) return;
    
    // Auto-translate if content is missing in the current language
    const timeoutId = setTimeout(() => {
      translatePrepContent(currentLang);
    }, 500); // Small delay to avoid rapid translations

    return () => clearTimeout(timeoutId);
  }, [i18n.language, translateOnLanguageChange, translatePrepContent, hasTranslationForLanguage, lastTranslationLanguage]);

  // Update translated prep when source prep changes
  useEffect(() => {
    setTranslatedPrep(prep);
  }, [prep]);

  return {
    translatedPrep,
    isTranslating,
    translatePrepContent,
    getDisplayText,
    hasTranslationForLanguage,
    currentLanguage: i18n.language
  };
};