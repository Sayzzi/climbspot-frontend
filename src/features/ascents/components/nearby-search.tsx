import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { MapView } from '@/shared/map';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';

import { useNearbyAscents } from '../api/nearby-ascents';
import type { NearbyAscent, NearbyCriteria, Position } from '../types';
import { AscentLink, AscentListItem } from './ascent-list-item';

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
  const { data: ascents, error, isFetching, refetch } = useNearbyAscents(criteria);
  const [selectedId, setSelectedId] = useState<string>();
  const [movedTo, setMovedTo] = useState<Position>();
  const selected = ascents?.find((ascent) => ascent.id === selectedId);

  // Without a position, searching the visible area is the way forward, moved or not.
  const areaToSearch = movedTo ?? (criteria ? undefined : OVERVIEW.center);

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
        {areaToSearch && (
          <Button
            size="sm"
            className="absolute top-3 left-1/2 -translate-x-1/2 shadow-md"
            onClick={() => {
              onSearchArea(areaToSearch);
              setMovedTo(undefined);
            }}
          >
            {t('search.searchArea')}
          </Button>
        )}
        {selected && <SelectedAscent ascent={selected} />}
      </div>

      <div className="flex flex-col gap-4" aria-busy={isFetching}>
        {notice}

        {isFetching && <p className="text-sm text-ink-muted">{t('search.loading')}</p>}

        {error && (
          <ErrorNotice
            error={error}
            onRetry={() => {
              void refetch();
            }}
          />
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

/** Card over the map for the Ascent selected there, so it can be opened from the map. */
function SelectedAscent({ ascent }: { readonly ascent: NearbyAscent }) {
  const { t } = useTranslation('ascents');
  const titleId = useId();

  return (
    <section
      aria-label={t('search.selected')}
      aria-describedby={titleId}
      className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-lg"
    >
      <p id={titleId} className="font-semibold">
        {ascent.name}
      </p>
      <AscentLink ascent={ascent} />
    </section>
  );
}
