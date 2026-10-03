import { useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { MapView } from '@/shared/map';
import { buttonVariants } from '@/shared/ui/button-variants';
import { EstimatedTime } from '@/shared/pace';
import { useFormatters } from '@/shared/units';

import { ascentQuery } from '../api/ascent';
import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { BackToSearch } from './back-to-search';
import { FactList } from '@/shared/ui/fact-list';
import { ElevationProfileChart } from '@/shared/ui/elevation-profile-chart';

/** Everything about one Ascent; its data is loaded by the route beforehand. */
export function AscentDetail({ id }: { readonly id: string }) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const labels = useDomainLabels();
  const { data: ascent } = useSuspenseQuery(ascentQuery(id));
  const measurementsId = useId();
  const profileId = useId();

  // GeoJSON pairs are [longitude, latitude].
  const path = ascent.path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
  const facts = [
    { term: t('facts.length'), value: format.distance(ascent.length) },
    { term: t('facts.elevationGain'), value: format.elevation(ascent.elevationGain) },
    ...(ascent.effort
      ? [
          { term: t('facts.kmEffort'), value: format.kmEffort(ascent.effort.kmEffort) },
          {
            term: t('facts.estimatedTime'),
            value: <EstimatedTime flatEquivalentDistance={ascent.effort.flatEquivalentDistance} />,
          },
        ]
      : []),
    { term: t('facts.averageGradient'), value: format.gradient(ascent.averageGradient) },
    { term: t('facts.maximumGradient'), value: format.gradient(ascent.maximumGradient) },
    { term: t('facts.difficultyScore'), value: format.number(ascent.difficultyScore) },
    { term: t('facts.category'), value: labels.category(ascent.category) },
    { term: t('facts.surface'), value: labels.surface(ascent.surface) },
    { term: t('facts.activities'), value: labels.activities(ascent.activities) },
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
        center={ascent.start}
        zoom={13}
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
          <FactList facts={facts} className="grid-cols-2 gap-y-2" />
        </section>

        <section aria-labelledby={profileId} className="rounded-xl bg-white p-4">
          <h2 id={profileId} className="mb-3 text-lg font-semibold">
            {t('detail.profile.title')}
          </h2>
          <ElevationProfileChart
            profile={ascent.elevationProfile}
            length={ascent.length}
            description={t('detail.profile.summary', {
              length: format.distance(ascent.length),
              start: format.elevation(ascent.start.elevation),
              top: format.elevation(ascent.top.elevation),
              steepest: format.gradient(ascent.maximumGradient),
            })}
          />
        </section>
      </div>
    </article>
  );
}
