import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
        {t('app.tagline')}
      </p>
      <h1 className="text-4xl font-bold tracking-tight">{t('home.title')}</h1>
      <p className="text-lg text-ink-muted">{t('home.description')}</p>
    </section>
  );
}
