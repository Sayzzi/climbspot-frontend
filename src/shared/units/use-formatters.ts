import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { createFormatters, type Formatters } from './format';

/** Formatters for the current language, in metric units. */
export function useFormatters(): Formatters {
  const { i18n } = useTranslation();
  return useMemo(() => createFormatters('metric', i18n.language), [i18n.language]);
}
