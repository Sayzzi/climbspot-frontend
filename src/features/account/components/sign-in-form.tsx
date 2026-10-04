import { useNavigate } from '@tanstack/react-router';
import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthFailure, useAuth, type AuthFailureReason } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { textInputClassName } from '@/shared/ui/text-input';

import { isKnownLeaked, lengthProblem, type PasswordProblem } from '../password-rules';

const looksLikeEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());

/** Signing in by a link, or with a password (creating an account with one), or with Google. */
type Mode = 'link' | 'password' | 'create';

type Problem = 'email' | 'linkFailed' | PasswordProblem | AuthFailureReason;

/** Signing in with a link sent by e-mail, a password, or Google; or creating an account. */
export function SignInForm() {
  const { t } = useTranslation('account');
  const {
    available,
    sendMagicLink,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    sendPasswordReset,
  } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<Problem>();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ email: string; kind: 'link' | 'confirmation' | 'reset' }>();
  const ids = { email: useId(), password: useId(), hint: useId(), problem: useId() };

  if (!available) {
    return <p className="text-ink-muted">{t('signIn.unavailable')}</p>;
  }

  const switchTo = (next: Mode) => {
    setMode(next);
    setProblem(undefined);
    setSent(undefined);
  };

  const signedIn = () => {
    void navigate({ to: '/' });
  };

  /** Runs `work`, telling what went wrong in the Visitor's terms. */
  const attempt = async (work: () => Promise<void>) => {
    setPending(true);
    try {
      await work();
    } catch (error) {
      setProblem(error instanceof AuthFailure ? error.reason : 'failed');
    } finally {
      setPending(false);
    }
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    if (!looksLikeEmail(address)) {
      setProblem('email');
      return;
    }
    setProblem(undefined);
    if (mode === 'link') {
      try {
        await sendMagicLink(address);
        setSent({ email: address, kind: 'link' });
      } catch {
        setProblem('linkFailed');
      }
      return;
    }
    if (mode === 'password') {
      await attempt(async () => {
        await signInWithPassword(address, password);
        signedIn();
      });
      return;
    }
    const tooShortOrLong = lengthProblem(password);
    if (tooShortOrLong) {
      setProblem(tooShortOrLong);
      return;
    }
    await attempt(async () => {
      if (await isKnownLeaked(password)) {
        setProblem('leaked');
        return;
      }
      if ((await signUp(address, password)) === 'signed-in') {
        signedIn();
      } else {
        setSent({ email: address, kind: 'confirmation' });
      }
    });
  };

  const sendReset = async () => {
    const address = email.trim();
    if (!looksLikeEmail(address)) {
      setProblem('email');
      return;
    }
    setProblem(undefined);
    await attempt(async () => {
      await sendPasswordReset(address);
      setSent({ email: address, kind: 'reset' });
    });
  };

  const creating = mode === 'create';

  return (
    <div className="flex max-w-sm flex-col gap-6">
      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
        <label htmlFor={ids.email} className="font-medium">
          {t('signIn.email')}
        </label>
        <input
          id={ids.email}
          type="email"
          autoComplete={creating ? 'email' : 'username'}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          aria-invalid={problem === 'email'}
          aria-describedby={problem ? ids.problem : undefined}
          className={textInputClassName}
        />

        {mode !== 'link' && (
          <>
            <label htmlFor={ids.password} className="mt-2 font-medium">
              {creating ? t('signIn.password.choose') : t('signIn.password.label')}
            </label>
            <input
              id={ids.password}
              type="password"
              autoComplete={creating ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              aria-describedby={
                [creating ? ids.hint : undefined, problem ? ids.problem : undefined]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              className={textInputClassName}
            />
            {creating && (
              <p id={ids.hint} className="text-sm text-ink-muted">
                {t('signIn.password.hint')}
              </p>
            )}
          </>
        )}

        {problem && (
          <p id={ids.problem} role="alert" className="text-sm text-danger">
            {t(`signIn.problems.${problem}`)}
          </p>
        )}

        {mode === 'link' && (
          <>
            <Button type="submit">{t('signIn.sendLink')}</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                switchTo('password');
              }}
            >
              {t('signIn.password.continue')}
            </Button>
          </>
        )}
        {mode === 'password' && (
          <>
            <Button type="submit" disabled={pending}>
              {t('signIn.password.signIn')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => void sendReset()}>
              {t('signIn.password.forgot')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                switchTo('create');
              }}
            >
              {t('signIn.password.create')}
            </Button>
          </>
        )}
        {creating && (
          <>
            <Button type="submit" disabled={pending}>
              {t('signIn.password.createSubmit')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                switchTo('password');
              }}
            >
              {t('signIn.password.haveAccount')}
            </Button>
          </>
        )}

        {sent && (
          <p role="status" className="text-sm text-moss">
            {t(
              (
                {
                  link: 'signIn.sent',
                  confirmation: 'signIn.password.confirm',
                  reset: 'signIn.password.resetSent',
                } as const
              )[sent.kind],
              { email: sent.email },
            )}
          </p>
        )}
      </form>
      <div className="flex flex-col gap-2">
        <p className="text-center text-sm text-ink-muted">{t('signIn.or')}</p>
        <Button type="button" variant="secondary" onClick={() => void signInWithGoogle()}>
          {t('signIn.google')}
        </Button>
      </div>
    </div>
  );
}
