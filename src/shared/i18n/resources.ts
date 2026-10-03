import ascents from '@/locales/en/ascents.json';
import common from '@/locales/en/common.json';
import itineraries from '@/locales/en/itineraries.json';
import account from '@/locales/en/account.json';

export const defaultNS = 'common';

export const fallbackLanguage = 'en';

/** English is the reference language: every other locale must provide the same keys. */
export const resources = {
  en: { common, ascents, itineraries, account },
} as const;

export type SupportedLanguage = keyof typeof resources;
