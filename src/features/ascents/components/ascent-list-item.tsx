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
          'rounded-xl border bg-white p-4 transition-colors',
          selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-brand-100',
        )}
      >
        <header className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onSelect(ascent.id);
              }}
              className="text-left hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              {ascent.name}
            </button>
          </h3>
          <span className="text-sm whitespace-nowrap text-ink-muted">
            {t('facts.distanceToStart', { distance: format.distance(ascent.distanceToStart) })}
          </span>
        </header>
        <FactList
          className="mt-3 grid-cols-2 sm:grid-cols-4"
          facts={[
            { term: t('facts.length'), value: format.distance(ascent.length) },
            { term: t('facts.elevationGain'), value: format.elevation(ascent.elevationGain) },
            { term: t('facts.averageGradient'), value: format.gradient(ascent.averageGradient) },
            { term: t('facts.category'), value: labels.category(ascent.category) },
            { term: t('facts.surface'), value: labels.surface(ascent.surface) },
            {
              term: t('facts.activities'),
              value: labels.activities(ascent.activities),
              className: 'col-span-2 sm:col-span-3',
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
      className={cn('text-sm font-medium text-brand-700 hover:underline', className)}
    >
      {t('search.details')}
    </Link>
  );
}
