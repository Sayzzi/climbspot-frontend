import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { StravaCallback, stravaReturnSchema } from '@/features/strava';

export const Route = createFileRoute('/strava/callback')({
  validateSearch: stravaReturnSchema,
  component: StravaCallbackPage,
});

function StravaCallbackPage() {
  const { t } = useTranslation('strava');
  const returned = Route.useSearch();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('callback.title')}</h1>
      <StravaCallback {...returned} />
    </section>
  );
}
