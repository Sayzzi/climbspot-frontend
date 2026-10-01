import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { errorMessageKey } from '@/shared/api/error-message';
import { MapView, type MapPosition } from '@/shared/map';
import { Button } from '@/shared/ui/button';

import { useNearbyAscents } from '../api/nearby-ascents';
import type { NearbyCriteria, Position } from '../types';
import { AscentListItem } from './ascent-list-item';

/** Where the map opens when the Visitor's position is not known yet (mainland France). */
const OVERVIEW: { center: Position; zoom: number } = {
  center: { latitude: 46.6, longitude: 2.5 },
  zoom: 5,
};

const SEARCH_ZOOM = 11;

interface NearbySearchProps {
  /** Nothing is searched until there is a position. */
  readonly criteria: NearbyCriteria | undefined;
  /** Shown in place of results, e.g. while locating the Visitor. */
  readonly notice?: ReactNode;
  /** The Visitor asked to search around another position. */
  readonly onSearchArea: (center: Position) => void;
}

/** Map and list of the Ascents whose Start is closest to a position. */
export function NearbySearch({ criteria, notice, onSearchArea }: NearbySearchProps) {
  const { t } = useTranslation('ascents');
  const { t: tCommon } = useTranslation();
  const { data: ascents, error, isFetching, refetch } = useNearbyAscents(criteria);
  const [selectedId, setSelectedId] = useState<string>();
  const [movedTo, setMovedTo] = useState<MapPosition>();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="relative">
        <MapView
          label={t('search.map')}
          center={criteria?.position ?? OVERVIEW.center}
          zoom={criteria ? SEARCH_ZOOM : OVERVIEW.zoom}
          markers={(ascents ?? []).map((ascent) => ({
            id: ascent.id,
            position: ascent.start,
            label: ascent.name,
            selected: ascent.id === selectedId,
          }))}
          onMarkerSelect={setSelectedId}
          onAreaChange={setMovedTo}
          className="h-80 lg:sticky lg:top-6 lg:h-[36rem]"
        />
        {movedTo && (
          <Button
            size="sm"
            className="absolute top-3 left-1/2 -translate-x-1/2 shadow-md"
            onClick={() => {
              onSearchArea(movedTo);
              setMovedTo(undefined);
            }}
          >
            {t('search.searchArea')}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4" aria-busy={isFetching}>
        {notice}

        {isFetching && <p className="text-sm text-ink-muted">{t('search.loading')}</p>}

        {error && (
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
        )}

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
