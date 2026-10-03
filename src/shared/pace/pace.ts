import { metresPerDistanceUnit, type UnitSystem } from '@/shared/units';

/** Flat Paces accepted, in seconds per kilometre (3:00 to 12:00 per km). */
export const FASTEST_PACE = 180;
export const SLOWEST_PACE = 720;

export type PaceProblem = 'format' | 'range';

const perKm = (secondsPerUnit: number, system: UnitSystem) =>
  (secondsPerUnit * 1000) / metresPerDistanceUnit(system);

const perUnit = (secondsPerKm: number, system: UnitSystem) =>
  (secondsPerKm * metresPerDistanceUnit(system)) / 1000;

/** Whether a Flat Pace in seconds per km is within the accepted range. */
export const isAcceptedPace = (secondsPerKm: number) =>
  secondsPerKm >= FASTEST_PACE && secondsPerKm <= SLOWEST_PACE;

/**
 * The accepted range as the Visitor types it, in whole seconds per km or per mile,
 * kept inside 3:00–12:00 per km; given back in seconds per km.
 */
export function paceBounds(system: UnitSystem): { fastest: number; slowest: number } {
  return {
    fastest: perKm(Math.ceil(perUnit(FASTEST_PACE, system)), system),
    slowest: perKm(Math.floor(perUnit(SLOWEST_PACE, system)), system),
  };
}

/** Reads a typed pace (min:s per km or per mile) into seconds per km, or says what is wrong. */
export function parsePace(
  text: string,
  system: UnitSystem,
): { readonly secondsPerKm: number } | { readonly problem: PaceProblem } {
  const match = /^\s*(\d{1,2}):([0-5]\d)\s*$/.exec(text);
  if (!match) {
    return { problem: 'format' };
  }
  const secondsPerKm = perKm(Number(match[1]) * 60 + Number(match[2]), system);
  return isAcceptedPace(secondsPerKm) ? { secondsPerKm } : { problem: 'range' };
}

/** Estimated Time in whole minutes (at least one): Flat-Equivalent Distance at the Flat Pace. */
export function estimatedMinutes(flatEquivalentDistance: number, secondsPerKm: number): number {
  return Math.max(1, Math.round(((flatEquivalentDistance / 1000) * secondsPerKm) / 60));
}
