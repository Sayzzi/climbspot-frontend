import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiRequestError } from '@/shared/api/request';
import { useAuth } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { ConnectWithStrava, PoweredByStrava } from '@/shared/ui/strava-brand';

import {
  useAuthorizeStrava,
  useEndStravaConnection,
  useStravaConnection,
  useSyncStrava,
} from '../api/strava';
import type { StravaConnection } from '../types';

/** The signed-in Visitor's Strava Connection, on their Account page; nothing otherwise. */
export function StravaSection() {
  const { t } = useTranslation('strava');
  const { session } = useAuth();
  const headingId = useId();

  if (!session) {
    return null;
  }
  return (
    <section
      aria-labelledby={headingId}
      className="flex max-w-md flex-col items-start gap-3 border-t border-pine/10 pt-6"
    >
      <h2 id={headingId} className="text-lg font-semibold">
        {t('title')}
      </h2>
      <Connection />
    </section>
  );
}

function Connection() {
  const { t } = useTranslation('strava');
  const connection = useStravaConnection();

  if (connection.error) {
    return <ErrorNotice error={connection.error} onRetry={() => void connection.refetch()} />;
  }
  if (!connection.data) {
    return <p className="text-sm text-ink-muted">{t('loading')}</p>;
  }
  switch (connection.data.status) {
    case 'none':
      return <NotConnected />;
    case 'lost':
      return <Lost />;
    case 'connected':
      return <Connected connection={connection.data} />;
  }
}

function NotConnected() {
  const { t } = useTranslation('strava');
  return (
    <>
      <p className="text-sm text-ink-muted">{t('explanation')}</p>
      <Connect />
    </>
  );
}

/** The Visitor withdrew ClimbSpot at Strava: they may connect again, or end it here. */
function Lost() {
  const { t } = useTranslation('strava');
  return (
    <>
      <p className="text-sm font-medium">{t('lost')}</p>
      <Connect />
      <EndConnection />
    </>
  );
}

function Connect() {
  const authorize = useAuthorizeStrava();
  return (
    <>
      <ConnectWithStrava
        disabled={authorize.isPending}
        onClick={() => {
          authorize.mutate();
        }}
      />
      {authorize.error && (
        <ErrorNotice
          error={authorize.error}
          onRetry={() => {
            authorize.mutate();
          }}
        />
      )}
    </>
  );
}

function Connected({ connection }: { readonly connection: StravaConnection }) {
  const { t } = useTranslation('strava');

  return (
    <>
      <p className="text-sm font-medium">
        {t('connectedAs', { name: connection.athlete?.name ?? '' })}
      </p>
      <PoweredByStrava />
      <Synchronise connection={connection} />
      <EndConnection />
    </>
  );
}

function Synchronise({ connection }: { readonly connection: StravaConnection }) {
  const { t, i18n } = useTranslation('strava');
  const sync = useSyncStrava();
  const lastSync =
    connection.lastSyncAt &&
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
      new Date(connection.lastSyncAt),
    );
  // Strava down or its limits reached: nothing to retry now, the import carries on later.
  const unavailable =
    sync.error instanceof ApiRequestError && sync.error.code === 'STRAVA_UNAVAILABLE';

  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-ink-muted">
        {t('sync.state', { count: connection.recordedRuns })}
        {lastSync && ` · ${t('sync.last', { date: lastSync })}`}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={sync.isPending}
        onClick={() => {
          sync.mutate();
        }}
      >
        {sync.isPending ? t('sync.pending') : t('sync.action')}
      </Button>
      {unavailable && (
        <p role="alert" className="rounded-lg bg-lichen p-3 text-sm">
          {t('sync.unavailable')}
        </p>
      )}
      {sync.error && !unavailable && (
        <ErrorNotice
          error={sync.error}
          onRetry={() => {
            sync.mutate();
          }}
        />
      )}
    </div>
  );
}

function EndConnection() {
  const { t } = useTranslation('strava');
  const end = useEndStravaConnection();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          setConfirming(true);
        }}
      >
        {t('end.action')}
      </Button>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg bg-lichen p-4">
      <p className="text-sm font-medium">{t('end.confirm')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={end.isPending}
          onClick={() => {
            end.mutate();
          }}
        >
          {t('end.yes')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setConfirming(false);
            end.reset();
          }}
        >
          {t('end.cancel')}
        </Button>
      </div>
      {end.error && (
        <ErrorNotice
          error={end.error}
          onRetry={() => {
            end.mutate();
          }}
        />
      )}
    </div>
  );
}
