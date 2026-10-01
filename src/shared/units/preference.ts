import type { UnitSystem } from './format';

const STORAGE_KEY = 'climbspot.units';

/** US English uses miles and feet; every other language gets metric units. */
export function defaultUnitSystem(languages: readonly string[]): UnitSystem {
  return languages[0]?.toLowerCase() === 'en-us' ? 'imperial' : 'metric';
}

/** The Visitor's saved choice, if storage is available and holds one. */
export function readStoredUnitSystem(): UnitSystem | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'metric' || stored === 'imperial' ? stored : undefined;
  } catch {
    return undefined;
  }
}

/** Saves the choice; a per-browser convenience, silently skipped when storage is blocked. */
export function storeUnitSystem(system: UnitSystem): void {
  try {
    localStorage.setItem(STORAGE_KEY, system);
  } catch {
    // Private browsing or blocked storage: the choice lasts for this visit only.
  }
}
