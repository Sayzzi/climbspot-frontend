import { useTranslation } from 'react-i18next';

import type { components } from '@/shared/api/schema.gen';
import type { Fact } from '@/shared/ui/fact-list';
import { useFormatters } from '@/shared/units';

import { EstimatedTime } from './estimated-time';

/** Km-Effort and Estimated Time of a path, as facts; none when it carries no running effort. */
export function useEffortFacts(effort: components['schemas']['Effort'] | undefined): Fact[] {
  const { t } = useTranslation();
  const format = useFormatters();

  return effort
    ? [
        { term: t('effort.kmEffort'), value: format.kmEffort(effort.kmEffort) },
        {
          term: t('effort.estimatedTime'),
          value: <EstimatedTime flatEquivalentDistance={effort.flatEquivalentDistance} />,
        },
      ]
    : [];
}
