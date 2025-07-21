
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    lng: 'de', // Force German as the initial language
    fallbackLng: 'de', // Default to German
    defaultNS: 'common',
    ns: ['common', 'homepage', 'admin'],
    
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'], // Check localStorage first for saved preference
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
