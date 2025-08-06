import { useTranslation } from 'react-i18next';

export interface LocalizedContent {
  text: string;
  text_de?: string;
  text_en?: string;
}

export interface LocalizedPrep {
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

export const useLocalization = () => {
  const { i18n } = useTranslation();

  const getLocalizedText = (content: LocalizedContent): string => {
    const currentLang = i18n.language;
    if (currentLang === 'de' && content.text_de) return content.text_de;
    if (currentLang === 'en' && content.text_en) return content.text_en;
    return content.text || content.text_de || content.text_en || '';
  };

  const getLocalizedPrepText = (
    prep: LocalizedPrep,
    field: 'name' | 'description' | 'instructions'
  ): string => {
    const currentLang = i18n.language;
    const deField = `${field}_de` as keyof LocalizedPrep;
    const enField = `${field}_en` as keyof LocalizedPrep;
    
    if (currentLang === 'de' && prep[deField]) return prep[deField] as string;
    if (currentLang === 'en' && prep[enField]) return prep[enField] as string;
    return prep[field] || prep[deField] || prep[enField] || '';
  };

  return {
    currentLanguage: i18n.language,
    getLocalizedText,
    getLocalizedPrepText
  };
};