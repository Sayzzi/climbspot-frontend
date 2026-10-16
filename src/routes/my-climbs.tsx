import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { MyAscents } from '@/features/ascents';
import { useStravaConnection } from '@/features/strava';

export const Route = createFileRoute('/my-climbs')({
  component: MyClimbsPage,
});

function MyClimbsPage() {
  const { t } = useTranslation('ascents');
  const strava = useStravaConnection();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('mine.title')}</h1>
      <MyAscents
        stravaConnected={strava.data === undefined ? undefined : strava.data.status === 'connected'}
      />
    </section>
  );
}
