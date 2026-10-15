import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { MapView, type MapOverlay } from '@/shared/map';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { Tabs, type Tab } from '@/shared/ui/tabs';
import { plateClassName } from '@/shared/ui/plate';

import { useNearbyAscents } from '../api/nearby-ascents';
import type { NearbyAscent, NearbyCriteria, Position } from '../types';
import { AscentLink, AscentListItem } from './ascent-list-item';

/** Where the map opens when the Visitor's position is not known yet (mainland France). */
const OVERVIEW: { center: Position; zoom: number } = {
  center: { latitude: 46.6, longitude: 2.5 },
  zoom: 5,
};

const SEARCH_ZOOM = 11;

/** Where the home page's actions move the focus: the map, or the search panel. */
export const SEARCH_MAP_ID = 'search-map';
export const SEARCH_PANEL_ID = 'search-panel';

interface NearbySearchProps {
  /** Nothing is searched until there is a position. */
  readonly criteria: NearbyCriteria | undefined;
  /** Content of the Filters tab. */
  readonly filters: ReactNode;
  /** Shown above the results, e.g. while locating the Visitor. */
  readonly notice?: ReactNode;
  /** The Visitor asked to search around another position. */
  readonly onSearchArea: (center: Position) => void;
  /** The welcome screen is over the map: neither the map nor the panel takes input. */
  readonly behindWelcome: boolean;
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
  behindWelcome,
  extraTabs = [],
}: NearbySearchProps) {
  const { t } = useTranslation('ascents');
  const { data: ascents, error, isFetching, refetch } = useNearbyAscents(criteria);
  const [selectedId, setSelectedId] = useState<string>();
  const [movedTo, setMovedTo] = useState<Position>();
  const selected = ascents?.find((ascent) => ascent.id === selectedId);
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
        <div className="flex flex-col items-start gap-3 rounded-md bg-lichen p-4">
          <div>
            <p className="font-semibold">{t('search.empty.title')}</p>
            <p className="text-sm text-ink-muted">{t('search.empty.hint')}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setActiveTab('filters');
            }}
          >
            {t('search.empty.changeFilters')}
          </Button>
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
    // Behind the welcome screen, nothing here takes the focus or the pointer.
    <div inert={behindWelcome} className="fixed inset-0">
      {/* The welcome screen has its own title; the map and panel need one too. */}
      {!behindWelcome && <h1 className="sr-only">{t('search.title')}</h1>}
      <MapView
        id={SEARCH_MAP_ID}
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
        {...(overlay?.alternatives && { alternatives: overlay.alternatives })}
        {...(overlay?.dashedLine && { dashedLine: overlay.dashedLine })}
        {...(overlay?.onMapClick && { onMapClick: overlay.onMapClick })}
        onMarkerSelect={setSelectedId}
        onAreaChange={setMovedTo}
        interactive={!behindWelcome}
        covered={panelCover()}
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
        id={SEARCH_PANEL_ID}
        tabIndex={-1}
        aria-label={t('search.panel')}
        className={cn(
          // Above the map's own controls (attribution, zoom).
          plateClassName,
          'absolute inset-x-0 bottom-0 z-10 flex max-h-[55vh] flex-col overflow-hidden rounded-b-none',
          'lg:inset-x-auto lg:top-20 lg:bottom-auto lg:left-4 lg:max-h-[calc(100vh-6rem)] lg:w-[24rem] lg:rounded-b-md',
          // Comes up as the welcome screen goes.
          'transition-[opacity,translate] duration-300 ease-out',
          behindWelcome && 'translate-y-4 opacity-0',
        )}
      >
        <Tabs
          label={t('search.panel')}
          tabs={[
            { id: 'ascents', label: t('search.tabs.ascents'), content: results },
            { id: 'filters', label: t('search.tabs.filters'), content: filters },
            ...extraTabs,
          ]}
          selected={activeTab}
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
      className={cn(
        plateClassName,
        'absolute inset-x-4 top-32 z-10 flex items-center justify-between gap-3 p-3 lg:top-auto lg:right-4 lg:bottom-6 lg:left-[26rem]',
      )}
    >
      <p id={titleId} className="font-display text-lg font-semibold">
        {ascent.name}
      </p>
      <AscentLink ascent={ascent} />
    </section>
  );
}

/**
 * What the search panel and the header cover of the map: a column on the left on wide
 * screens, the lower part of the screen on phones (as the panel's classes lay it out).
 */
function panelCover() {
  const wide =
    typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches;
  return wide ? { top: 64, left: 416 } : { top: 64, bottom: Math.round(window.innerHeight * 0.55) };
}
