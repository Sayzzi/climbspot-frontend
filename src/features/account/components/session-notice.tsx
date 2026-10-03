import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';

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
