import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';

import type { NearbyCriteria } from '../types';

export function nearbyAscentsQuery({ position, radius, activities, categories }: NearbyCriteria) {
  const query = {
    latitude: position.latitude,
    longitude: position.longitude,
    ...(radius !== undefined && { radius }),
    ...(activities && activities.length > 0 && { activity: [...activities] }),
    ...(categories && categories.length > 0 && { category: [...categories] }),
  };

  return queryOptions({
    queryKey: ['ascents', 'nearby', query],
    queryFn: async ({ signal }) =>
      (await unwrap(apiClient.GET('/ascents/nearby', { params: { query }, signal }))).ascents,
  });
}

export function useNearbyAscents(criteria: NearbyCriteria) {
  // Keep showing the previous results while a new search (e.g. a filter change) loads.
  return useQuery({ ...nearbyAscentsQuery(criteria), placeholderData: keepPreviousData });
}
