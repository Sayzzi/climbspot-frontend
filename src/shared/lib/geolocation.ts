import { useEffect, useState } from 'react';

export type GeolocationFailure = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export type GeolocationState =
  | { readonly status: 'idle' }
  | { readonly status: 'locating' }
  | {
      readonly status: 'located';
      readonly position: { readonly latitude: number; readonly longitude: number };
    }
  | { readonly status: 'failed'; readonly failure: GeolocationFailure };

const failures: Record<number, GeolocationFailure> = {
  1: 'denied',
  2: 'unavailable',
  3: 'timeout',
};

const options: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
};

type Answer = Extract<GeolocationState, { status: 'located' | 'failed' }>;

/** Asks the browser for the current position once, while `enabled`. */
export function useCurrentPosition(enabled: boolean): GeolocationState {
  // Read at render time: `navigator.geolocation` is absent in some browsers (and in jsdom).
  const geolocation = navigator.geolocation as Geolocation | undefined;
  const [answer, setAnswer] = useState<Answer>();

  useEffect(() => {
    if (!enabled || geolocation === undefined) {
      return;
    }

    let active = true;
    geolocation.getCurrentPosition(
      ({ coords }) => {
        if (active) {
          setAnswer({
            status: 'located',
            position: { latitude: coords.latitude, longitude: coords.longitude },
          });
        }
      },
      ({ code }) => {
        if (active) {
          setAnswer({ status: 'failed', failure: failures[code] ?? 'unavailable' });
        }
      },
      options,
    );

    return () => {
      active = false;
    };
  }, [enabled, geolocation]);

  if (!enabled) {
    return { status: 'idle' };
  }
  if (geolocation === undefined) {
    return { status: 'failed', failure: 'unsupported' };
  }
  return answer ?? { status: 'locating' };
}
