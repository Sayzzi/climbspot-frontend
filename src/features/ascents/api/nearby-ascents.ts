import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';

import type { NearbyCriteria } from '../types';

function toQuery({ position, radius, activities, categories }: NearbyCriteria) {
  return {
    latitude: position.latitude,
    longitude: position.longitude,
    ...(radius !== undefined && { radius }),
    ...(activities && activities.length > 0 && { activity: [...activities] }),
    ...(categories && categories.length > 0 && { category: [...categories] }),
  };
}

/** Nearby Ascents, or nothing until there is a position to search around. */
export function useNearbyAscents(criteria: NearbyCriteria | undefined) {
  const query = criteria && toQuery(criteria);

  return useQuery({
    queryKey: ['ascents', 'nearby', query ?? null],
    queryFn: query
      ? async ({ signal }) =>
          (await unwrap(apiClient.GET('/ascents/nearby', { params: { query }, signal }))).ascents
      : skipToken,
    // Keep showing the previous results while a new search (e.g. a filter change) loads.
    placeholderData: keepPreviousData,
  });
}
