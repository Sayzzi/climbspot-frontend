import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap, unwrapEmpty } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';

import type { Proposal, SavedItinerary, SavedItinerarySummary } from '../types';
import { proposalWithPairs } from './with-pairs';

// Keyed by who is signed in: another Visitor signing in never sees these.
const savedKey = (token: string) => ['saved-itineraries', token] as const;

const savedListQuery = (token: string) =>
  queryOptions({
    queryKey: [...savedKey(token), 'list'],
    queryFn: async (): Promise<SavedItinerarySummary[]> =>
      (await unwrap(apiClient.GET('/saved-itineraries'))).savedItineraries,
  });

const savedItineraryQuery = (token: string, id: string) =>
  queryOptions({
    queryKey: [...savedKey(token), id],
    queryFn: async (): Promise<SavedItinerary> => {
      const saved = await unwrap(
        apiClient.GET('/saved-itineraries/{id}', { params: { path: { id } } }),
      );
      return { ...saved, proposal: proposalWithPairs(saved.proposal) as Proposal };
    },
  });

function useVisitor() {
  const { session } = useAuth();
  return { signedIn: session !== undefined, token: session?.visitorId ?? '' };
}

/** The signed-in Visitor's Saved Itineraries, newest first; nothing while signed out. */
export function useSavedItineraries() {
  const { signedIn, token } = useVisitor();
  return useQuery({ ...savedListQuery(token), enabled: signedIn });
}

/** One of the signed-in Visitor's Saved Itineraries, with its proposal. */
export function useSavedItinerary(id: string | undefined) {
  const { signedIn, token } = useVisitor();
  return useQuery({ ...savedItineraryQuery(token, id ?? ''), enabled: signedIn && !!id });
}

function useSavedItinerariesChange<T>(change: (variables: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  const { token } = useVisitor();
  return useMutation({
    mutationFn: change,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedKey(token) }),
  });
}

/** Saves a copy of a proposal under a name. */
export const useSaveItinerary = () =>
  useSavedItinerariesChange((saving: { name: string; proposal: Proposal }) =>
    unwrap(apiClient.POST('/saved-itineraries', { body: saving })),
  );

export const useRenameSavedItinerary = () =>
  useSavedItinerariesChange(({ id, name }: { id: string; name: string }) =>
    unwrap(
      apiClient.PATCH('/saved-itineraries/{id}', { params: { path: { id } }, body: { name } }),
    ),
  );

export const useDeleteSavedItinerary = () =>
  useSavedItinerariesChange((id: string) =>
    unwrapEmpty(apiClient.DELETE('/saved-itineraries/{id}', { params: { path: { id } } })),
  );
