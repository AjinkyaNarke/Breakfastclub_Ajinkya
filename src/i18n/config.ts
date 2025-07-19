
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: 'de', // Default to German
    defaultNS: 'common',
    ns: ['common', 'homepage', 'admin'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    resources: {
      en: {
        common: require('../../public/locales/en/common.json'),
        homepage: require('../../public/locales/en/homepage.json'),
        admin: require('../../public/locales/en/admin.json'),
      },
      de: {
        common: require('../../public/locales/de/common.json'),
        homepage: require('../../public/locales/de/homepage.json'),
        admin: require('../../public/locales/de/admin.json'),
      },
    },
  });

export default i18n;
