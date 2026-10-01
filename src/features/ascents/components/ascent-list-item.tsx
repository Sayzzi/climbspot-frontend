import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { useFormatters } from '@/shared/units';

import { useAscentLabels } from '../hooks/use-ascent-labels';
import type { NearbyAscent } from '../types';

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
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <Fact term={t('facts.length')} value={format.distance(ascent.length)} />
          <Fact term={t('facts.elevationGain')} value={format.elevation(ascent.elevationGain)} />
          <Fact term={t('facts.averageGradient')} value={format.gradient(ascent.averageGradient)} />
          <Fact term={t('facts.category')} value={labels.category(ascent.category)} />
          <Fact term={t('facts.surface')} value={labels.surface(ascent.surface)} />
          <Fact
            term={t('facts.activities')}
            value={labels.activities(ascent.activities)}
            className="col-span-2 sm:col-span-3"
          />
        </dl>
      </article>
    </li>
  );
}

function Fact({ term, value, className }: { term: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-ink-muted">{term}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
