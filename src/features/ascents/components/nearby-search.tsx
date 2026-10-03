import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { prefersReducedMotion } from '@/shared/hooks/use-scroll-progress';
import { cn } from '@/shared/lib/cn';
import { MapView, type MapOverlay } from '@/shared/map';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { Tabs, type Tab } from '@/shared/ui/tabs';

import { useNearbyAscents } from '../api/nearby-ascents';
import type { NearbyAscent, NearbyCriteria, Position } from '../types';
import { AscentLink, AscentListItem } from './ascent-list-item';

/** Where the map opens when the Visitor's position is not known yet (mainland France). */
const OVERVIEW: { center: Position; zoom: number } = {
  center: { latitude: 46.6, longitude: 2.5 },
  zoom: 5,
};

const SEARCH_ZOOM = 11;

/** Above this share of the reveal, the map takes gestures and the panel is fully shown. */
const REVEALED = 0.98;

interface NearbySearchProps {
  /** Nothing is searched until there is a position. */
  readonly criteria: NearbyCriteria | undefined;
  /** Content of the Filters tab. */
  readonly filters: ReactNode;
  /** Shown above the results, e.g. while locating the Visitor. */
  readonly notice?: ReactNode;
  /** The Visitor asked to search around another position. */
  readonly onSearchArea: (center: Position) => void;
  /** How far the map has been revealed, from 0 (behind the page's title) to 1. */
  readonly reveal: number;
  /** More tabs for the panel; each may add markers, a line and clicks to the map while open. */
  readonly extraTabs?: readonly (Tab & { readonly mapOverlay?: MapOverlay })[];
}

/**
 * Full-screen map of the Ascents whose Start is closest to a position, with the
 * results and filters in a tabbed panel over it.
 */
export function NearbySearch({
  criteria,
  filters,
  notice,
  onSearchArea,
  reveal,
  extraTabs = [],
}: NearbySearchProps) {
  const { t } = useTranslation('ascents');
  const { data: ascents, error, isFetching, refetch } = useNearbyAscents(criteria);
  const [selectedId, setSelectedId] = useState<string>();
  const [movedTo, setMovedTo] = useState<Position>();
  const selected = ascents?.find((ascent) => ascent.id === selectedId);
  const revealed = reveal >= REVEALED;
  const panelReveal = Math.max(0, reveal * 2 - 1);
  const [activeTab, setActiveTab] = useState('ascents');
  const overlay = extraTabs.find((tab) => tab.id === activeTab)?.mapOverlay;

  // Without a position, searching the visible area is the way forward, moved or not.
  const areaToSearch = movedTo ?? (criteria ? undefined : OVERVIEW.center);

  const results = (
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
        <div className="rounded-lg bg-lichen p-4">
          <p className="font-semibold">{t('search.empty.title')}</p>
          <p className="text-sm text-ink-muted">{t('search.empty.hint')}</p>
        </div>
      )}
      {ascents && ascents.length > 0 && (
        <ul aria-label={t('search.results')} className="flex flex-col divide-y divide-pine/10">
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
  );

  return (
    <div className="fixed inset-0">
      <MapView
        label={t('search.map')}
        center={criteria?.position ?? OVERVIEW.center}
        zoom={criteria ? SEARCH_ZOOM : OVERVIEW.zoom}
        markers={[
          ...(ascents ?? []).map((ascent) => ({
            id: ascent.id,
            position: ascent.start,
            label: ascent.name,
            selected: ascent.id === selectedId,
          })),
          ...(overlay?.markers ?? []),
        ]}
        {...(overlay?.line && { line: overlay.line })}
        {...(overlay?.onMapClick && { onMapClick: overlay.onMapClick })}
        onMarkerSelect={setSelectedId}
        onAreaChange={setMovedTo}
        interactive={revealed}
        // Zoom buttons sit below the floating header (beating MapLibre's own stylesheet).
        className="size-full rounded-none [&_.maplibregl-ctrl-top-right]:top-16!"
      />

      {areaToSearch && (
        <Button
          size="sm"
          className="absolute top-20 left-1/2 z-10 -translate-x-1/2"
          onClick={() => {
            onSearchArea(areaToSearch);
            setMovedTo(undefined);
          }}
        >
          {t('search.searchArea')}
        </Button>
      )}

      {selected && <SelectedAscent ascent={selected} />}

      <aside
        aria-label={t('search.panel')}
        // Keyboard users tabbing into the panel get the map revealed for them.
        onFocus={() => {
          if (!revealed) {
            window.scrollTo({
              top: window.innerHeight,
              behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            });
          }
        }}
        style={{
          opacity: panelReveal,
          transform: prefersReducedMotion()
            ? undefined
            : `translateY(${String((1 - panelReveal) * 16)}px)`,
        }}
        className={cn(
          // Above the map's own controls (attribution, zoom).
          'absolute inset-x-0 bottom-0 z-10 flex max-h-[55vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl',
          'lg:inset-x-auto lg:top-20 lg:bottom-auto lg:left-4 lg:max-h-[calc(100vh-6rem)] lg:w-[24rem] lg:rounded-xl',
        )}
      >
        <Tabs
          label={t('search.panel')}
          tabs={[
            { id: 'ascents', label: t('search.tabs.ascents'), content: results },
            { id: 'filters', label: t('search.tabs.filters'), content: filters },
            ...extraTabs,
          ]}
          onSelect={setActiveTab}
        />
      </aside>
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
      className="absolute inset-x-4 top-32 z-10 flex items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-lg lg:top-auto lg:right-4 lg:bottom-6 lg:left-[26rem]"
    >
      <p id={titleId} className="font-display text-lg font-semibold">
        {ascent.name}
      </p>
      <AscentLink ascent={ascent} />
    </section>
  );
}
