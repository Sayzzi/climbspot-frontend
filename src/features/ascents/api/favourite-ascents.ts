import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrapEmpty } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

import { ascentQuery } from './ascent';

/**
 * Makes an Ascent one of the signed-in Visitor's Favourite Ascents, or takes it out: the
 * page shows the change at once, and goes back if the API refuses it.
 */
export function useFavouriteToggle(ascentId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { queryKey } = ascentQuery(ascentId, session?.visitorId);

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
      await queryClient.cancelQueries({ queryKey });
      const before = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (ascent) => ascent && { ...ascent, favourite });
      return { before };
    },
    onError: (_error, _favourite, context) => {
      if (context?.before) {
        queryClient.setQueryData(queryKey, context.before);
      }
    },
  });
}

export type FavouriteToggle = ReturnType<typeof useFavouriteToggle>;
