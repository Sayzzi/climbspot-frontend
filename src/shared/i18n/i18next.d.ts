import 'i18next';

import type { defaultNS, resources } from './resources';

// Makes `t('…')` type-safe: unknown keys are compile errors.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
