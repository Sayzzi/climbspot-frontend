import { useCallback, useEffect, useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthFailure, useAuth, type AuthFailureReason, type Passkey } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { textInputClassName } from '@/shared/ui/text-input';
import { useFormatters } from '@/shared/units';

/** The passkeys that sign the Visitor in: adding one on this device, naming, removing. */
export function PasskeysSection() {
  const { t } = useTranslation('account');
  const { supportsPasskeys, passkeys, registerPasskey } = useAuth();
  const [listed, setListed] = useState<Passkey[]>();
  const [problem, setProblem] = useState<AuthFailureReason>();

  const reload = useCallback(async () => {
    try {
      setListed(await passkeys());
    } catch (error) {
      setProblem(error instanceof AuthFailure ? error.reason : 'failed');
    }
  }, [passkeys]);

  useEffect(() => {
    let current = true;
    passkeys().then(
      (found) => {
        if (current) setListed(found);
      },
      (error: unknown) => {
        if (current) setProblem(error instanceof AuthFailure ? error.reason : 'failed');
      },
    );
    return () => {
      current = false;
    };
  }, [passkeys]);

  const add = async () => {
    setProblem(undefined);
    try {
      await registerPasskey();
      await reload();
    } catch (error) {
      const reason = error instanceof AuthFailure ? error.reason : 'failed';
      if (reason !== 'passkey-cancelled') {
        setProblem(reason);
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <h3 className="font-semibold">{t('passkeys.title')}</h3>
      <p className="text-sm text-ink-muted">{t('passkeys.explanation')}</p>
      {listed && listed.length > 0 && (
        <ul
          aria-label={t('passkeys.list')}
          className="flex w-full flex-col divide-y divide-pine/10"
        >
          {listed.map((passkey) => (
            <li key={passkey.id}>
              <PasskeyItem passkey={passkey} onChanged={() => void reload()} />
            </li>
          ))}
        </ul>
      )}
      {supportsPasskeys ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => void add()}>
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
  readonly onChanged: () => void;
}

function PasskeyItem({ passkey, onChanged }: PasskeyItemProps) {
  const { t } = useTranslation('account');
  const format = useFormatters();
  const { renamePasskey, removePasskey } = useAuth();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(passkey.name ?? '');
  const inputId = useId();
  const label = passkey.name ?? t('passkeys.unnamed');

  const rename = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim() === '') {
      return;
    }
    await renamePasskey(passkey.id, name.trim());
    setRenaming(false);
    onChanged();
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
          onClick={() => void removePasskey(passkey.id).then(onChanged)}
        >
          {t('passkeys.removeShort')}
        </Button>
      </div>
    </div>
  );
}
