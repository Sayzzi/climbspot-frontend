import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { textInputClassName } from '@/shared/ui/text-input';

const looksLikeEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());

/** Signing in with a link sent by e-mail, or with Google. */
export function SignInForm() {
  const { t } = useTranslation('account');
  const { available, sendMagicLink, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState<'email' | 'failed'>();
  const [sentTo, setSentTo] = useState<string>();
  const inputId = useId();
  const problemId = useId();

  if (!available) {
    return <p className="text-ink-muted">{t('signIn.unavailable')}</p>;
  }

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!looksLikeEmail(email)) {
      setProblem('email');
      return;
    }
    try {
      await sendMagicLink(email.trim());
      setProblem(undefined);
      setSentTo(email.trim());
    } catch {
      setProblem('failed');
    }
  };

  return (
    <div className="flex max-w-sm flex-col gap-6">
      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
        <label htmlFor={inputId} className="font-medium">
          {t('signIn.email')}
        </label>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          aria-invalid={problem === 'email'}
          aria-describedby={problem ? problemId : undefined}
          className={textInputClassName}
        />
        {problem && (
          <p id={problemId} role="alert" className="text-sm text-danger">
            {t(`signIn.problems.${problem}`)}
          </p>
        )}
        <Button type="submit">{t('signIn.sendLink')}</Button>
        {sentTo && (
          <p role="status" className="text-sm text-moss">
            {t('signIn.sent', { email: sentTo })}
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
