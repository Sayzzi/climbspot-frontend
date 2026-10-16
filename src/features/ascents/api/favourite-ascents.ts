import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrapEmpty } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

import type { NearbyAscent } from '../types';
import { ascentQuery } from './ascent';

/**
 * Makes an Ascent one of the signed-in Visitor's Favourite Ascents, or takes it out:
 * its page and every search showing it change at once, and go back if the API refuses.
 */
export function useFavouriteToggle(ascentId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const visitorId = session?.visitorId;
  const ascentKey = ascentQuery(ascentId, visitorId).queryKey;
  const nearbyKey = ['ascents', 'nearby', visitorId ?? null];

  return useMutation({
    mutationFn: (favourite: boolean) => {
      const params = { params: { path: { id: ascentId } } };
      return unwrapEmpty(
        favourite
          ? apiClient.PUT('/ascents/{id}/favourite', params)
          : apiClient.DELETE('/ascents/{id}/favourite', params),
      );
    },
    onMutate: async (favourite) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ascentKey }),
        queryClient.cancelQueries({ queryKey: nearbyKey }),
      ]);
      const before: [QueryKey, unknown][] = [
        [ascentKey, queryClient.getQueryData(ascentKey)],
        ...queryClient.getQueriesData({ queryKey: nearbyKey }),
      ];
      queryClient.setQueryData(ascentKey, (ascent) => ascent && { ...ascent, favourite });
      queryClient.setQueriesData<NearbyAscent[]>({ queryKey: nearbyKey }, (ascents) =>
        ascents?.map((ascent) => (ascent.id === ascentId ? { ...ascent, favourite } : ascent)),
      );
      return { before };
    },
    onError: (_error, _favourite, context) => {
      for (const [key, data] of context?.before ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
  });
}

export type FavouriteToggle = ReturnType<typeof useFavouriteToggle>;
