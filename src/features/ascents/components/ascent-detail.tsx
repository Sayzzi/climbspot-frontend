import { useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { MapView } from '@/shared/map';
import { buttonVariants } from '@/shared/ui/button-variants';
import { useFormatters } from '@/shared/units';

import { ascentQuery } from '../api/ascent';
import { useAscentLabels } from '../hooks/use-ascent-labels';
import { BackToSearch } from './back-to-search';
import { ElevationProfileChart } from './elevation-profile-chart';

/** Everything about one Ascent; its data is loaded by the route beforehand. */
export function AscentDetail({ id }: { readonly id: string }) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const labels = useAscentLabels();
  const { data: ascent } = useSuspenseQuery(ascentQuery(id));
  const measurementsId = useId();
  const profileId = useId();

  // GeoJSON pairs are [longitude, latitude].
  const path = ascent.path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
  const facts: [string, string][] = [
    [t('facts.length'), format.distance(ascent.length)],
    [t('facts.elevationGain'), format.elevation(ascent.elevationGain)],
    [t('facts.averageGradient'), format.gradient(ascent.averageGradient)],
    [t('facts.maximumGradient'), format.gradient(ascent.maximumGradient)],
    [t('facts.difficultyScore'), format.number(ascent.difficultyScore)],
    [t('facts.category'), labels.category(ascent.category)],
    [t('facts.surface'), labels.surface(ascent.surface)],
    [t('facts.activities'), labels.activities(ascent.activities)],
  ];

  return (
    <article className="flex flex-col gap-6">
      <div>
        <BackToSearch />
      </div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{ascent.name}</h1>
        <a
          href={`geo:${String(ascent.start.latitude)},${String(ascent.start.longitude)}`}
          className={buttonVariants({ variant: 'secondary' })}
        >
          {t('detail.openInMaps')}
        </a>
      </header>

      <MapView
        label={t('detail.map', { name: ascent.name })}
        fitTo={path}
        line={path}
        markers={[
          { id: 'start', position: ascent.start, label: t('detail.start'), tone: 'start' },
          { id: 'top', position: ascent.top, label: t('detail.top'), tone: 'top' },
        ]}
        className="h-80 lg:h-[28rem]"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section aria-labelledby={measurementsId} className="rounded-xl bg-white p-4">
          <h2 id={measurementsId} className="mb-3 text-lg font-semibold">
            {t('detail.measurements')}
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {facts.map(([term, value]) => (
              <div key={term} className="contents">
                <dt className="text-ink-muted">{term}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby={profileId} className="rounded-xl bg-white p-4">
          <h2 id={profileId} className="mb-3 text-lg font-semibold">
            {t('detail.profile.title')}
          </h2>
          <ElevationProfileChart ascent={ascent} />
        </section>
      </div>
    </article>
  );
}
