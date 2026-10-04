import { useEffect, useRef } from 'react';

import { useAuth } from '@/shared/auth';
import { useFlatPace } from '@/shared/pace';

import { useMyAccount, useUpdateMyAccount } from '../api/my-account';

/**
 * Keeps the Flat Pace with the signed-in Visitor's account: once their account arrives,
 * its pace applies, or else the browser's is carried over to it; afterwards, every
 * change the Visitor makes is saved to it. Signed out, the browser keeps the pace.
 */
export function useFlatPaceSync(): void {
  const { session } = useAuth();
  const { data: account } = useMyAccount();
  const { mutate } = useUpdateMyAccount();
  const { secondsPerKm, setSecondsPerKm } = useFlatPace();
  const reconciledFor = useRef<string | undefined>(undefined);
  const previousPace = useRef(secondsPerKm);

  useEffect(() => {
    const changedByVisitor = previousPace.current !== secondsPerKm;
    previousPace.current = secondsPerKm;
    if (!session || !account) {
      return;
    }
    if (reconciledFor.current !== session.accessToken) {
      reconciledFor.current = session.accessToken;
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
    }
  }, [session, account, secondsPerKm, setSecondsPerKm, mutate]);
}
