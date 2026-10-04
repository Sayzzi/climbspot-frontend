import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/shared/ui/button-variants';

import { useAuth } from './use-auth';

interface SignedInOnlyProps {
  /** Why signing in is needed, shown to a Visitor who is not signed in. */
  readonly reason: string;
  readonly children: ReactNode;
}

/**
 * Shows its content to a signed-in Visitor; invites anyone else to sign in, or to
 * finish signing in with their second factor's code.
 */
export function SignedInOnly({ reason, children }: SignedInOnlyProps) {
  const { t } = useTranslation();
  const { session, secondFactorPending } = useAuth();

  if (session) {
    return children;
  }
  if (secondFactorPending) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-3 rounded-lg bg-lichen p-4">
        <p>{t('actions.finishSigningIn')}</p>
        <Link to="/second-factor" className={buttonVariants()}>
          {t('actions.enterCode')}
        </Link>
      </div>
    );
  }
  return (
    <div className="flex max-w-xl flex-col items-start gap-3 rounded-lg bg-lichen p-4">
      <p>{reason}</p>
      <Link to="/sign-in" className={buttonVariants()}>
        {t('actions.signIn')}
      </Link>
    </div>
  );
}
