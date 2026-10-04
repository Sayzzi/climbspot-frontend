import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap, unwrapEmpty } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';
import { leaveFor } from '@/shared/lib/leave-for';

import type { StravaConnection } from '../types';

const connectionQuery = (token: string) =>
  queryOptions({
    queryKey: ['strava-connection', token],
    queryFn: async () => unwrap(apiClient.GET('/strava/connection')),
  });

function useToken() {
  const { session } = useAuth();
  return { signedIn: session !== undefined, token: session?.accessToken ?? '' };
}

/** The signed-in Visitor's Strava Connection; nothing while signed out. */
export function useStravaConnection() {
  const { signedIn, token } = useToken();
  return useQuery({ ...connectionQuery(token), enabled: signedIn });
}

/** Keeps the connection the API answered with, as the one shown. */
function useKeepConnection() {
  const queryClient = useQueryClient();
  const { token } = useToken();
  return (connection: StravaConnection) => {
    queryClient.setQueryData(connectionQuery(token).queryKey, connection);
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
  const keep = useKeepConnection();
  return useMutation({
    mutationFn: (returned: { code: string; state: string }) =>
      unwrap(apiClient.POST('/strava/connection', { body: returned })),
    onSuccess: keep,
  });
}

/** Ends the connection: ClimbSpot erases everything it had from Strava. */
export function useEndStravaConnection() {
  const queryClient = useQueryClient();
  const { token } = useToken();
  return useMutation({
    mutationFn: () => unwrapEmpty(apiClient.DELETE('/strava/connection')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionQuery(token).queryKey }),
  });
}

/**
 * Imports the Recorded Runs started since the latest one. What they change (the Flat
 * Pace, Ascent Times) is fetched again; a lost connection shows as lost.
 */
export function useSyncStrava() {
  const queryClient = useQueryClient();
  const keep = useKeepConnection();
  const { token } = useToken();
  return useMutation({
    mutationFn: () => unwrap(apiClient.POST('/strava/sync')),
    onSuccess: async (connection) => {
      keep(connection);
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== 'strava-connection',
      });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: connectionQuery(token).queryKey }),
  });
}
