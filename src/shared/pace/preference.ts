import { FASTEST_PACE, SLOWEST_PACE } from './pace';

const STORAGE_KEY = 'climbspot.flatPace';

/** The Visitor's saved Flat Pace in seconds per km, if storage is available and holds one. */
export function readStoredFlatPace(): number | undefined {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? Number.NaN);
    return stored >= FASTEST_PACE - 0.5 && stored <= SLOWEST_PACE + 0.5 ? stored : undefined;
  } catch {
    return undefined;
  }
}

/** Saves the Flat Pace; a per-browser convenience, silently skipped when storage is blocked. */
export function storeFlatPace(secondsPerKm: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(secondsPerKm));
  } catch {
    // Private browsing or blocked storage: the pace lasts for this visit only.
  }
}
