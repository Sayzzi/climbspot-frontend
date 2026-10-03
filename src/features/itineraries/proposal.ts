import type { Position } from '@/shared/lib/position';

import type { Proposal } from './types';

/** What stands for a proposal on the map and in its profile: its path, or a session's Repeat. */
export function mainStretch(proposal: Proposal) {
  return proposal.kind === 'session' ? proposal.repeat : proposal;
}

/** GeoJSON pairs are [longitude, latitude]. */
export function positionsOf(path: {
  readonly coordinates: readonly (readonly [number, number])[];
}): Position[] {
  return path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}
