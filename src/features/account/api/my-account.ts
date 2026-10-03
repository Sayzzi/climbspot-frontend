import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

import type { AccountChanges } from '../types';

const myAccountQuery = (token: string) =>
  queryOptions({
    queryKey: ['me', token],
    queryFn: async () => unwrap(apiClient.GET('/me')),
  });

/** The signed-in Visitor's account; nothing while signed out. */
export function useMyAccount() {
  const { session } = useAuth();
  return useQuery({
    ...myAccountQuery(session?.accessToken ?? ''),
    enabled: session !== undefined,
  });
}

/** Changes the signed-in Visitor's display name or Flat Pace. */
export function useUpdateMyAccount() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (changes: AccountChanges) =>
      unwrap(apiClient.PATCH('/me', { body: changes })),
    onSuccess: (account) => {
      queryClient.setQueryData(myAccountQuery(session?.accessToken ?? '').queryKey, account);
    },
  });
}
