import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthFailure, useAuth, type AuthFailureReason, type Passkey } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { textInputClassName } from '@/shared/ui/text-input';
import { useFormatters } from '@/shared/units';

import { usePasskeyChange, usePasskeys } from '../api/security';

/** What a passkey failure tells the Visitor; closing the prompt tells nothing. */
const problemOf = (error: unknown): AuthFailureReason | undefined => {
  if (!error) {
    return undefined;
  }
  const reason = error instanceof AuthFailure ? error.reason : 'failed';
  return reason === 'passkey-cancelled' ? undefined : reason;
};

/** The passkeys that sign the Visitor in: adding one on this device, naming, removing. */
export function PasskeysSection() {
  const { t } = useTranslation('account');
  const { supportsPasskeys, registerPasskey, renamePasskey, removePasskey } = useAuth();
  const listed = usePasskeys();
  const add = usePasskeyChange(registerPasskey);
  const rename = usePasskeyChange(({ id, name }: { id: string; name: string }) =>
    renamePasskey(id, name),
  );
  const remove = usePasskeyChange(removePasskey);
  const problem = problemOf(listed.error ?? add.error ?? rename.error ?? remove.error);

  return (
    <div className="flex flex-col items-start gap-2">
      <h3 className="font-semibold">{t('passkeys.title')}</h3>
      <p className="text-sm text-ink-muted">{t('passkeys.explanation')}</p>
      {listed.data && listed.data.length > 0 && (
        <ul
          aria-label={t('passkeys.list')}
          className="flex w-full flex-col divide-y divide-pine/10"
        >
          {listed.data.map((passkey) => (
            <li key={passkey.id}>
              <PasskeyItem
                passkey={passkey}
                onRename={(name) => rename.mutateAsync({ id: passkey.id, name })}
                onRemove={() => {
                  remove.mutate(passkey.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}
      {supportsPasskeys ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={add.isPending}
          onClick={() => {
            add.mutate(undefined);
          }}
        >
          {t('passkeys.add')}
        </Button>
      ) : (
        <p className="text-sm">{t('passkeys.unsupported')}</p>
      )}
      {problem && (
        <p role="alert" className="text-sm text-danger">
          {t(`signIn.problems.${problem}`)}
        </p>
      )}
    </div>
  );
}

interface PasskeyItemProps {
  readonly passkey: Passkey;
  readonly onRename: (name: string) => Promise<unknown>;
  readonly onRemove: () => void;
}

function PasskeyItem({ passkey, onRename, onRemove }: PasskeyItemProps) {
  const { t } = useTranslation('account');
  const format = useFormatters();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(passkey.name ?? '');
  const inputId = useId();
  const label = passkey.name ?? t('passkeys.unnamed');

  const rename = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim() === '') {
      return;
    }
    try {
      await onRename(name.trim());
      setRenaming(false);
    } catch {
      // The section says what went wrong; the name stays to try again.
    }
  };

  if (renaming) {
    return (
      <form
        noValidate
        onSubmit={(event) => void rename(event)}
        className="flex flex-col items-start gap-2 py-2"
      >
        <label htmlFor={inputId} className="text-sm font-medium">
          {t('passkeys.name')}
        </label>
        <input
          id={inputId}
          value={name}
          maxLength={120}
          onChange={(event) => {
            setName(event.target.value);
          }}
          className={textInputClassName}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            {t('account.save')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setRenaming(false);
            }}
          >
            {t('deletion.cancel')}
          </Button>
        </div>
      </form>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-ink-muted">
          {t('passkeys.added', { date: format.date(passkey.createdAt) })}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('passkeys.rename', { name: label })}
          onClick={() => {
            setRenaming(true);
          }}
        >
          {t('passkeys.renameShort')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('passkeys.remove', { name: label })}
          onClick={onRemove}
        >
          {t('passkeys.removeShort')}
        </Button>
      </div>
    </div>
  );
}
