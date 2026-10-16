import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { MyAscents } from '@/features/ascents';

export const Route = createFileRoute('/my-climbs')({
  component: MyClimbsPage,
});

function MyClimbsPage() {
  const { t } = useTranslation('ascents');
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('mine.title')}</h1>
      <MyAscents />
    </section>
  );
}
