import { useTranslation } from 'react-i18next';

import type { Activity, Category, Surface } from '../types';

/** Translated names of the domain values (Surface, Activity, Category). */
export function useAscentLabels() {
  const { t } = useTranslation('ascents');

  return {
    surface: (surface: Surface) => t(`surfaces.${surface}`),
    activity: (activity: Activity) => t(`activities.${activity}`),
    activities: (activities: readonly Activity[]) =>
      activities.map((activity) => t(`activities.${activity}`)).join(', '),
    category: (category: Category) => t(`categories.${category}`),
  };
}
