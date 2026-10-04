import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthFailure, useAuth, type AuthFailureReason } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { textInputClassName } from '@/shared/ui/text-input';

import { isKnownLeaked, lengthProblem, type PasswordProblem } from '../password-rules';

type Problem = PasswordProblem | AuthFailureReason;

/**
 * Chooses the signed-in Visitor's password, under the same rules as when creating an
 * account; when Supabase wants proof it is them, asks for the code it sent by e-mail.
 */
export function NewPasswordForm() {
  const { t } = useTranslation('account');
  const { session, updatePassword, requestReauthentication } = useAuth();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [problem, setProblem] = useState<Problem>();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const ids = { password: useId(), hint: useId(), code: useId(), problem: useId() };

  const save = async (withCode?: string) => {
    setPending(true);
    try {
      await updatePassword(password, withCode);
      setSaved(true);
      setNeedsCode(false);
      setProblem(undefined);
    } catch (error) {
      const reason = error instanceof AuthFailure ? error.reason : 'failed';
      if (reason === 'reauthentication-needed') {
        await requestReauthentication();
        setNeedsCode(true);
        setProblem(undefined);
      } else {
        setProblem(reason);
      }
    } finally {
      setPending(false);
    }
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    if (needsCode) {
      await save(code.trim());
      return;
    }
    const tooShortOrLong = lengthProblem(password);
    if (tooShortOrLong) {
      setProblem(tooShortOrLong);
      return;
    }
    setPending(true);
    const leaked = await isKnownLeaked(password);
    setPending(false);
    if (leaked) {
      setProblem('leaked');
      return;
    }
    await save();
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
      {needsCode ? (
        <>
          <p className="text-sm">{t('newPassword.codeSent', { email: session?.email ?? '' })}</p>
          <label htmlFor={ids.code} className="font-medium">
            {t('newPassword.code')}
          </label>
          <input
            id={ids.code}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
            }}
            aria-describedby={problem ? ids.problem : undefined}
            className={textInputClassName}
          />
        </>
      ) : (
        <>
          <label htmlFor={ids.password} className="font-medium">
            {t('newPassword.label')}
          </label>
          <input
            id={ids.password}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            aria-describedby={problem ? `${ids.hint} ${ids.problem}` : ids.hint}
            className={textInputClassName}
          />
          <p id={ids.hint} className="text-sm text-ink-muted">
            {t('signIn.password.hint')}
          </p>
        </>
      )}
      {problem && (
        <p id={ids.problem} role="alert" className="text-sm text-danger">
          {t(`signIn.problems.${problem}`)}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {needsCode ? t('newPassword.confirm') : t('newPassword.save')}
      </Button>
      {saved && (
        <p role="status" className="text-sm text-moss">
          {t('newPassword.saved')}
        </p>
      )}
    </form>
  );
}
