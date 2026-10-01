import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Activity, Category, Surface } from '../types';

/** Translated names of the domain values (Surface, Activity, Category). */
export function useAscentLabels() {
  const { t, i18n } = useTranslation('ascents');
  const list = useMemo(() => new Intl.ListFormat(i18n.language, { type: 'unit' }), [i18n.language]);

  return {
    surface: (surface: Surface) => t(`surfaces.${surface}`),
    activity: (activity: Activity) => t(`activities.${activity}`),
    activities: (activities: readonly Activity[]) =>
      list.format(activities.map((activity) => t(`activities.${activity}`))),
    category: (category: Category) => t(`categories.${category}`),
  };
}
