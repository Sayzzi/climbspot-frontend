import { useMemo, useState, type ReactNode } from 'react';

import { FlatPaceContext } from './flat-pace-context';
import { readStoredFlatPace, storeFlatPace } from './preference';

/** Holds the Visitor's Flat Pace for the whole app, and whether its setting is open. */
export function FlatPaceProvider({ children }: { readonly children: ReactNode }) {
  const [secondsPerKm, setSecondsPerKmState] = useState(readStoredFlatPace);
  const [isSettingOpen, setSettingOpen] = useState(false);

  const value = useMemo(
    () => ({
      secondsPerKm,
      setSecondsPerKm: (next: number) => {
        setSecondsPerKmState(next);
        storeFlatPace(next);
      },
      clearSecondsPerKm: () => {
        setSecondsPerKmState(undefined);
        storeFlatPace(undefined);
      },
      isSettingOpen,
      openSetting: () => {
        setSettingOpen(true);
      },
      closeSetting: () => {
        setSettingOpen(false);
      },
    }),
    [secondsPerKm, isSettingOpen],
  );

  return <FlatPaceContext value={value}>{children}</FlatPaceContext>;
}
