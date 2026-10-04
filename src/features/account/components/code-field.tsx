import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { AuthFailureReason } from '@/shared/auth';
import { textInputClassName } from '@/shared/ui/text-input';

interface CodeFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (code: string) => void;
  readonly problem?: AuthFailureReason | undefined;
}

/** A one-time code, from an authenticator app or an e-mail, with what was wrong with the last one. */
export function CodeField({ label, value, onChange, problem }: CodeFieldProps) {
  const { t } = useTranslation('account');
  const ids = { code: useId(), problem: useId() };

  return (
    <>
      <label htmlFor={ids.code} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={ids.code}
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        aria-describedby={problem ? ids.problem : undefined}
        className={textInputClassName}
      />
      {problem && (
        <p id={ids.problem} role="alert" className="text-sm text-danger">
          {t(`signIn.problems.${problem}`)}
        </p>
      )}
    </>
  );
}
