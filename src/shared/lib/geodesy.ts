import type { Position } from './position';

/** Mean Earth radius (IUGG), in metres; the API measures with the same one. */
const EARTH_RADIUS = 6_371_008.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two positions, in metres (haversine formula). */
export function distanceBetween(from: Position, to: Position): number {
  const dLatitude = toRadians(to.latitude - from.latitude);
  const dLongitude = toRadians(to.longitude - from.longitude);
  const h =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}
