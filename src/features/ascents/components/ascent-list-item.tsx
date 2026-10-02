import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { useFormatters } from '@/shared/units';

import { useAscentLabels } from '../hooks/use-ascent-labels';
import type { NearbyAscent } from '../types';
import { FactList } from './fact-list';

interface AscentListItemProps {
  readonly ascent: NearbyAscent;
  readonly selected: boolean;
  readonly onSelect: (id: string) => void;
}

export function AscentListItem({ ascent, selected, onSelect }: AscentListItemProps) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const labels = useAscentLabels();

  return (
    <li>
      <article
        className={cn(
          // A waymark-red edge marks the Ascent selected on the map.
          '-mx-4 border-l-4 px-3 py-4 transition-colors',
          selected ? 'border-blaze bg-lichen/60' : 'border-transparent',
        )}
      >
        <header className="flex items-baseline justify-between gap-4">
          <h3 className="text-xl leading-tight font-semibold">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onSelect(ascent.id);
              }}
              className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-pine"
            >
              {ascent.name}
            </button>
          </h3>
          <span className="text-sm whitespace-nowrap text-ink-muted">
            {t('facts.distanceToStart', { distance: format.distance(ascent.distanceToStart) })}
          </span>
        </header>
        <FactList
          className="mt-2 grid-cols-3"
          facts={[
            { term: t('facts.length'), value: format.distance(ascent.length) },
            { term: t('facts.elevationGain'), value: format.elevation(ascent.elevationGain) },
            { term: t('facts.averageGradient'), value: format.gradient(ascent.averageGradient) },
            { term: t('facts.category'), value: labels.category(ascent.category) },
            { term: t('facts.surface'), value: labels.surface(ascent.surface) },
            {
              term: t('facts.activities'),
              value: labels.activities(ascent.activities),
              className: 'col-span-3',
            },
          ]}
        />
        <AscentLink ascent={ascent} className="mt-3 inline-block" />
      </article>
    </li>
  );
}

/** Opens an Ascent's page, remembering that the Visitor came from the search. */
export function AscentLink({
  ascent,
  className,
}: {
  readonly ascent: Pick<NearbyAscent, 'id' | 'name'>;
  readonly className?: string;
}) {
  const { t } = useTranslation('ascents');

  return (
    <Link
      to="/ascents/$ascentId"
      params={{ ascentId: ascent.id }}
      state={{ fromSearch: true }}
      aria-label={t('search.viewDetails', { name: ascent.name })}
      className={cn(
        'text-sm font-semibold text-pine underline decoration-pine/30 underline-offset-4 hover:decoration-pine focus-visible:outline-2 focus-visible:outline-pine',
        className,
      )}
    >
      {t('search.details')}
    </Link>
  );
}
