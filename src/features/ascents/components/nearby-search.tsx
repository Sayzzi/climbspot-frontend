import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { errorMessageKey } from '@/shared/api/error-message';
import { MapView } from '@/shared/map';
import { Button } from '@/shared/ui/button';

import { useNearbyAscents } from '../api/nearby-ascents';
import type { NearbyCriteria } from '../types';
import { AscentListItem } from './ascent-list-item';

interface NearbySearchProps {
  readonly criteria: NearbyCriteria;
}

/** Map and list of the Ascents whose Start is closest to a position. */
export function NearbySearch({ criteria }: NearbySearchProps) {
  const { t } = useTranslation('ascents');
  const { t: tCommon } = useTranslation();
  const { data: ascents, error, isFetching, refetch } = useNearbyAscents(criteria);
  const [selectedId, setSelectedId] = useState<string>();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <MapView
        label={t('search.map')}
        center={criteria.position}
        markers={(ascents ?? []).map((ascent) => ({
          id: ascent.id,
          position: ascent.start,
          label: ascent.name,
          selected: ascent.id === selectedId,
        }))}
        onMarkerSelect={setSelectedId}
        className="h-80 lg:sticky lg:top-6 lg:h-[36rem]"
      />

      <div className="flex flex-col gap-4" aria-busy={isFetching}>
        {isFetching && <p className="text-sm text-ink-muted">{t('search.loading')}</p>}

        {error ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-brand-50 p-4">
            <p>{tCommon(errorMessageKey(error))}</p>
            <Button
              variant="secondary"
              onClick={() => {
                void refetch();
              }}
            >
              {tCommon('actions.retry')}
            </Button>
          </div>
        ) : null}

        {ascents?.length === 0 && (
          <div className="rounded-xl bg-brand-50 p-4">
            <p className="font-medium">{t('search.empty.title')}</p>
            <p className="text-sm text-ink-muted">{t('search.empty.hint')}</p>
          </div>
        )}

        {ascents && ascents.length > 0 && (
          <ul aria-label={t('search.results')} className="flex flex-col gap-3">
            {ascents.map((ascent) => (
              <AscentListItem
                key={ascent.id}
                ascent={ascent}
                selected={ascent.id === selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
