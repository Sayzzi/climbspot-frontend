import { useEffect } from 'react';

import { useCurrentPosition, type GeolocationState } from '@/shared/hooks/use-current-position';

import type { Position } from '../types';

/**
 * Asks for the Visitor's position while the search has none and they want it found,
 * and reports it once the browser answers.
 */
export function useLocateVisitor(
  position: Position | undefined,
  onLocated: (located: Position) => void,
  wanted = true,
): GeolocationState {
  const state = useCurrentPosition(wanted && position === undefined);
  const located = state.status === 'located' ? state.position : undefined;

  useEffect(() => {
    if (located && position === undefined) {
      onLocated(located);
    }
    // Only react to the browser's answer, not to a new `onLocated` on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located?.latitude, located?.longitude]);

  return state;
}
