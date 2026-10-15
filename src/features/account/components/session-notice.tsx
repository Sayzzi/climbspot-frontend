import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { Confirmation } from '@/shared/ui/confirmation';

/** Confirms signing in; says when a session has ended, inviting to sign in again. */
export function SessionNotice() {
  const { t } = useTranslation('account');
  const { expired, session, justSignedIn } = useAuth();

  if (justSignedIn) {
    return (
      // White, to stay legible over the map.
      <Confirmation className="mx-auto mt-2 w-fit bg-white shadow-plate ring-1 ring-pine/15">
        {t('session.signedIn')}
      </Confirmation>
    );
  }
  if (!expired || session) {
    return null;
  }
  return (
    <p role="status" className="bg-signpost/30 px-4 py-2 text-center text-sm">
      {t('session.expired')}{' '}
      <Link to="/sign-in" className="font-semibold underline underline-offset-2">
        {t('signIn.title')}
      </Link>
    </p>
  );
}
