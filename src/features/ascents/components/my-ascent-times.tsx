import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { plateClassName } from '@/shared/ui/plate';
import { PoweredByStrava } from '@/shared/ui/strava-brand';
import { useFormatters } from '@/shared/units';

import { useMyAscentTimes } from '../api/my-ascent-times';
import { ProgressChart } from './progress-chart';

/** The signed-in Visitor's own Ascent Times on an Ascent; nothing without any. */
export function MyAscentTimes({ ascentId }: { readonly ascentId: string }) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const { data: times } = useMyAscentTimes(ascentId);
  const headingId = useId();

  if (!times || times.length === 0) {
    return null;
  }
  // Newest first: the latest is the first; the best, the fastest (the earliest on a tie).
  const [latest] = times;
  const best = times.reduce((fastest, time) => (time.seconds <= fastest.seconds ? time : fastest));
  if (!latest) {
    return null;
  }
  const gap = latest.seconds - best.seconds;

  return (
    <section aria-labelledby={headingId} className={cn(plateClassName, 'p-4')}>
      <h2 id={headingId} className="text-xl">
        {t('myTimes.title')}
      </h2>
      <p className="mb-3 text-sm font-semibold text-moss">
        {gap > 0
          ? t('myTimes.latest', {
              time: format.clock(latest.seconds),
              gap: gap < 60 ? t('myTimes.gapSeconds', { seconds: gap }) : format.clock(gap),
            })
          : t('myTimes.latestBest', { time: format.clock(latest.seconds) })}
      </p>
      {times.length > 1 && (
        <div className="mb-3">
          <ProgressChart
            times={times}
            best={best}
            latest={latest}
            description={t('myTimes.chart', {
              count: times.length,
              first: format.date(times.at(-1)?.startedAt ?? latest.startedAt),
              last: format.date(latest.startedAt),
              best: format.clock(best.seconds),
              bestDate: format.date(best.startedAt),
              latest: format.clock(latest.seconds),
              latestDate: format.date(latest.startedAt),
            })}
          />
        </div>
      )}
      <ol className="flex flex-col divide-y divide-pine/10 text-sm">
        {times.map((time, index) => (
          <li
            key={`${time.startedAt}-${String(index)}`}
            className="flex items-baseline gap-3 py-1.5"
          >
            <time dateTime={time.startedAt} className="w-28 text-ink-muted">
              {format.date(time.startedAt)}
            </time>{' '}
            <span className="font-semibold tabular-nums">{format.clock(time.seconds)}</span>
            {time === best && (
              <>
                {' '}
                <span className="rounded bg-signpost px-1.5 text-xs font-semibold text-pine">
                  {t('myTimes.best')}
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
      <PoweredByStrava className="mt-3" />
    </section>
  );
}
