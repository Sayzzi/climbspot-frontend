import type { Proposal } from './types';

/** What stands for a proposal on the map and in its profile: its path, or a session's Repeat. */
export function mainStretch(proposal: Proposal) {
  return proposal.kind === 'session' ? proposal.repeat : proposal;
}
