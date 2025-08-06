import { useState } from 'react';
import { translatePrep, translatePrepName } from '@/integrations/deepseek/prepTranslate';
import { toast } from 'sonner';

interface PrepData {
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  instructions?: string;
  instructions_de?: string;
  instructions_en?: string;
  notes?: string;
  batch_yield?: string;
  batch_yield_amount?: number;
  batch_yield_unit?: string;
}

interface TranslatedPrepData {
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  instructions: string;
  instructions_de: string;
  instructions_en: string;
  notes: string;
  batch_yield: string;
  confidence: number;
}

export function usePrepTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  const translateSinglePrep = async (
    prep: PrepData,
    sourceLang: 'en' | 'de' = 'en',
    targetLang?: 'en' | 'de'
  ): Promise<TranslatedPrepData | null> => {
    if (isTranslating) {
      toast.warning('Translation in progress, please wait...');
      return null;
    }

    setIsTranslating(true);
    setTranslationProgress(0);

    try {
      const finalTargetLang = targetLang || (sourceLang === 'en' ? 'de' : 'en');
      
      toast.info(`🔄 Translating prep from ${sourceLang.toUpperCase()} to ${finalTargetLang.toUpperCase()}...`);
      
      setTranslationProgress(50);
      
      const translatedPrep = await translatePrep({
        prep,
        sourceLang,
        targetLang: finalTargetLang
      });

      setTranslationProgress(100);

      const confidencePercentage = Math.round(translatedPrep.confidence * 100);
      
      if (translatedPrep.confidence > 0.7) {
        toast.success(
          `✅ Prep translated successfully! (${confidencePercentage}% confidence)`,
          {
            description: `${prep.name} → ${translatedPrep.name}`
          }
        );
      } else if (translatedPrep.confidence > 0.4) {
        toast.warning(
          `⚠️ Prep translated with medium confidence (${confidencePercentage}%)`,
          {
            description: 'Please review the translation before saving'
          }
        );
      } else {
        toast.error(
          `❌ Translation quality is low (${confidencePercentage}%)`,
          {
            description: 'Consider manual translation or try again'
          }
        );
      }

      return translatedPrep;

    } catch (error) {
      console.error('Prep translation error:', error);
      toast.error('Failed to translate prep', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      return null;
    } finally {
      setIsTranslating(false);
      setTranslationProgress(0);
    }
  };

  const translatePrepNameOnly = async (
    name: string,
    sourceLang: 'en' | 'de' = 'en',
    targetLang?: 'en' | 'de'
  ): Promise<string | null> => {
    if (isTranslating) {
      toast.warning('Translation in progress, please wait...');
      return null;
    }

    setIsTranslating(true);

    try {
      const finalTargetLang = targetLang || (sourceLang === 'en' ? 'de' : 'en');
      
      const result = await translatePrepName({
        name,
        sourceLang,
        targetLang: finalTargetLang
      });

      if (result.confidence > 0.6) {
        toast.success(`✅ Name translated: ${name} → ${result.translatedName}`);
      } else {
        toast.warning(`⚠️ Translation uncertain: ${name} → ${result.translatedName}`);
      }

      return result.translatedName;

    } catch (error) {
      console.error('Prep name translation error:', error);
      toast.error('Failed to translate prep name');
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  const createPrepWithTranslation = async (
    prepData: PrepData,
    sourceLang: 'en' | 'de' = 'en',
    autoTranslate: boolean = true
  ): Promise<any> => {
    try {
      setIsTranslating(true);
      
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prep-crud`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          prep: prepData,
          autoTranslate,
          sourceLang
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create prep');
      }

      const result = await response.json();
      
      if (autoTranslate) {
        toast.success('✅ Prep created and translated successfully!');
      } else {
        toast.success('✅ Prep created successfully!');
      }

      return result;

    } catch (error) {
      console.error('Create prep with translation error:', error);
      toast.error('Failed to create prep');
      throw error;
    } finally {
      setIsTranslating(false);
    }
  };

  const translateExistingPrep = async (
    prepData: PrepData,
    sourceLang: 'en' | 'de' = 'en'
  ): Promise<TranslatedPrepData | null> => {
    try {
      setIsTranslating(true);
      
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prep-crud`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'translate',
          prepData,
          sourceLang
        })
      });

      if (!response.ok) {
        throw new Error('Translation service error');
      }

      const result = await response.json();
      
      if (result.success) {
        const confidencePercentage = Math.round(result.confidence * 100);
        toast.success(`✅ Prep translated! (${confidencePercentage}% confidence)`);
        return result.translation;
      } else {
        throw new Error(result.error || 'Translation failed');
      }

    } catch (error) {
      console.error('Translate existing prep error:', error);
      toast.error('Failed to translate prep');
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    isTranslating,
    translationProgress,
    translateSinglePrep,
    translatePrepNameOnly,
    createPrepWithTranslation,
    translateExistingPrep
  };
}