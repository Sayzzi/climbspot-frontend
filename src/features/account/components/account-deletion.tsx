import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';

import type { useDeleteMyAccount } from '../api/my-account';

/** Deletes the signed-in Visitor's account, once they confirm. */
export function AccountDeletion({
  deletion,
}: {
  readonly deletion: ReturnType<typeof useDeleteMyAccount>;
}) {
  const { t } = useTranslation('account');
  const [confirming, setConfirming] = useState(false);
  const headingId = useId();

  const deleteAccount = () => {
    deletion.mutate();
  };

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col items-start gap-3 border-t border-pine/10 pt-6"
    >
      <h2 id={headingId} className="text-lg font-semibold">
        {t('deletion.title')}
      </h2>
      <p className="text-sm text-ink-muted">{t('deletion.explanation')}</p>
      {confirming ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-lichen p-4">
          <p className="font-medium">{t('deletion.confirm')}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={deletion.isPending} onClick={deleteAccount}>
              {t('deletion.yes')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setConfirming(false);
                deletion.reset();
              }}
            >
              {t('deletion.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setConfirming(true);
          }}
        >
          {t('deletion.title')}
        </Button>
      )}
      {deletion.error && <ErrorNotice error={deletion.error} onRetry={deleteAccount} />}
    </section>
  );
}
