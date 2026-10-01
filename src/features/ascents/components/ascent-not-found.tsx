import { useTranslation } from 'react-i18next';

import { BackToSearch } from './back-to-search';

export function AscentNotFound() {
  const { t } = useTranslation('ascents');
  const { t: tCommon } = useTranslation();

  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">{t('detail.notFound')}</h1>
      <p className="text-ink-muted">{tCommon('errors.ASCENT_NOT_FOUND')}</p>
      <BackToSearch variant="secondary" />
    </section>
  );
}
