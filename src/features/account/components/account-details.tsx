import { Link } from '@tanstack/react-router';
import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';

import { useMyAccount, useUpdateMyAccount } from '../api/my-account';

/** The signed-in Visitor's account; an invitation to sign in otherwise. */
export function AccountDetails() {
  const { t } = useTranslation('account');
  const { session } = useAuth();
  const account = useMyAccount();

  if (!session) {
    return (
      <p className="text-ink-muted">
        {t('account.signedOut')}{' '}
        <Link to="/sign-in" className="font-semibold text-pine underline underline-offset-2">
          {t('signIn.title')}
        </Link>
      </p>
    );
  }
  if (account.error) {
    return <ErrorNotice error={account.error} onRetry={() => void account.refetch()} />;
  }
  if (!account.data) {
    return <p className="text-ink-muted">{t('account.loading')}</p>;
  }
  return (
    <div className="flex max-w-md flex-col gap-6">
      <dl className="text-sm">
        <dt className="text-ink-muted">{t('account.email')}</dt>
        <dd className="font-medium">{account.data.email}</dd>
      </dl>
      <DisplayNameForm current={account.data.displayName} />
    </div>
  );
}

function DisplayNameForm({ current }: { readonly current: string }) {
  const { t } = useTranslation('account');
  const update = useUpdateMyAccount();
  const [name, setName] = useState(current);
  const inputId = useId();

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    update.mutate({ displayName: name });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="font-medium">
        {t('account.displayName')}
      </label>
      <input
        id={inputId}
        value={name}
        maxLength={60}
        onChange={(event) => {
          setName(event.target.value);
        }}
        className="rounded-md border border-pine/25 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-pine"
      />
      <Button type="submit" size="sm" disabled={update.isPending} className="self-start">
        {t('account.save')}
      </Button>
      {update.isSuccess && (
        <p role="status" className="text-sm text-moss">
          {t('account.saved')}
        </p>
      )}
      {update.error && (
        <ErrorNotice
          error={update.error}
          onRetry={() => {
            update.mutate({ displayName: name });
          }}
        />
      )}
    </form>
  );
}
