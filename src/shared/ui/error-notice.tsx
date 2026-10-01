import { useTranslation } from 'react-i18next';

import { errorMessageKey } from '@/shared/api/error-message';

import { Button } from './button';

interface ErrorNoticeProps {
  readonly error: unknown;
  readonly onRetry: () => void;
  /** Extra actions shown next to "Try again". */
  readonly children?: React.ReactNode;
}

/** Explains a failure in the Visitor's language and offers to retry. */
export function ErrorNotice({ error, onRetry, children }: ErrorNoticeProps) {
  const { t } = useTranslation();

  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-brand-50 p-4">
      <p>{t(errorMessageKey(error))}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
        {children}
      </div>
    </div>
  );
}
