import 'maplibre-gl/dist/maplibre-gl.css';

import { useMemo } from 'react';
import { Layer, Map, Marker, Source, type LngLatBoundsLike } from 'react-map-gl/maplibre';

import { cn } from '@/shared/lib/cn';

import type { MapMarker, MapPosition, MapViewProps } from './types';

/** OpenFreeMap vector style: free, no API key. */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const DEFAULT_CENTER: MapPosition = { latitude: 46.5, longitude: 2.5 };
const DEFAULT_ZOOM = 11;

const markerTones: Record<NonNullable<MapMarker['tone']>, string> = {
  default: 'bg-brand-600',
  start: 'bg-emerald-600',
  top: 'bg-brand-800',
};

/** The only component allowed to know about the map library. */
export function MapView({
  label,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  fitTo,
  markers = [],
  line,
  onMarkerSelect,
  onAreaChange,
  className,
}: MapViewProps) {
  const initialViewState = useMemo(() => {
    const bounds = boundsOf(fitTo);
    return bounds
      ? { bounds, fitBoundsOptions: { padding: 48 } }
      : { latitude: center.latitude, longitude: center.longitude, zoom };
    // The initial view is only read when the map mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        initialViewState={initialViewState}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onMoveEnd={(event) => {
          onAreaChange?.({
            latitude: event.viewState.latitude,
            longitude: event.viewState.longitude,
          });
        }}
      >
        {lineData && (
          <Source id="line" type="geojson" data={lineData}>
            <Layer
              id="line"
              type="line"
              paint={{ 'line-color': '#c2410c', 'line-width': 5 }}
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

function boundsOf(positions: readonly MapPosition[] | undefined): LngLatBoundsLike | undefined {
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
