import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth, type AuthFailureReason } from '@/shared/auth';
import { env } from '@/shared/config/env';
import { Button } from '@/shared/ui/button';
import { textLinkClassName } from '@/shared/ui/text-link';

import { codeProblemOf } from '../code-problem';
import { CodeField } from './code-field';

/**
 * The code of the second factor, after any way of signing in: until it is given, the
 * Visitor counts as signed out.
 */
export function SecondFactorStep({ then }: { readonly then?: string | undefined }) {
  const { t } = useTranslation('account');
  const { session, secondFactorPending, giveSecondFactor, signOut } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<AuthFailureReason>();

  // Once given (or never needed), the Visitor carries on where they were headed.
  useEffect(() => {
    if (session) {
      void navigate({ href: withinApp(then) ?? '/', replace: true });
    }
  }, [session, then, navigate]);

  if (!secondFactorPending) {
    return (
      <Link to="/sign-in" className={textLinkClassName}>
        {t('signIn.title')}
      </Link>
    );
  }

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await giveSecondFactor(code.trim());
    } catch (error) {
      setProblem(codeProblemOf(error));
    }
  };

  return (
    <div className="flex max-w-sm flex-col gap-6">
      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
        <CodeField
          label={t('secondFactor.code')}
          value={code}
          onChange={setCode}
          problem={problem}
        />
        <Button type="submit">{t('secondFactor.continue')}</Button>
      </form>
      <p className="text-sm text-ink-muted">
        {t('secondFactor.lost')}
        {env.VITE_SUPPORT_EMAIL && (
          <>
            {' '}
            <a href={`mailto:${env.VITE_SUPPORT_EMAIL}`} className={textLinkClassName}>
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

/** `then` when it leads to a page of this app, never elsewhere. */
function withinApp(then: string | undefined): string | undefined {
  return then?.startsWith('/') && !then.startsWith('//') ? then : undefined;
}
