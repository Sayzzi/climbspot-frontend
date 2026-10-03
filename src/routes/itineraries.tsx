import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { MyItineraries } from '@/features/itineraries';

export const Route = createFileRoute('/itineraries')({
  component: MyItinerariesPage,
});

function MyItinerariesPage() {
  const { t } = useTranslation('itineraries');
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('saved.title')}</h1>
      <MyItineraries />
    </section>
  );
}
