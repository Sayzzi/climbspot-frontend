import { toPairs } from '@/shared/api/geojson';

interface WidenedPath {
  readonly path: {
    readonly type: 'LineString';
    readonly coordinates: readonly (readonly number[])[];
  };
}

/** Restores the `[longitude, latitude]` pairs of an Itinerary's path, as sent by the API. */
export function withPairs<T extends WidenedPath>(
  itinerary: T,
): Omit<T, 'path'> & { path: { type: 'LineString'; coordinates: [number, number][] } } {
  return {
    ...itinerary,
    path: { type: itinerary.path.type, coordinates: toPairs(itinerary.path.coordinates) },
  };
}

interface WidenedSession {
  readonly kind: 'session';
  readonly repeat: WidenedPath;
  readonly warmUp: WidenedPath;
}

/** Restores the pairs of every path of a proposal, whatever its kind. */
export function proposalWithPairs<
  T extends (WidenedPath & { kind: 'uphill' | 'loop' }) | WidenedSession,
>(proposal: T) {
  return proposal.kind === 'session'
    ? { ...proposal, repeat: withPairs(proposal.repeat), warmUp: withPairs(proposal.warmUp) }
    : withPairs(proposal);
}
