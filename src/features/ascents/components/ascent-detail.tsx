import { useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { MapView } from '@/shared/map';
import { buttonVariants } from '@/shared/ui/button-variants';
import { useEffortFacts } from '@/shared/pace';
import { useFormatters } from '@/shared/units';

import { ascentQuery } from '../api/ascent';
import { useFavouriteToggle } from '../api/favourite-ascents';
import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { BackToSearch } from './back-to-search';
import { FavouriteFeedback, FavouriteStar } from './favourite-toggle';
import { MyAscentTimes } from './my-ascent-times';
import { cn } from '@/shared/lib/cn';
import { FactList } from '@/shared/ui/fact-list';
import { plateClassName } from '@/shared/ui/plate';
import { SignFigures } from '@/shared/ui/sign-figures';
import { ElevationProfileChart } from '@/shared/ui/elevation-profile-chart';

/** Everything about one Ascent; its data is loaded by the route beforehand. */
export function AscentDetail({ id }: { readonly id: string }) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const labels = useDomainLabels();
  const { session } = useAuth();
  const { data: ascent } = useSuspenseQuery(ascentQuery(id, session?.visitorId));
  const favourite = useFavouriteToggle(ascent.id);
  const effortFacts = useEffortFacts(ascent.effort);
  const measurementsId = useId();
  const profileId = useId();

  // GeoJSON pairs are [longitude, latitude].
  const path = ascent.path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
  const headline = [
    { term: t('facts.length'), value: format.distance(ascent.length) },
    { term: t('facts.elevationGain'), value: format.elevation(ascent.elevationGain) },
    { term: t('facts.averageGradient'), value: format.gradient(ascent.averageGradient) },
  ];
  const facts = [
    ...effortFacts,
    { term: t('facts.maximumGradient'), value: format.gradient(ascent.maximumGradient) },
    { term: t('facts.difficultyScore'), value: format.number(ascent.difficultyScore) },
  ];
  const about = [
    labels.surface(ascent.surface),
    labels.category(ascent.category),
    ...ascent.activities.map((activity) => labels.activity(activity)),
  ];

  return (
    <article className="flex flex-col gap-6">
      <div>
        <BackToSearch />
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl leading-none font-extrabold">{ascent.name}</h1>
            <FavouriteStar ascent={ascent} toggle={favourite} />
          </div>
          <ul aria-label={t('detail.about')} className="flex flex-wrap gap-2">
            {about.map((label) => (
              <li
                key={label}
                className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-pine/15"
              >
                {label}
              </li>
            ))}
          </ul>
          <FavouriteFeedback toggle={favourite} />
        </div>
        <a
          href={`geo:${String(ascent.start.latitude)},${String(ascent.start.longitude)}`}
          className={buttonVariants({ variant: 'secondary' })}
        >
          {t('detail.openInMaps')}
        </a>
      </header>

      <SignFigures facts={headline} />

      <MapView
        label={t('detail.map', { name: ascent.name })}
        center={ascent.start}
        zoom={13}
        fitTo={path}
        line={path}
        markers={[
          { id: 'start', position: ascent.start, label: t('detail.start'), tone: 'start' },
          { id: 'top', position: ascent.top, label: t('detail.top'), tone: 'waymark' },
        ]}
        className={cn(plateClassName, 'h-80 overflow-hidden lg:h-[28rem]')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby={profileId} className={cn(plateClassName, 'p-4')}>
          <h2 id={profileId} className="mb-3 text-xl">
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

        <section aria-labelledby={measurementsId} className={cn(plateClassName, 'p-4')}>
          <h2 id={measurementsId} className="mb-3 text-xl">
            {t('detail.measurements')}
          </h2>
          <FactList facts={facts} className="grid-cols-2 gap-y-2" />
        </section>
      </div>

      <MyAscentTimes ascentId={ascent.id} />
    </article>
  );
}
