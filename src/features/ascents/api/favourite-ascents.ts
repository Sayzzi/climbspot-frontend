import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap, unwrapEmpty } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

import type { FavouriteAscent, NearbyAscent } from '../types';
import { ascentQuery } from './ascent';
import { keepsFavouritesOnly, nearbyKey } from './nearby-ascents';

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
 * back if the API refuses. A search of favourites only keeps a climb taken out, its star
 * empty, until it is searched again: the Visitor can change their mind, and keeps their
 * place.
 */
export function useFavouriteToggle() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const visitorId = session?.visitorId;
  const listKey = favouritesQuery(visitorId ?? '').queryKey;

  /** Shows a change on every cached view of the Ascent. */
  const show = ({ id, favourite }: FavouriteChange) => {
    queryClient.setQueryData(
      ascentQuery(id, visitorId).queryKey,
      (ascent) => ascent && { ...ascent, favourite },
    );
    queryClient.setQueriesData<NearbyAscent[]>({ queryKey: nearbyKey(visitorId) }, (ascents) =>
      ascents?.map((ascent) => (ascent.id === id ? { ...ascent, favourite } : ascent)),
    );
    if (!favourite) {
      queryClient.setQueryData(listKey, (ascents) => ascents?.filter((ascent) => ascent.id !== id));
    }
  };

  return useMutation({
    mutationFn: ({ id, favourite }: FavouriteChange) => {
      const params = { params: { path: { id } } };
      return unwrapEmpty(
        favourite
          ? apiClient.PUT('/ascents/{id}/favourite', params)
          : apiClient.DELETE('/ascents/{id}/favourite', params),
      );
    },
    // Searches still loading are left to finish: the change is shown on them once settled.
    onMutate: async (change) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ascentQuery(change.id, visitorId).queryKey }),
        queryClient.cancelQueries({ queryKey: listKey }),
      ]);
      show(change);
    },
    // Undo this change only: another one may be on its way for another Ascent.
    onError: (_error, { id, favourite }) => {
      show({ id, favourite: !favourite });
    },
    onSettled: (_result, error, change) => {
      // A search that was loading may have answered from before the change.
      if (!error) {
        show(change);
      }
      // What only the API knows: a new favourite's place in the lists, or one put back.
      return error || change.favourite
        ? Promise.all([
            queryClient.invalidateQueries({ queryKey: listKey }),
            queryClient.invalidateQueries({
              queryKey: nearbyKey(visitorId),
              predicate: (query) => keepsFavouritesOnly(query.queryKey),
            }),
          ])
        : undefined;
    },
  });
}

export type FavouriteToggle = ReturnType<typeof useFavouriteToggle>;
