import { use } from 'react';

import { UnitsContext, type UnitsContextValue } from './units-context';

export function useUnits(): UnitsContextValue {
  const value = use(UnitsContext);
  if (value === undefined) {
    throw new Error('useUnits must be used inside <UnitsProvider>.');
  }
  return value;
}
