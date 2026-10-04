import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { errorMessageKey } from '@/shared/api/error-message';
import { SignedInOnly } from '@/shared/auth';
import { textLinkClassName } from '@/shared/ui/text-link';

import { useConnectStrava } from '../api/strava';
import type { StravaReturn } from '../strava-return';

/** Where Strava sends the Visitor back: makes the connection, then shows their account. */
export function StravaCallback(returned: StravaReturn) {
  const { t } = useTranslation('strava');
  return (
    <SignedInOnly reason={t('callback.signedOut')}>
      <Connecting {...returned} />
    </SignedInOnly>
  );
}

function Connecting({ code, state, error }: StravaReturn) {
  const { t } = useTranslation('strava');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const connect = useConnectStrava();
  const sent = useRef(false);
  const allowed = error === undefined && code !== undefined && state !== undefined;

  useEffect(() => {
    // A code works once: never send it twice, even when effects run twice.
    if (!allowed || sent.current) {
      return;
    }
    sent.current = true;
    connect.mutate(
      { code, state },
      {
        onSuccess: () => {
          void navigate({ to: '/account', replace: true });
        },
      },
    );
  }, [allowed, code, state, connect, navigate]);

  const backToAccount = (
    <Link to="/account" className={textLinkClassName}>
      {t('callback.back')}
    </Link>
  );

  if (!allowed) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p>{t('callback.denied')}</p>
        {backToAccount}
      </div>
    );
  }
  if (connect.error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="rounded-lg bg-lichen p-4">
          {tCommon(errorMessageKey(connect.error))}
        </p>
        {backToAccount}
      </div>
    );
  }
  return <p className="text-ink-muted">{t('callback.connecting')}</p>;
}
