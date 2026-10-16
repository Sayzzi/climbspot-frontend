import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

/** The climbs the signed-in Visitor went up, the latest run first; nothing signed out. */
export function useAscentsRun() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['ascents', 'run', session?.visitorId ?? null],
    queryFn: async ({ signal }) =>
      (await unwrap(apiClient.GET('/ascents/my-times', { signal }))).ascents,
    enabled: session !== undefined,
  });
}
