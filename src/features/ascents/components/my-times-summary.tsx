import { useTranslation } from 'react-i18next';

import { PoweredByStrava } from '@/shared/ui/strava-brand';
import { useFormatters } from '@/shared/units';

import type { NearbyAscent } from '../types';

type AscentTimeSummary = NonNullable<NearbyAscent['myAscentTimes']>;

/** The signed-in Visitor's best and latest times on a climb, credited to Strava. */
export function MyTimesSummary({ times }: { readonly times: AscentTimeSummary }) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p className="text-sm font-semibold text-moss">
        {t('myTimes.summary', { time: format.clock(times.best), count: times.count })}
      </p>
      <p className="text-sm text-ink-muted">
        {t('myTimes.latestOn', {
          time: format.clock(times.latest.seconds),
          date: format.date(times.latest.startedAt),
        })}
      </p>
      <PoweredByStrava />
    </div>
  );
}
