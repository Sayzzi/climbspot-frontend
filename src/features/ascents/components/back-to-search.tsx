import { Link, useCanGoBack, useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/shared/ui/button-variants';

/** Returns to the previous search when there is one, or to the search page. */
export function BackToSearch() {
  const { t } = useTranslation('ascents');
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const className = buttonVariants({ variant: 'ghost', size: 'sm' });

  return canGoBack ? (
    <button
      type="button"
      className={className}
      onClick={() => {
        router.history.back();
      }}
    >
      {t('detail.backToSearch')}
    </button>
  ) : (
    <Link to="/" className={className}>
      {t('detail.backToSearch')}
    </Link>
  );
}
