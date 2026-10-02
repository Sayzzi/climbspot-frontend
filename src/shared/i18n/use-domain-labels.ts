import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Activity, Category, Relief, Surface } from '@/shared/domain/values';

/** Translated names of the domain values (Surface, Activity, Category, Relief). */
export function useDomainLabels() {
  const { t, i18n } = useTranslation();
  const list = useMemo(() => new Intl.ListFormat(i18n.language, { type: 'unit' }), [i18n.language]);

  return {
    surface: (surface: Surface) => t(`domain.surfaces.${surface}`),
    activity: (activity: Activity) => t(`domain.activities.${activity}`),
    activities: (activities: readonly Activity[]) =>
      list.format(activities.map((activity) => t(`domain.activities.${activity}`))),
    category: (category: Category) => t(`domain.categories.${category}`),
    relief: (relief: Relief) => t(`domain.reliefs.${relief}`),
  };
}
