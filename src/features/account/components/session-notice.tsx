import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { Confirmation } from '@/shared/ui/confirmation';

/** Says when a session has ended, inviting to sign in again. */
export function SessionNotice() {
  const { t } = useTranslation('account');
  const { expired, session } = useAuth();

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

/**
 * Confirms signing in for a few seconds, at the foot of the screen: the top belongs to
 * the header and the map's own buttons.
 */
export function SignedInConfirmation() {
  const { t } = useTranslation('account');
  const { justSignedIn } = useAuth();

  if (!justSignedIn) {
    return null;
  }
  return (
    // White, to stay legible over the map.
    <Confirmation className="fixed bottom-6 left-1/2 z-30 w-max -translate-x-1/2 bg-white shadow-plate ring-1 ring-pine/15">
      {t('session.signedIn')}
    </Confirmation>
  );
}
