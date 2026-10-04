import { useEffect, useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthFailure, useAuth, type AuthenticatorEnrolment } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { textInputClassName } from '@/shared/ui/text-input';

/** At most this many authenticator apps give a Visitor's codes. */
const MAXIMUM_APPS = 2;

/**
 * The second factor: whether it is on, turning it on with an authenticator app, adding a
 * second app in case one is lost, and turning it off.
 */
export function SecondFactorSection() {
  const { t } = useTranslation('account');
  const { session, enrollAuthenticator, authenticatorCount } = useAuth();
  const [enrolment, setEnrolment] = useState<AuthenticatorEnrolment>();
  const [turningOff, setTurningOff] = useState(false);
  const [counted, setApps] = useState<number>();
  const [failed, setFailed] = useState(false);
  const on = session?.secondFactor === 'given';
  const apps = on ? counted : undefined;

  useEffect(() => {
    if (!on) {
      return;
    }
    let current = true;
    void authenticatorCount().then((count) => {
      if (current) setApps(count);
    });
    return () => {
      current = false;
    };
  }, [on, authenticatorCount, enrolment]);

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
      {on && apps === 1 && !enrolment && (
        <>
          <p className="text-sm">{t('secondFactor.addSecondInvite')}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void start()}>
            {t('secondFactor.addSecond')}
          </Button>
        </>
      )}
      {on && apps !== undefined && apps >= MAXIMUM_APPS && (
        <p className="text-sm">{t('secondFactor.twoApps')}</p>
      )}
      {!on && !enrolment && (
        <Button type="button" variant="secondary" size="sm" onClick={() => void start()}>
          {t('secondFactor.turnOn')}
        </Button>
      )}
      {enrolment && (
        <FirstCode
          enrolment={enrolment}
          onDone={() => {
            setEnrolment(undefined);
          }}
        />
      )}
      {on && !enrolment && !turningOff && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setTurningOff(true);
          }}
        >
          {t('secondFactor.turnOff')}
        </Button>
      )}
      {on && turningOff && (
        <TurnOff
          onCancel={() => {
            setTurningOff(false);
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

/** Turning the second factor off, after a code from the app proves it is the Visitor. */
function TurnOff({ onCancel }: { readonly onCancel: () => void }) {
  const { t } = useTranslation('account');
  const { giveSecondFactor, removeAuthenticators } = useAuth();
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<'invalid-code' | 'failed'>();
  const ids = { code: useId(), problem: useId() };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await giveSecondFactor(code.trim());
      await removeAuthenticators();
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
      className="flex flex-col items-start gap-2 rounded-lg bg-lichen p-4"
    >
      <p className="text-sm">{t('secondFactor.turnOffConfirm')}</p>
      <label htmlFor={ids.code} className="text-sm font-medium">
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
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {t('secondFactor.turnOffSubmit')}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {t('deletion.cancel')}
        </Button>
      </div>
    </form>
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
