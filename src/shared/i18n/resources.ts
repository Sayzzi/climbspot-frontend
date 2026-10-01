import common from '@/locales/en/common.json';

export const defaultNS = 'common';

export const fallbackLanguage = 'en';

/** English is the reference language: every other locale must provide the same keys. */
export const resources = {
  en: { common },
} as const;

export type SupportedLanguage = keyof typeof resources;
