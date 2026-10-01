import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { createFormatters, type Formatters } from './format';
import { useUnits } from './use-units';

/** Formatters for the current language and the Visitor's unit system. */
export function useFormatters(): Formatters {
  const { i18n } = useTranslation();
  const { system } = useUnits();
  return useMemo(() => createFormatters(system, i18n.language), [system, i18n.language]);
}
