import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';

import type { LoopItinerary, LoopRequest } from '../types';
import { withPairs } from './with-pairs';

/** Asks the API for Loops from a point. */
export function usePlanLoops() {
  return useMutation({
    mutationFn: async (request: LoopRequest): Promise<LoopItinerary[]> =>
      (await unwrap(apiClient.POST('/itineraries/loops', { body: request }))).itineraries.map(
        withPairs,
      ),
  });
}
