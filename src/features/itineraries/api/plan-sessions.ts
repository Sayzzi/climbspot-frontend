import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { toPairs } from '@/shared/api/geojson';
import { unwrap } from '@/shared/api/request';

import type { HillSession, HillSessionRequest } from '../types';

/** Asks the API for Hill Sessions from a point. */
export function usePlanSessions() {
  return useMutation({
    mutationFn: async (request: HillSessionRequest): Promise<HillSession[]> =>
      (await unwrap(apiClient.POST('/itineraries/sessions', { body: request }))).sessions.map(
        (session) => ({
          ...session,
          repeat: {
            ...session.repeat,
            path: { type: 'LineString', coordinates: toPairs(session.repeat.path.coordinates) },
          },
          warmUp: {
            ...session.warmUp,
            path: { type: 'LineString', coordinates: toPairs(session.warmUp.path.coordinates) },
          },
        }),
      ),
  });
}
