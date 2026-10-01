import 'maplibre-gl/dist/maplibre-gl.css';

import { setWorkerUrl } from 'maplibre-gl';
// MapLibre locates its worker relative to its own file, which breaks once Vite has
// bundled it; let Vite bundle the worker (and the module it imports) and say where.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layer,
  Map,
  Marker,
  Source,
  type LngLatBoundsLike,
  type MapRef,
} from 'react-map-gl/maplibre';

import { cn } from '@/shared/lib/cn';
import type { Position } from '@/shared/lib/position';

import type { MapMarker, MapViewProps } from './types';

setWorkerUrl(maplibreWorkerUrl);

/** OpenFreeMap vector style: free, no API key. */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const markerTones: Record<NonNullable<MapMarker['tone']>, string> = {
  default: 'bg-brand-600',
  start: 'bg-start',
  top: 'bg-brand-800',
};

/** The only component allowed to know about the map library. */
export function MapView({
  label,
  center,
  zoom,
  fitTo,
  markers = [],
  line,
  onMarkerSelect,
  onAreaChange,
  className,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const routeColour = useThemeColour('--color-route');

  // Read once: later changes go through `flyTo` below.
  const [initialViewState] = useState(() => {
    const bounds = boundsOf(fitTo);
    return bounds
      ? { bounds, fitBoundsOptions: { padding: 48 } }
      : { latitude: center.latitude, longitude: center.longitude, zoom };
  });

  // Follow later centre changes (e.g. once the Visitor has been located).
  useEffect(() => {
    if (!fitTo) {
      mapRef.current?.flyTo({ center: [center.longitude, center.latitude], zoom });
    }
  }, [center.latitude, center.longitude, zoom, fitTo]);

  const lineData = useMemo(
    () =>
      line && {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: line.map(({ longitude, latitude }) => [longitude, latitude]),
        },
      },
    [line],
  );

  return (
    <section aria-label={label} className={cn('overflow-hidden rounded-xl', className)}>
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onMoveEnd={(event) => {
          // Only moves made by the Visitor carry the DOM event that caused them;
          // `flyTo` and framing do not, so they never offer to search that area.
          if (event.originalEvent) {
            onAreaChange?.({
              latitude: event.viewState.latitude,
              longitude: event.viewState.longitude,
            });
          }
        }}
      >
        {lineData && (
          <Source id="line" type="geojson" data={lineData}>
            <Layer
              id="line"
              type="line"
              paint={{ 'line-color': routeColour, 'line-width': 5 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </Source>
        )}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.position.latitude}
            longitude={marker.position.longitude}
            anchor="bottom"
          >
            <button
              type="button"
              aria-label={marker.label}
              aria-pressed={marker.selected ?? false}
              onClick={() => onMarkerSelect?.(marker.id)}
              className={cn(
                'size-4 rounded-full border-2 border-white shadow-md transition-transform',
                markerTones[marker.tone ?? 'default'],
                marker.selected && 'scale-150',
              )}
            />
          </Marker>
        ))}
      </Map>
    </section>
  );
}

/** A colour token from the theme, for drawing APIs that cannot use utility classes. */
function useThemeColour(token: string): string {
  const [colour] = useState(() =>
    getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
  );
  return colour;
}

function boundsOf(positions: readonly Position[] | undefined): LngLatBoundsLike | undefined {
  if (!positions || positions.length === 0) {
    return undefined;
  }
  const latitudes = positions.map((position) => position.latitude);
  const longitudes = positions.map((position) => position.longitude);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}
