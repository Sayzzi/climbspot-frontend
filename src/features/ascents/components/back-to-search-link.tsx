import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/shared/ui/button-variants';

export function BackToSearchLink() {
  const { t } = useTranslation('ascents');

  return (
    <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
      {t('detail.backToSearch')}
    </Link>
  );
}
