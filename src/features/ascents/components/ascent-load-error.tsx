import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { errorMessageKey } from '@/shared/api/error-message';
import { Button } from '@/shared/ui/button';

import { BackToSearchLink } from './back-to-search-link';

export function AscentLoadError({ error }: { readonly error: unknown }) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <section role="alert" className="flex flex-col items-start gap-4">
      <p>{t(errorMessageKey(error))}</p>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            void router.invalidate();
          }}
        >
          {t('actions.retry')}
        </Button>
        <BackToSearchLink />
      </div>
    </section>
  );
}
