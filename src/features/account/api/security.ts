import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/shared/auth';

/** How many authenticator apps give the signed-in Visitor's codes, once their second factor is on. */
export function useAuthenticatorCount() {
  const { session, authenticatorCount } = useAuth();
  return useQuery({
    queryKey: ['authenticators', session?.visitorId ?? ''],
    queryFn: authenticatorCount,
    enabled: session?.secondFactor === 'given',
  });
}

/** Counts the authenticator apps again, e.g. after adding one. */
export function useRecountAuthenticators() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['authenticators'] });
}

/** The signed-in Visitor's passkeys. */
export function usePasskeys() {
  const { session, passkeys } = useAuth();
  return useQuery({
    queryKey: ['passkeys', session?.visitorId ?? ''],
    queryFn: passkeys,
    enabled: session !== undefined,
  });
}

/** A change to the signed-in Visitor's passkeys, the list fetched again after it. */
export function usePasskeyChange<T>(change: (variables: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: change,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['passkeys'] }),
  });
}
