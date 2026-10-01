import { afterEach } from 'vitest';

type Behaviour =
  | { readonly position: { readonly latitude: number; readonly longitude: number } }
  | { readonly error: 'denied' | 'unavailable' | 'timeout' }
  | 'pending'
  | 'unsupported';

const errorCodes = { denied: 1, unavailable: 2, timeout: 3 } as const;

/** Makes `navigator.geolocation` grant a position, fail, never answer, or not exist. */
export function stubGeolocation(behaviour: Behaviour): void {
  const geolocation: Pick<Geolocation, 'getCurrentPosition'> = {
    getCurrentPosition(success, failure) {
      if (behaviour === 'pending' || behaviour === 'unsupported') {
        return;
      }
      if ('position' in behaviour) {
        success({
          coords: { ...behaviour.position, accuracy: 20 },
          timestamp: Date.now(),
        } as GeolocationPosition);
        return;
      }
      failure?.({
        code: errorCodes[behaviour.error],
        message: behaviour.error,
      } as GeolocationPositionError);
    },
  };

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: behaviour === 'unsupported' ? undefined : geolocation,
  });
}

// jsdom has no geolocation; tests that need one stub it explicitly.
afterEach(() => {
  stubGeolocation('unsupported');
});
