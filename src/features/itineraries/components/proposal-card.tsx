import { useTranslation } from 'react-i18next';

import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { cn } from '@/shared/lib/cn';
import { fileNameFor, saveFile } from '@/shared/lib/save-file';
import { Button } from '@/shared/ui/button';
import { FactList } from '@/shared/ui/fact-list';
import { useEffortFacts } from '@/shared/pace';
import { useFormatters } from '@/shared/units';

import { GPX_TYPE, itineraryTrack, sessionTrack, toGpx } from '../gpx';
import type { HillSession, Proposal } from '../types';

interface ProposalCardProps {
  readonly proposal: Proposal;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

/** One proposal: its name, how it matches the request and its measurements. */
export function ProposalCard({ proposal, selected, onSelect }: ProposalCardProps) {
  const { t } = useTranslation('itineraries');
  const name = useItineraryName(proposal);
  const facts = useFacts(proposal);
  const fileName = t(`file.${proposal.kind}`, { name });
  const format = useFormatters();

  const saveWorkout = async (session: HillSession) => {
    // The FIT SDK is large: loaded only when a workout is saved.
    const { FIT_TYPE, toFitWorkout } = await import('../fit');
    saveFile(
      fileNameFor(fileName, 'fit'),
      toFitWorkout(session, name, {
        warmUp: t('workout.warmUp'),
        repeat: (index, count) =>
          t('workout.repeat', { index: format.number(index), count: format.number(count) }),
        recovery: t('workout.recovery'),
        coolDown: t('workout.coolDown'),
      }),
      FIT_TYPE,
    );
  };

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
      {selected && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const track =
                proposal.kind === 'session' ? sessionTrack(proposal) : itineraryTrack(proposal);
              saveFile(fileNameFor(fileName, 'gpx'), toGpx(track, fileName), GPX_TYPE);
            }}
          >
            {t('download')}
          </Button>
          {proposal.kind === 'session' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                void saveWorkout(proposal);
              }}
            >
              {t('downloadWorkout')}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

function useItineraryName(proposal: Proposal): string {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();

  switch (proposal.kind) {
    case 'uphill':
      return t('name.uphill', {
        length: format.distance(proposal.length),
        gradient: format.gradient(proposal.averageGradient),
      });
    case 'loop':
      return t('name.loop', { length: format.distance(proposal.length) });
    case 'session':
      return t('name.session', {
        repeats: format.number(proposal.repeats),
        length: format.distance(proposal.repeat.length),
        gradient: format.gradient(proposal.repeat.averageGradient),
      });
  }
}

function useFacts(proposal: Proposal) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();
  const labels = useDomainLabels();
  // Only running proposals carry an effort; a session's covers the whole session.
  const effort = useEffortFacts(
    proposal.kind === 'session' ? proposal.totals.effort : proposal.effort,
  );

  switch (proposal.kind) {
    case 'session':
      return [
        { term: t('facts.totalLength'), value: format.distance(proposal.totals.length) },
        { term: t('facts.heightGained'), value: format.elevation(proposal.totals.heightGained) },
        ...effort,
        { term: t('facts.repeatLength'), value: format.distance(proposal.repeat.length) },
        {
          term: t('facts.repeatGradient'),
          value: format.gradient(proposal.repeat.averageGradient),
        },
        {
          term: t('facts.repeatMaximumGradient'),
          value: format.gradient(proposal.repeat.maximumGradient),
        },
        { term: t('facts.warmUp'), value: format.distance(proposal.warmUp.length) },
      ];
    case 'loop':
      return [
        { term: t('facts.length'), value: format.distance(proposal.length) },
        { term: t('facts.heightGained'), value: format.elevation(proposal.heightGained) },
        { term: t('facts.relief'), value: labels.relief(proposal.relief) },
        ...effort,
      ];
    case 'uphill':
      return [
        { term: t('facts.length'), value: format.distance(proposal.length) },
        ...effort,
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
