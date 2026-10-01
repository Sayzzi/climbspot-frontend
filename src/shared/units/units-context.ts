import { createContext } from 'react';

import type { UnitSystem } from './format';

export interface UnitsContextValue {
  readonly system: UnitSystem;
  readonly setSystem: (system: UnitSystem) => void;
}

export const UnitsContext = createContext<UnitsContextValue | undefined>(undefined);
