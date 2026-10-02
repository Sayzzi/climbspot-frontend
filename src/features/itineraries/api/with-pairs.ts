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
