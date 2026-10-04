import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { SignedInOnly } from '@/shared/auth';
import { useFlatPace } from '@/shared/pace';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { textInputClassName } from '@/shared/ui/text-input';
import { useFormatters, useUnits } from '@/shared/units';

import { useDeleteMyAccount, useMyAccount, useUpdateMyAccount } from '../api/my-account';
import { AccountDeletion } from './account-deletion';
import { SecuritySection } from './security-section';

/** The signed-in Visitor's account; an invitation to sign in otherwise. */
export function AccountDetails() {
  const { t } = useTranslation('account');
  // Kept here, above the signed-out view, so that the Visitor is told once signed out.
  const deletion = useDeleteMyAccount();

  if (deletion.isSuccess) {
    return (
      <p role="status" className="rounded-lg bg-lichen p-4">
        {t('deletion.done')}
      </p>
    );
  }
  return (
    <SignedInOnly reason={t('account.signedOut')}>
      <Account deletion={deletion} />
    </SignedInOnly>
  );
}

function Account({ deletion }: { readonly deletion: ReturnType<typeof useDeleteMyAccount> }) {
  const { t } = useTranslation('account');
  const account = useMyAccount();

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
      <FlatPace />
      <DisplayNameForm current={account.data.displayName} />
      <SecuritySection />
      <AccountDeletion deletion={deletion} />
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
        className={textInputClassName}
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

/** The Flat Pace, kept with the account; changed in the same place as in the header. */
function FlatPace() {
  const { t } = useTranslation('account');
  const { t: tCommon } = useTranslation();
  const { system } = useUnits();
  const format = useFormatters();
  const { secondsPerKm, openSetting } = useFlatPace();

  return (
    <div className="flex flex-col items-start gap-2 text-sm">
      <dl>
        <dt className="text-ink-muted">{t('account.flatPace')}</dt>
        <dd className="font-medium">
          {secondsPerKm === undefined
            ? t('account.flatPaceUnset')
            : tCommon(`pace.per.${system}`, { pace: format.pace(secondsPerKm) })}
        </dd>
      </dl>
      <Button type="button" variant="secondary" size="sm" onClick={openSetting}>
        {t('account.changeFlatPace')}
      </Button>
    </div>
  );
}
