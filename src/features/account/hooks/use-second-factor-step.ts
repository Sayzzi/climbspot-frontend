import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAuth } from '@/shared/auth';

/** Wherever a Visitor lands signed in without their second factor's code, they are asked for it. */
export function useSecondFactorStep(): void {
  const { secondFactorPending } = useAuth();
  const onStep = useLocation({ select: (location) => location.pathname === '/second-factor' });
  const navigate = useNavigate();

  useEffect(() => {
    if (secondFactorPending && !onStep) {
      void navigate({ to: '/second-factor', replace: true });
    }
  }, [secondFactorPending, onStep, navigate]);
}
