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

/** Shows its content to a signed-in Visitor, and invites anyone else to sign in. */
export function SignedInOnly({ reason, children }: SignedInOnlyProps) {
  const { t } = useTranslation();
  const { session } = useAuth();

  if (session) {
    return children;
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
