import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SignedInOnly } from '@/shared/auth';
import { cn } from '@/shared/lib/cn';
import { buttonVariants } from '@/shared/ui/button-variants';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { useFormatters } from '@/shared/units';

import { useSavedItineraries } from '../api/saved-itineraries';
import type { SavedItinerarySummary } from '../types';
import { SavedItineraryDetail } from './saved-itinerary-detail';

/** The signed-in Visitor's Saved Itineraries; an invitation to sign in otherwise. */
export function MyItineraries() {
  const { t } = useTranslation('itineraries');
  return (
    <SignedInOnly reason={t('saved.signedOut')}>
      <SavedItineraries />
    </SignedInOnly>
  );
}

/** The signed-in Visitor's Saved Itineraries, and the one they select. */
function SavedItineraries() {
  const { t } = useTranslation('itineraries');
  const saved = useSavedItineraries();
  const [selectedId, setSelectedId] = useState<string>();

  if (saved.error) {
    return <ErrorNotice error={saved.error} onRetry={() => void saved.refetch()} />;
  }
  if (!saved.data) {
    return <p className="text-ink-muted">{t('saved.loading')}</p>;
  }
  if (saved.data.length === 0) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-3 rounded-lg bg-lichen p-4">
        <p>{t('saved.empty')}</p>
        <Link to="/" className={buttonVariants()}>
          {t('saved.plan')}
        </Link>
      </div>
    );
  }
  // The first one is shown until the Visitor picks another, or after theirs is deleted.
  const shown = saved.data.find((itinerary) => itinerary.id === selectedId) ?? saved.data[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <ul aria-label={t('saved.list')} className="flex flex-col divide-y divide-pine/10">
        {saved.data.map((itinerary) => (
          <li key={itinerary.id}>
            <SavedItineraryItem
              itinerary={itinerary}
              selected={itinerary === shown}
              onSelect={() => {
                setSelectedId(itinerary.id);
              }}
            />
          </li>
        ))}
      </ul>
      {shown && <SavedItineraryDetail key={shown.id} id={shown.id} />}
    </div>
  );
}

interface SavedItineraryItemProps {
  readonly itinerary: SavedItinerarySummary;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

function SavedItineraryItem({ itinerary, selected, onSelect }: SavedItineraryItemProps) {
  const { t, i18n } = useTranslation('itineraries');
  const format = useFormatters();
  const savedOn = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
    new Date(itinerary.savedAt),
  );

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={t('show', { name: itinerary.name })}
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col border-l-4 px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-pine',
        selected ? 'border-blaze bg-lichen/60' : 'border-transparent hover:bg-lichen/40',
      )}
    >
      <span className="font-semibold">{itinerary.name}</span>
      <span className="text-sm text-ink-muted">
        {t('saved.summary', {
          kind: t(`kind.${itinerary.kind}`),
          length: format.distance(itinerary.length),
          date: savedOn,
        })}
      </span>
    </button>
  );
}
