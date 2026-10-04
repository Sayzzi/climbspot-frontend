import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

/** The signed-in Visitor's Ascent Times on an Ascent, newest first; nothing while signed out. */
export function useMyAscentTimes(ascentId: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['ascents', ascentId, 'my-times', session?.visitorId ?? null],
    queryFn: async ({ signal }) =>
      (
        await unwrap(
          apiClient.GET('/ascents/{id}/my-times', { params: { path: { id: ascentId } }, signal }),
        )
      ).ascentTimes,
    enabled: session !== undefined,
  });
}
