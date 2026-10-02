import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';

import type { UphillItinerary, UphillRequest } from '../types';
import { withPairs } from './with-pairs';

/** Asks the API for Uphill Itineraries near a point. */
export function usePlanUphill() {
  return useMutation({
    mutationFn: async (request: UphillRequest): Promise<UphillItinerary[]> =>
      (await unwrap(apiClient.POST('/itineraries/uphill', { body: request }))).itineraries.map(
        withPairs,
      ),
  });
}
