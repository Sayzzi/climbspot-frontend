import { useTranslation } from 'react-i18next';

import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { cn } from '@/shared/lib/cn';
import { FactList } from '@/shared/ui/fact-list';
import { useFormatters } from '@/shared/units';

import type { Itinerary } from '../types';

interface ProposalCardProps {
  readonly proposal: Itinerary;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

/** One proposal: its name, how it matches the request and its measurements. */
export function ProposalCard({ proposal, selected, onSelect }: ProposalCardProps) {
  const { t } = useTranslation('itineraries');
  const name = useItineraryName(proposal);
  const facts = useFacts(proposal);

  return (
    <article
      className={cn(
        '-mx-4 border-l-4 px-3 py-3',
        selected ? 'border-blaze bg-lichen/60' : 'border-transparent',
      )}
    >
      <h3 className="text-lg leading-tight font-semibold">
        <button
          type="button"
          aria-pressed={selected}
          aria-label={t('show', { name })}
          onClick={onSelect}
          className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-pine"
        >
          {name}
        </button>
      </h3>
      <p className={cn('text-sm', proposal.exact ? 'text-moss' : 'text-ink-muted')}>
        {proposal.exact ? t('exact') : <Differences proposal={proposal} />}
      </p>
      <FactList className="mt-2 grid-cols-3" facts={facts} />
    </article>
  );
}

function useItineraryName(proposal: Itinerary): string {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();

  return proposal.kind === 'uphill'
    ? t('name.uphill', {
        length: format.distance(proposal.length),
        gradient: format.gradient(proposal.averageGradient),
      })
    : t('name.loop', { length: format.distance(proposal.length) });
}

function useFacts(proposal: Itinerary) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();
  const labels = useDomainLabels();
  const length = { term: t('facts.length'), value: format.distance(proposal.length) };

  if (proposal.kind === 'loop') {
    return [
      length,
      { term: t('facts.heightGained'), value: format.elevation(proposal.heightGained) },
      { term: t('facts.relief'), value: labels.relief(proposal.relief) },
    ];
  }
  return [
    length,
    { term: t('facts.elevationGain'), value: format.elevation(proposal.elevationGain) },
    { term: t('facts.averageGradient'), value: format.gradient(proposal.averageGradient) },
    { term: t('facts.maximumGradient'), value: format.gradient(proposal.maximumGradient) },
    { term: t('facts.category'), value: labels.category(proposal.category) },
    {
      term: t('facts.distanceToStart'),
      value: t('away', { distance: format.distance(proposal.distanceToStart) }),
    },
  ];
}

function Differences({ proposal }: { readonly proposal: Itinerary }) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();
  const labels = useDomainLabels();

  return proposal.differences
    .map((difference) =>
      difference.kind === 'gradient'
        ? t('close.gradient', {
            actual: format.gradient(difference.actual),
            min: format.gradient(difference.min),
            max: format.gradient(difference.max),
          })
        : t('close.relief', {
            actual: labels.relief(difference.actual),
            wanted: labels.relief(difference.wanted),
          }),
    )
    .join(' ');
}
