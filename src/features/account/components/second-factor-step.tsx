import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthFailure, useAuth } from '@/shared/auth';
import { env } from '@/shared/config/env';
import { Button } from '@/shared/ui/button';
import { textInputClassName } from '@/shared/ui/text-input';

const linkClassName = 'font-semibold text-pine underline underline-offset-2';

/**
 * The code of the second factor, after any way of signing in: until it is given, the
 * Visitor counts as signed out.
 */
export function SecondFactorStep() {
  const { t } = useTranslation('account');
  const { session, secondFactorPending, giveSecondFactor, signOut } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<'invalid-code' | 'failed'>();
  const ids = { code: useId(), problem: useId() };

  // Once given (or never needed), the Visitor carries on from the home page.
  useEffect(() => {
    if (session) {
      void navigate({ to: '/', replace: true });
    }
  }, [session, navigate]);

  if (!secondFactorPending) {
    return (
      <Link to="/sign-in" className={linkClassName}>
        {t('signIn.title')}
      </Link>
    );
  }

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await giveSecondFactor(code.trim());
    } catch (error) {
      setProblem(
        error instanceof AuthFailure && error.reason === 'invalid-code' ? 'invalid-code' : 'failed',
      );
    }
  };

  return (
    <div className="flex max-w-sm flex-col gap-6">
      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
        <label htmlFor={ids.code} className="font-medium">
          {t('secondFactor.code')}
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
        {problem && (
          <p id={ids.problem} role="alert" className="text-sm text-danger">
            {t(`signIn.problems.${problem}`)}
          </p>
        )}
        <Button type="submit">{t('secondFactor.continue')}</Button>
      </form>
      <p className="text-sm text-ink-muted">
        {t('secondFactor.lost')}
        {env.VITE_SUPPORT_EMAIL && (
          <>
            {' '}
            <a href={`mailto:${env.VITE_SUPPORT_EMAIL}`} className={linkClassName}>
              {env.VITE_SUPPORT_EMAIL}
            </a>
          </>
        )}
      </p>
      <Button
        type="button"
        variant="ghost"
        className="self-start"
        onClick={() => {
          void signOut().then(() => navigate({ to: '/' }));
        }}
      >
        {t('menu.signOut')}
      </Button>
    </div>
  );
}
