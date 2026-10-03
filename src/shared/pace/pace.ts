import type { UnitSystem } from '@/shared/units';

const METRES_PER_MILE = 1609.344;

/** Flat Paces accepted, in seconds per kilometre (3:00 to 12:00 per km). */
export const FASTEST_PACE = 180;
export const SLOWEST_PACE = 720;

export type PaceProblem = 'format' | 'range';

/** Seconds per km or per mile, depending on the unit system. */
const perUnit = (secondsPerKm: number, system: UnitSystem) =>
  system === 'imperial' ? (secondsPerKm * METRES_PER_MILE) / 1000 : secondsPerKm;

/** "5:30" from seconds. */
function minutesAndSeconds(seconds: number): string {
  const rounded = Math.round(seconds);
  return `${String(Math.floor(rounded / 60))}:${String(rounded % 60).padStart(2, '0')}`;
}

/** The pace as typed ("5:30"), in the Visitor's unit, for a Flat Pace in seconds per km. */
export function paceText(secondsPerKm: number, system: UnitSystem): string {
  return minutesAndSeconds(perUnit(secondsPerKm, system));
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
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  const secondsPerKm = system === 'imperial' ? (seconds * 1000) / METRES_PER_MILE : seconds;
  // Half a second of slack: a pace per mile converts to fractions of a second per km.
  if (secondsPerKm < FASTEST_PACE - 0.5 || secondsPerKm > SLOWEST_PACE + 0.5) {
    return { problem: 'range' };
  }
  return { secondsPerKm };
}

/** Estimated Time in whole minutes (at least one): Flat-Equivalent Distance at the Flat Pace. */
export function estimatedMinutes(flatEquivalentDistance: number, secondsPerKm: number): number {
  return Math.max(1, Math.round(((flatEquivalentDistance / 1000) * secondsPerKm) / 60));
}
