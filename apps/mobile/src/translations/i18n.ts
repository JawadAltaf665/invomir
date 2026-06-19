import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from '@/src/translations/en';

// i18next exposes the plugin API on the default instance.
// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
