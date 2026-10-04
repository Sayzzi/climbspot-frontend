import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap, unwrapEmpty } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

import type { AccountChanges } from '../types';

const myAccountQuery = (visitorId: string) =>
  queryOptions({
    queryKey: ['me', visitorId],
    queryFn: async () => unwrap(apiClient.GET('/me')),
  });

/** The signed-in Visitor's account; nothing while signed out. */
export function useMyAccount() {
  const { session } = useAuth();
  return useQuery({
    ...myAccountQuery(session?.visitorId ?? ''),
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
      queryClient.setQueryData(myAccountQuery(session?.visitorId ?? '').queryKey, account);
    },
  });
}

/**
 * Deletes the signed-in Visitor's account and everything kept for it, then signs them
 * out. A refusal changes nothing, and the Visitor stays signed in.
 */
export function useDeleteMyAccount() {
  const { signOut } = useAuth();
  return useMutation({
    mutationFn: () => unwrapEmpty(apiClient.DELETE('/me')),
    onSuccess: () => signOut(),
  });
}
