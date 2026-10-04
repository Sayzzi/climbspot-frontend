import { useEffect } from 'react';

import { useAuth } from '@/shared/auth';

import { useSyncStrava } from '../api/strava';

const SYNCED_FOR = 'climbspot.stravaSyncedFor';

/** Who Recorded Runs were last imported for in this browser session, if storage allows. */
function syncedFor(): string | null {
  try {
    return sessionStorage.getItem(SYNCED_FOR);
  } catch {
    return null;
  }
}

function remember(visitorId: string | undefined) {
  try {
    if (visitorId === undefined) {
      sessionStorage.removeItem(SYNCED_FOR);
    } else {
      sessionStorage.setItem(SYNCED_FOR, visitorId);
    }
  } catch {
    // Blocked storage: the next page load imports again, which is harmless.
  }
}

/**
 * Imports new Recorded Runs once as the Visitor signs in: not again when their token
 * is renewed, nor when the page reloads, until they sign in anew. Failures are left
 * for the Synchronise button to tell.
 */
export function useStravaSyncOnSignIn(): void {
  const { session } = useAuth();
  const { mutate } = useSyncStrava();
  const visitorId = session?.visitorId;

  useEffect(() => {
    if (visitorId === undefined) {
      remember(undefined);
      return;
    }
    if (syncedFor() === visitorId) {
      return;
    }
    remember(visitorId);
    mutate();
  }, [visitorId, mutate]);
}
