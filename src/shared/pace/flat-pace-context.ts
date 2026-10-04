import { createContext } from 'react';

export interface FlatPaceContextValue {
  /** Seconds per km, once the Visitor has stated it. */
  readonly secondsPerKm: number | undefined;
  readonly setSecondsPerKm: (secondsPerKm: number) => void;
  /** Forgets the pace, e.g. when where it came from is gone. */
  readonly clearSecondsPerKm: () => void;
  /** Whether the setting is open: anything inviting to set the pace can open it. */
  readonly isSettingOpen: boolean;
  readonly openSetting: () => void;
  readonly closeSetting: () => void;
}

export const FlatPaceContext = createContext<FlatPaceContextValue | undefined>(undefined);
