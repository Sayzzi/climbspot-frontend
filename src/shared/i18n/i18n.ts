import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultNS, fallbackLanguage, resources } from './resources';

void i18n.use(initReactI18next).init({
  lng: fallbackLanguage,
  fallbackLng: fallbackLanguage,
  defaultNS,
  ns: [defaultNS],
  resources,
  interpolation: {
    // React already escapes rendered values.
    escapeValue: false,
  },
});

export { i18n };
