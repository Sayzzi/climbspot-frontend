import { useTranslation } from 'react-i18next';

import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { useEffortFacts } from '@/shared/pace';
import { useFormatters } from '@/shared/units';

import type { Proposal } from '../types';

/** The name a proposal goes by until the Visitor gives it one. */
export function useProposalName(proposal: Proposal): string {
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

/** What a proposal measures, as facts to list. */
export function useProposalFacts(proposal: Proposal) {
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
