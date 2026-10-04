import { isAcceptedPace } from './pace';

const STORAGE_KEY = 'climbspot.flatPace';

/** The Visitor's saved Flat Pace in seconds per km, if storage is available and holds one. */
export function readStoredFlatPace(): number | undefined {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? Number.NaN);
    return isAcceptedPace(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

/** Saves the Flat Pace, or forgets it; a per-browser convenience, skipped when storage is blocked. */
export function storeFlatPace(secondsPerKm: number | undefined): void {
  try {
    if (secondsPerKm === undefined) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(secondsPerKm));
    }
  } catch {
    // Private browsing or blocked storage: the pace lasts for this visit only.
  }
}
