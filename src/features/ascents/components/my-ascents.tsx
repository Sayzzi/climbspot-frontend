import { Link } from '@tanstack/react-router';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { SignedInOnly } from '@/shared/auth';
import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { cn } from '@/shared/lib/cn';
import { buttonVariants } from '@/shared/ui/button-variants';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { FactList } from '@/shared/ui/fact-list';
import { plateClassName } from '@/shared/ui/plate';
import { SignFigures } from '@/shared/ui/sign-figures';
import { PoweredByStrava } from '@/shared/ui/strava-brand';
import { textLinkClassName } from '@/shared/ui/text-link';
import { useFormatters } from '@/shared/units';

import {
  useFavouriteAscents,
  useFavouriteToggle,
  type FavouriteToggle,
} from '../api/favourite-ascents';
import type { FavouriteAscent } from '../types';
import { FavouriteFeedback, FavouriteStar } from './favourite-toggle';

/** The climbs the signed-in Visitor keeps; an invitation to sign in otherwise. */
export function MyAscents() {
  const { t } = useTranslation('ascents');
  return (
    <SignedInOnly reason={t('mine.signedOut')}>
      <FavouriteAscents />
    </SignedInOnly>
  );
}

function FavouriteAscents() {
  const { t } = useTranslation('ascents');
  const favourites = useFavouriteAscents();
  const toggle = useFavouriteToggle();
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  if (favourites.error) {
    return <ErrorNotice error={favourites.error} onRetry={() => void favourites.refetch()} />;
  }
  if (!favourites.data) {
    return <p className="text-ink-muted">{t('mine.loading')}</p>;
  }
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      {/* Where the focus goes when the climb it was on leaves the list. */}
      <h2 id={headingId} ref={heading} tabIndex={-1} className="text-2xl font-bold">
        {t('mine.favourites')}
      </h2>
      <FavouriteFeedback toggle={toggle} />
      {favourites.data.length === 0 ? (
        <div className={cn(plateClassName, 'flex max-w-xl flex-col items-start gap-3 p-6')}>
          <p>{t('mine.empty')}</p>
          <Link to="/" className={buttonVariants()}>
            {t('mine.find')}
          </Link>
        </div>
      ) : (
        <ul aria-label={t('mine.list')} className="grid gap-4 md:grid-cols-2">
          {favourites.data.map((ascent) => (
            <FavouriteItem
              key={ascent.id}
              ascent={ascent}
              toggle={toggle}
              onRemove={() => heading.current?.focus()}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FavouriteItem({
  ascent,
  toggle,
  onRemove,
}: {
  readonly ascent: FavouriteAscent;
  readonly toggle: FavouriteToggle;
  readonly onRemove: () => void;
}) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const labels = useDomainLabels();

  return (
    <li className={cn(plateClassName, 'flex flex-col gap-3 p-4')}>
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-xl leading-tight font-semibold">{ascent.name}</h3>
        {/* Focus first: the star goes with the climb it takes out. */}
        <div onClickCapture={onRemove}>
          <FavouriteStar ascent={{ ...ascent, favourite: true }} toggle={toggle} />
        </div>
      </header>
      <SignFigures
        facts={[
          { term: t('facts.length'), value: format.distance(ascent.length) },
          { term: t('facts.elevationGain'), value: format.elevation(ascent.elevationGain) },
          { term: t('facts.averageGradient'), value: format.gradient(ascent.averageGradient) },
        ]}
      />
      <FactList
        className="grid-cols-2 border-t border-pine/10 pt-3"
        facts={[
          { term: t('facts.category'), value: labels.category(ascent.category) },
          { term: t('facts.surface'), value: labels.surface(ascent.surface) },
        ]}
      />
      {ascent.myAscentTimes && (
        <div className="flex flex-wrap items-baseline gap-x-3">
          <p className="text-sm font-semibold text-moss">
            {t('myTimes.summary', {
              time: format.clock(ascent.myAscentTimes.best),
              count: ascent.myAscentTimes.count,
            })}
          </p>
          <PoweredByStrava />
        </div>
      )}
      <Link
        to="/ascents/$ascentId"
        params={{ ascentId: ascent.id }}
        aria-label={t('search.viewDetails', { name: ascent.name })}
        className={cn(textLinkClassName, 'self-start text-sm font-semibold')}
      >
        {t('search.details')}
      </Link>
    </li>
  );
}
