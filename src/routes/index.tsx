import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { LocateNotice, NearbySearch, type Position } from '@/features/ascents';
import { useCurrentPosition } from '@/shared/lib/geolocation';

/** The search lives in the URL so it can be shared and survives a refresh. */
const searchSchema = z.object({
  latitude: z.number().min(-90).max(90).optional().catch(undefined),
  longitude: z.number().min(-180).max(180).optional().catch(undefined),
});

export const Route = createFileRoute('/')({
  validateSearch: searchSchema,
  component: SearchPage,
});

/** ~10 m: enough for a search, and keeps shared URLs short. */
const round = (degrees: number) => Math.round(degrees * 10_000) / 10_000;

function SearchPage() {
  const { t } = useTranslation('ascents');
  const navigate = useNavigate({ from: Route.fullPath });
  const { latitude, longitude } = Route.useSearch();
  const position =
    latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined;

  const located = useCurrentPosition(position === undefined);

  const searchAround = (center: Position, replace = false) => {
    void navigate({
      search: (previous) => ({
        ...previous,
        latitude: round(center.latitude),
        longitude: round(center.longitude),
      }),
      replace,
    });
  };

  useEffect(() => {
    if (located.status === 'located' && position === undefined) {
      // Replace the position-less entry: going back should not ask for the location again.
      searchAround(located.position, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the browser answers
  }, [located]);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('search.title')}</h1>
      <NearbySearch
        criteria={position && { position }}
        notice={position ? undefined : <LocateNotice state={located} />}
        onSearchArea={searchAround}
      />
    </section>
  );
}
