import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthFailure, useAuth, type AuthenticatorEnrolment } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { textInputClassName } from '@/shared/ui/text-input';

/** The second factor: whether it is on, and turning it on with an authenticator app. */
export function SecondFactorSection() {
  const { t } = useTranslation('account');
  const { session, enrollAuthenticator } = useAuth();
  const [enrolment, setEnrolment] = useState<AuthenticatorEnrolment>();
  const [failed, setFailed] = useState(false);
  const on = session?.secondFactor === 'given';

  const start = async () => {
    setFailed(false);
    try {
      setEnrolment(await enrollAuthenticator());
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <h3 className="font-semibold">{t('secondFactor.title')}</h3>
      <p className="text-sm font-medium">{on ? t('secondFactor.on') : t('secondFactor.off')}</p>
      <p className="text-sm text-ink-muted">
        {on ? t('secondFactor.onExplanation') : t('secondFactor.offExplanation')}
      </p>
      {!on && !enrolment && (
        <Button type="button" variant="secondary" size="sm" onClick={() => void start()}>
          {t('secondFactor.turnOn')}
        </Button>
      )}
      {!on && enrolment && (
        <FirstCode
          enrolment={enrolment}
          onDone={() => {
            setEnrolment(undefined);
          }}
        />
      )}
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t('signIn.problems.failed')}
        </p>
      )}
    </div>
  );
}

interface FirstCodeProps {
  readonly enrolment: AuthenticatorEnrolment;
  readonly onDone: () => void;
}

/** Scanning the QR code, or typing the key, then proving the app works with a first code. */
function FirstCode({ enrolment, onDone }: FirstCodeProps) {
  const { t } = useTranslation('account');
  const { verifyAuthenticator } = useAuth();
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<'invalid-code' | 'failed'>();
  const ids = { code: useId(), problem: useId() };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await verifyAuthenticator(enrolment.factorId, code.trim());
      onDone();
    } catch (error) {
      setProblem(
        error instanceof AuthFailure && error.reason === 'invalid-code' ? 'invalid-code' : 'failed',
      );
    }
  };

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col items-start gap-2 rounded-lg bg-white p-4"
    >
      <p className="text-sm">{t('secondFactor.scan')}</p>
      <img src={enrolment.qrCode} alt={t('secondFactor.qrCode')} className="size-44" />
      <p className="text-sm">
        {t('secondFactor.key')}{' '}
        <code className="rounded bg-lichen px-1.5 py-0.5 font-mono break-all">
          {enrolment.secret}
        </code>
      </p>
      <label htmlFor={ids.code} className="mt-2 text-sm font-medium">
        {t('secondFactor.firstCode')}
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
      <Button type="submit" size="sm">
        {t('secondFactor.confirm')}
      </Button>
    </form>
  );
}
