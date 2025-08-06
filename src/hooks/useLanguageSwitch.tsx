import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface UseLanguageSwitchOptions {
  onLanguageChange?: (newLanguage: string, previousLanguage: string) => void;
  showToasts?: boolean;
}

export const useLanguageSwitch = (options: UseLanguageSwitchOptions = {}) => {
  const { i18n } = useTranslation();
  const { onLanguageChange, showToasts = true } = options;

  const switchLanguage = useCallback((newLanguage: 'en' | 'de') => {
    const previousLanguage = i18n.language;
    
    if (previousLanguage === newLanguage) {
      return;
    }

    // Change the language
    i18n.changeLanguage(newLanguage);

    // Show notification if enabled
    if (showToasts) {
      const languageNames = {
        'en': 'English',
        'de': 'Deutsch'
      };
      
      toast.success(`Language switched to ${languageNames[newLanguage]}`, {
        description: 'Content will be translated automatically when available',
        duration: 2000
      });
    }

    // Trigger callback if provided
    if (onLanguageChange) {
      onLanguageChange(newLanguage, previousLanguage);
    }
  }, [i18n, onLanguageChange, showToasts]);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      // This will be called whenever the language changes
      // Can be used to trigger additional logic if needed
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    switchLanguage,
    isGerman: i18n.language === 'de',
    isEnglish: i18n.language === 'en'
  };
};