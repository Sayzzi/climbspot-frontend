import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/shared/auth';

/**
 * As a Visitor signs in without their second factor's code, they are asked for it,
 * remembering where they were headed. They may leave the code page: they count as
 * signed out until they come back to it.
 */
export function useSecondFactorStep(): void {
  const { secondFactorPending } = useAuth();
  const location = useLocation({
    select: ({ pathname, href }) => ({
      onStep: pathname === '/second-factor',
      // Signing in leads home: never back to the sign-in page.
      then: pathname === '/sign-in' ? undefined : href,
    }),
  });
  const navigate = useNavigate();
  const wasPending = useRef(false);

  useEffect(() => {
    if (secondFactorPending && !wasPending.current && !location.onStep) {
      void navigate({ to: '/second-factor', search: { then: location.then }, replace: true });
    }
    wasPending.current = secondFactorPending;
  }, [secondFactorPending, location, navigate]);
}
