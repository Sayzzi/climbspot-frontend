import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap, unwrapEmpty } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

import type { FavouriteAscent, NearbyAscent } from '../types';
import { ascentQuery } from './ascent';

// Keyed by who is signed in: another Visitor signing in never sees these.
const favouritesQuery = (visitorId: string) =>
  queryOptions({
    queryKey: ['ascents', 'favourites', visitorId],
    queryFn: async ({ signal }): Promise<FavouriteAscent[]> =>
      (await unwrap(apiClient.GET('/ascents/favourites', { signal }))).ascents,
  });

/** The signed-in Visitor's Favourite Ascents, most recently marked first; nothing signed out. */
export function useFavouriteAscents() {
  const { session } = useAuth();
  return useQuery({
    ...favouritesQuery(session?.visitorId ?? ''),
    enabled: session !== undefined,
  });
}

export interface FavouriteChange {
  readonly id: string;
  readonly favourite: boolean;
}

/**
 * Makes Ascents the signed-in Visitor's Favourite Ascents, or takes them out: their
 * pages, every search showing them and the list of favourites change at once, and go
 * back if the API refuses.
 */
export function useFavouriteToggle() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const visitorId = session?.visitorId;
  const nearbyKey = ['ascents', 'nearby', visitorId ?? null];
  const listKey = favouritesQuery(visitorId ?? '').queryKey;

  return useMutation({
    mutationFn: ({ id, favourite }: FavouriteChange) => {
      const params = { params: { path: { id } } };
      return unwrapEmpty(
        favourite
          ? apiClient.PUT('/ascents/{id}/favourite', params)
          : apiClient.DELETE('/ascents/{id}/favourite', params),
      );
    },
    onMutate: async ({ id, favourite }) => {
      const ascentKey = ascentQuery(id, visitorId).queryKey;
      await Promise.all(
        [ascentKey, nearbyKey, listKey].map((queryKey) => queryClient.cancelQueries({ queryKey })),
      );
      const before: [QueryKey, unknown][] = [
        [ascentKey, queryClient.getQueryData(ascentKey)],
        [listKey, queryClient.getQueryData(listKey)],
        ...queryClient.getQueriesData({ queryKey: nearbyKey }),
      ];
      queryClient.setQueryData(ascentKey, (ascent) => ascent && { ...ascent, favourite });
      queryClient.setQueriesData<NearbyAscent[]>({ queryKey: nearbyKey }, (ascents) =>
        ascents?.map((ascent) => (ascent.id === id ? { ...ascent, favourite } : ascent)),
      );
      if (!favourite) {
        queryClient.setQueryData(listKey, (ascents) =>
          ascents?.filter((ascent) => ascent.id !== id),
        );
      }
      return { before };
    },
    onError: (_error, _change, context) => {
      for (const [key, data] of context?.before ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    // A new favourite is listed with what only the API knows of it.
    onSuccess: (_result, { favourite }) =>
      favourite ? queryClient.invalidateQueries({ queryKey: listKey }) : undefined,
  });
}

export type FavouriteToggle = ReturnType<typeof useFavouriteToggle>;
