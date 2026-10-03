import { use } from 'react';

import { FlatPaceContext, type FlatPaceContextValue } from './flat-pace-context';

export function useFlatPace(): FlatPaceContextValue {
  const value = use(FlatPaceContext);
  if (value === undefined) {
    throw new Error('useFlatPace must be used inside <FlatPaceProvider>.');
  }
  return value;
}
