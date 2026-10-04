import { useEffect, useRef } from 'react';

import { useAuth } from '@/shared/auth';

import { useSyncStrava } from '../api/strava';

/**
 * Imports new Recorded Runs once per session, as the Visitor signs in: their data stays
 * current without asking. Failures are left for the Synchronise button to tell.
 */
export function useStravaSyncOnSignIn(): void {
  const { session } = useAuth();
  const { mutate } = useSyncStrava();
  const syncedFor = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!session || syncedFor.current === session.accessToken) {
      return;
    }
    syncedFor.current = session.accessToken;
    mutate();
  }, [session, mutate]);
}
