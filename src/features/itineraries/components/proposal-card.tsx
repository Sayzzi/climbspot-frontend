import { useTranslation } from 'react-i18next';

import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { cn } from '@/shared/lib/cn';
import { FactList } from '@/shared/ui/fact-list';
import { SignFigures } from '@/shared/ui/sign-figures';
import { useFormatters } from '@/shared/units';

import { useProposalFacts, useProposalName } from '../hooks/use-proposal-description';
import type { Proposal } from '../types';
import { ProposalDownloads } from './proposal-downloads';
import { SaveProposal } from './save-proposal';

interface ProposalCardProps {
  readonly proposal: Proposal;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

/** One proposal: its name, how it matches the request and its measurements. */
export function ProposalCard({ proposal, selected, onSelect }: ProposalCardProps) {
  const { t } = useTranslation('itineraries');
  const name = useProposalName(proposal);
  const facts = useProposalFacts(proposal);

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
          className="text-left hover:underline focus-visible:outline-3 focus-visible:outline-pine"
        >
          {name}
        </button>
      </h3>
      <p className={cn('text-sm', proposal.exact ? 'text-moss' : 'text-ink-muted')}>
        {proposal.exact ? t('exact') : <Differences proposal={proposal} />}
      </p>
      <div className="mt-3">
        <SignFigures facts={facts.slice(0, 3)} />
      </div>
      <FactList className="mt-3 grid-cols-3 border-t border-pine/10 pt-3" facts={facts.slice(3)} />
      {selected && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <ProposalDownloads proposal={proposal} name={name} />
          </div>
          <SaveProposal proposal={proposal} defaultName={name} />
        </div>
      )}
    </article>
  );
}

function Differences({ proposal }: { readonly proposal: Proposal }) {
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
