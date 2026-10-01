import { useMemo, useState, type ReactNode } from 'react';

import type { UnitSystem } from './format';
import { defaultUnitSystem, readStoredUnitSystem, storeUnitSystem } from './preference';
import { UnitsContext } from './units-context';

/** Holds the metric/imperial choice for the whole app. */
export function UnitsProvider({ children }: { readonly children: ReactNode }) {
  const [system, setSystemState] = useState<UnitSystem>(
    () => readStoredUnitSystem() ?? defaultUnitSystem(navigator.languages),
  );

  const value = useMemo(
    () => ({
      system,
      setSystem: (next: UnitSystem) => {
        setSystemState(next);
        storeUnitSystem(next);
      },
    }),
    [system],
  );

  return <UnitsContext value={value}>{children}</UnitsContext>;
}
