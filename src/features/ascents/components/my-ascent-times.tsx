import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { PoweredByStrava } from '@/shared/ui/strava-brand';
import { useFormatters } from '@/shared/units';

import { useMyAscentTimes } from '../api/my-ascent-times';

/** The signed-in Visitor's own Ascent Times on an Ascent; nothing without any. */
export function MyAscentTimes({ ascentId }: { readonly ascentId: string }) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const { data: times } = useMyAscentTimes(ascentId);
  const headingId = useId();

  if (!times || times.length === 0) {
    return null;
  }
  const best = Math.min(...times.map((time) => time.seconds));

  return (
    <section aria-labelledby={headingId} className="rounded-xl bg-white p-4">
      <h2 id={headingId} className="mb-3 text-lg font-semibold">
        {t('myTimes.title')}
      </h2>
      <ol className="flex flex-col divide-y divide-pine/10 text-sm">
        {times.map((time) => (
          <li key={time.startedAt} className="flex items-baseline gap-3 py-1.5">
            <time dateTime={time.startedAt} className="w-28 text-ink-muted">
              {format.date(time.startedAt)}
            </time>{' '}
            <span className="font-semibold tabular-nums">{format.clock(time.seconds)}</span>
            {time.seconds === best && (
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
