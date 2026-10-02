import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { toPairs } from '@/shared/api/geojson';
import { unwrap } from '@/shared/api/request';

import type { UphillItinerary, UphillRequest } from '../types';

/** Asks the API for Uphill Itineraries near a point. */
export function usePlanUphill() {
  return useMutation({
    mutationFn: async (request: UphillRequest): Promise<UphillItinerary[]> =>
      (await unwrap(apiClient.POST('/itineraries/uphill', { body: request }))).itineraries.map(
        (itinerary) => ({
          ...itinerary,
          path: { type: itinerary.path.type, coordinates: toPairs(itinerary.path.coordinates) },
        }),
      ),
  });
}
