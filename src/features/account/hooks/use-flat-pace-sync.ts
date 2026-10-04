import { useEffect, useRef } from 'react';

import { useAuth } from '@/shared/auth';
import { useFlatPace } from '@/shared/pace';

import { useMyAccount, useUpdateMyAccount } from '../api/my-account';
import type { Account } from '../types';

/**
 * Keeps the Flat Pace with the signed-in Visitor's account: once their account arrives,
 * its pace applies, or else the browser's is carried over to it; afterwards, every
 * change the Visitor makes is saved to it, and every change of the account's (a new
 * pace from Strava, going back to it) applies; a pace from Strava goes when Strava's
 * does. Signed out, the browser keeps the pace.
 */
export function useFlatPaceSync(): void {
  const { session } = useAuth();
  const { data: account } = useMyAccount();
  const { mutate } = useUpdateMyAccount();
  const { secondsPerKm, setSecondsPerKm, clearSecondsPerKm } = useFlatPace();
  // Once per Visitor, not per token: tokens are renewed about every hour.
  const reconciledFor = useRef<string | undefined>(undefined);
  const previousPace = useRef(secondsPerKm);
  const previousAccount = useRef<Account | undefined>(undefined);

  useEffect(() => {
    const changedByVisitor = previousPace.current !== secondsPerKm;
    previousPace.current = secondsPerKm;
    if (!session || !account) {
      return;
    }
    const before = previousAccount.current;
    previousAccount.current = account;
    if (reconciledFor.current !== session.visitorId) {
      reconciledFor.current = session.visitorId;
      if (account.flatPace !== null) {
        previousPace.current = account.flatPace;
        setSecondsPerKm(account.flatPace);
      } else if (secondsPerKm !== undefined) {
        mutate({ flatPace: secondsPerKm });
      }
      return;
    }
    if (changedByVisitor && secondsPerKm !== undefined && secondsPerKm !== account.flatPace) {
      mutate({ flatPace: secondsPerKm });
      return;
    }
    if (before?.flatPace === account.flatPace) {
      return;
    }
    if (account.flatPace !== null) {
      if (account.flatPace !== secondsPerKm) {
        previousPace.current = account.flatPace;
        setSecondsPerKm(account.flatPace);
      }
    } else if (before?.flatPaceSource === 'strava' && secondsPerKm === before.flatPace) {
      previousPace.current = undefined;
      clearSecondsPerKm();
    }
  }, [session, account, secondsPerKm, setSecondsPerKm, clearSecondsPerKm, mutate]);
}
