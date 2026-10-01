import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { NearbySearch } from '@/features/ascents';

/** The search lives in the URL so it can be shared and survives a refresh. */
const searchSchema = z.object({
  latitude: z.number().min(-90).max(90).optional().catch(undefined),
  longitude: z.number().min(-180).max(180).optional().catch(undefined),
});

export const Route = createFileRoute('/')({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { t } = useTranslation('ascents');
  const { latitude, longitude } = Route.useSearch();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('search.title')}</h1>
      {latitude !== undefined && longitude !== undefined && (
        <NearbySearch criteria={{ position: { latitude, longitude } }} />
      )}
    </section>
  );
}
