import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

// Keyed by who is signed in: another Visitor signing in never sees these.
const ascentsWithMyTimesQuery = (visitorId: string) =>
  queryOptions({
    queryKey: ['ascents', 'with-my-times', visitorId],
    queryFn: async ({ signal }) =>
      (await unwrap(apiClient.GET('/ascents/my-times', { signal }))).ascents,
  });

/** The climbs the signed-in Visitor went up, the latest run first; nothing signed out. */
export function useAscentsWithMyTimes() {
  const { session } = useAuth();
  return useQuery({
    ...ascentsWithMyTimesQuery(session?.visitorId ?? ''),
    enabled: session !== undefined,
  });
}
