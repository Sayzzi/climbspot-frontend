import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap, unwrapEmpty } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';
import { leaveFor } from '@/shared/lib/leave-for';

import type { StravaConnection } from '../types';

const CONNECTION = 'strava-connection';

// Keyed by who is signed in: another Visitor never sees this one's connection.
const connectionQuery = (visitorId: string) =>
  queryOptions({
    queryKey: [CONNECTION, visitorId],
    queryFn: async () => unwrap(apiClient.GET('/strava/connection')),
  });

function useVisitor() {
  const { session } = useAuth();
  return { signedIn: session !== undefined, visitorId: session?.visitorId ?? '' };
}

/**
 * Fetches again what Strava feeds, now that the connection changed: the account's
 * Flat Pace, the Ascent Times on Ascents.
 */
function refreshWhatStravaGives(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== CONNECTION });
}

/** The signed-in Visitor's Strava Connection; nothing while signed out. */
export function useStravaConnection() {
  const { signedIn, visitorId } = useVisitor();
  return useQuery({ ...connectionQuery(visitorId), enabled: signedIn });
}

/** Keeps the connection the API answered with, as the one shown, and what it feeds. */
function useConnectionChanged() {
  const queryClient = useQueryClient();
  const { visitorId } = useVisitor();
  return async (connection: StravaConnection) => {
    queryClient.setQueryData(connectionQuery(visitorId).queryKey, connection);
    await refreshWhatStravaGives(queryClient);
  };
}

/** Leaves for Strava's page where the Visitor agrees to the connection. */
export function useAuthorizeStrava() {
  return useMutation({
    mutationFn: async () => {
      const { url } = await unwrap(apiClient.GET('/strava/authorize'));
      leaveFor(url);
    },
  });
}

/** Makes the connection with the code Strava sent the Visitor back with. */
export function useConnectStrava() {
  const changed = useConnectionChanged();
  return useMutation({
    mutationFn: (returned: { code: string; state: string }) =>
      unwrap(apiClient.POST('/strava/connection', { body: returned })),
    onSuccess: changed,
  });
}

/** Ends the connection: ClimbSpot erases everything it had from Strava. */
export function useEndStravaConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrapEmpty(apiClient.DELETE('/strava/connection')),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/**
 * Imports the Recorded Runs started since the latest one. What they change (the Flat
 * Pace, Ascent Times) is fetched again; a lost connection shows as lost.
 */
export function useSyncStrava() {
  const queryClient = useQueryClient();
  const changed = useConnectionChanged();
  const { visitorId } = useVisitor();
  return useMutation({
    mutationFn: () => unwrap(apiClient.POST('/strava/sync')),
    onSuccess: changed,
    onError: () => queryClient.invalidateQueries({ queryKey: connectionQuery(visitorId).queryKey }),
  });
}
