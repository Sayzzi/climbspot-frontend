import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';

import type { HillSession, HillSessionRequest } from '../types';
import { withPairs } from './with-pairs';

/** Asks the API for Hill Sessions from a point. */
export function usePlanSessions() {
  return useMutation({
    mutationFn: async (request: HillSessionRequest): Promise<HillSession[]> =>
      (await unwrap(apiClient.POST('/itineraries/sessions', { body: request }))).sessions.map(
        (session) => ({
          ...session,
          repeat: withPairs(session.repeat),
          warmUp: withPairs(session.warmUp),
        }),
      ),
  });
}
