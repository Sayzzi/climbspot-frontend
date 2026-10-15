import 'maplibre-gl/dist/maplibre-gl.css';

import * as maplibre from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
// MapLibre locates its worker relative to its own file, which breaks once Vite has
// bundled it; let Vite bundle the worker (and the module it imports) and say where.
// The map is then given this very instance (`mapLib`), not a separately bundled copy.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layer,
  Map,
  Marker,
  NavigationControl,
  Source,
  type LngLatBoundsLike,
  type MapRef,
} from 'react-map-gl/maplibre';

import { prefersReducedMotion } from '@/shared/hooks/prefers-reduced-motion';
import { cn } from '@/shared/lib/cn';
import type { Position } from '@/shared/lib/position';

import { loadBaliseStyle } from './map-style';
import type { MapMarker, MapViewProps } from './types';

maplibre.setWorkerUrl(maplibreWorkerUrl);

/**
 * OpenFreeMap's tiles stop at zoom 14; beyond, the map stretches their simplified
 * shapes, and roads drift metres away from routes drawn on the real ways. Zoom 16 is
 * the closest view before that shows.
 */
const MAX_ZOOM = 16;

/** How long an itinerary takes to trace itself along its path. */
const TRACE_MS = 700;

/** Climbs are marked with waymarks; where an itinerary starts, with a plain dot. */
const markerLooks: Record<NonNullable<MapMarker['tone']>, string> = {
  // A red-and-white waymark plate, as painted on long-distance trails.
  waymark:
    'h-3.5 w-[18px] rounded-[3px] border-2 border-pine bg-[linear-gradient(var(--color-white)_0_50%,var(--color-blaze)_50%)]',
  start: 'size-4 rounded-full border-[3px] border-white bg-start',
};

/** The only component allowed to know about the map library. */
export function MapView(props: MapViewProps) {
  const style = useBaliseStyle();
  if (!style) {
    return (
      <section
        id={props.id}
        tabIndex={-1}
        aria-label={props.label}
        className={cn('overflow-hidden rounded-xl bg-lichen', props.className)}
      />
    );
  }
  // Mounted once the style is there, so that it opens on the view asked for by then.
  return <StyledMap {...props} style={style} />;
}

function StyledMap({
  id,
  label,
  center,
  zoom,
  fitTo,
  markers = [],
  line: newLine,
  alternatives,
  dashedLine,
  onMarkerSelect,
  onAreaChange,
  onMapClick,
  interactive = true,
  covered,
  className,
  style,
}: MapViewProps & { readonly style: StyleSpecification | string }) {
  const mapRef = useRef<MapRef>(null);
  const routeColour = useThemeColour('--color-route');
  // The same path, recomputed by a page that re-renders, is not a new line.
  const line = useSamePositions(newLine);
  const traced = useTrace(line);

  // Read once: later changes go through `flyTo` below.
  const [initialViewState] = useState(() => {
    const bounds = boundsOf(fitTo);
    return bounds
      ? { bounds, fitBoundsOptions: { padding: 48 } }
      : { latitude: center.latitude, longitude: center.longitude, zoom };
  });

  // Frame each new line (an itinerary just chosen), clear of what covers the map.
  useEffect(() => {
    const bounds = boundsOf(line);
    if (!bounds || fitTo) {
      return;
    }
    const margin = 48;
    mapRef.current?.fitBounds(bounds, {
      padding: {
        top: margin + (covered?.top ?? 0),
        right: margin + (covered?.right ?? 0),
        bottom: margin + (covered?.bottom ?? 0),
        left: margin + (covered?.left ?? 0),
      },
      maxZoom: 15,
      duration: prefersReducedMotion() ? 0 : 800,
    });
    // Only a new line is framed, not every change of what covers the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, fitTo]);

  // Follow later centre changes (e.g. once the Visitor has been located).
  useEffect(() => {
    if (!fitTo) {
      mapRef.current?.flyTo({ center: [center.longitude, center.latitude], zoom });
    }
  }, [center.latitude, center.longitude, zoom, fitTo]);

  // Let the page take scroll and drag gestures until the map is meant to be used.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }
    for (const handler of [map.scrollZoom, map.dragPan, map.touchZoomRotate, map.doubleClickZoom]) {
      if (interactive) {
        handler.enable();
      } else {
        handler.disable();
      }
    }
  }, [interactive]);

  const lineData = useMemo(
    () =>
      traced && {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: traced.map(({ longitude, latitude }) => [longitude, latitude]),
        },
      },
    [traced],
  );

  const dashedData = useMemo(
    () =>
      dashedLine && {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: dashedLine.map(({ longitude, latitude }) => [longitude, latitude]),
        },
      },
    [dashedLine],
  );

  const alternativesData = useMemo(
    () =>
      alternatives &&
      alternatives.length > 0 && {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'MultiLineString' as const,
          coordinates: alternatives.map((other) =>
            other.map(({ longitude, latitude }) => [longitude, latitude]),
          ),
        },
      },
    [alternatives],
  );

  return (
    <section
      id={id}
      tabIndex={-1}
      aria-label={label}
      // The map's keys (arrows, + and −) listen on its canvas: focus goes there.
      onFocus={(event) => {
        if (event.target === event.currentTarget) {
          mapRef.current?.getCanvas().focus();
        }
      }}
      className={cn('overflow-hidden rounded-xl', className)}
    >
      <Map
        ref={mapRef}
        mapLib={maplibre}
        // The page keeps the scroll wheel: zooming takes Ctrl/⌘ + scroll, or two fingers.
        cooperativeGestures
        initialViewState={initialViewState}
        maxZoom={MAX_ZOOM}
        mapStyle={style}
        style={{ width: '100%', height: '100%' }}
        onLoad={(event) => {
          if (!interactive) {
            event.target.scrollZoom.disable();
            event.target.dragPan.disable();
            event.target.touchZoomRotate.disable();
            event.target.doubleClickZoom.disable();
          }
        }}
        onClick={(event) => {
          onMapClick?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
        }}
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
        <NavigationControl position="top-right" showCompass={false} />
        {alternativesData && (
          <Source id="alternatives" type="geojson" data={alternativesData}>
            <Layer
              id="alternatives"
              type="line"
              paint={{ 'line-color': routeColour, 'line-width': 4, 'line-opacity': 0.35 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </Source>
        )}
        {dashedData && (
          <Source id="dashed" type="geojson" data={dashedData}>
            <Layer
              id="dashed"
              type="line"
              paint={{ 'line-color': routeColour, 'line-width': 3, 'line-dasharray': [2, 1.5] }}
              layout={{ 'line-join': 'round' }}
            />
          </Source>
        )}
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
            anchor="center"
          >
            {/* A 44 px target around a small mark. */}
            <button
              type="button"
              aria-label={marker.label}
              aria-pressed={marker.selected ?? false}
              onClick={() => onMarkerSelect?.(marker.id)}
              className="group grid size-11 cursor-pointer place-items-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-pine"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'block shadow-waymark transition-transform duration-200 group-hover:scale-125',
                  markerLooks[marker.tone ?? 'waymark'],
                  marker.selected && 'scale-150 group-hover:scale-150',
                )}
              />
            </button>
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

/** `positions`, kept as the same array for as long as they are the same positions. */
function useSamePositions(
  positions: readonly Position[] | undefined,
): readonly Position[] | undefined {
  const [kept, setKept] = useState(positions);
  if (positions !== kept && !samePositions(positions, kept)) {
    setKept(positions);
    return positions;
  }
  return kept;
}

function samePositions(
  a: readonly Position[] | undefined,
  b: readonly Position[] | undefined,
): boolean {
  return (
    a?.length === b?.length &&
    (a ?? []).every(
      (position, index) =>
        position.latitude === b?.[index]?.latitude && position.longitude === b[index].longitude,
    )
  );
}

/** The Balise map style, once loaded; nothing until then. */
function useBaliseStyle(): StyleSpecification | string | undefined {
  const [style, setStyle] = useState<StyleSpecification | string>();
  useEffect(() => {
    let current = true;
    void loadBaliseStyle().then((loaded) => {
      if (current) setStyle(loaded);
    });
    return () => {
      current = false;
    };
  }, []);
  return style;
}

/**
 * The line as drawn so far: a new itinerary traces itself along its path, from its
 * first point to its last, unless the Visitor asked to reduce motion.
 */
function useTrace(line: readonly Position[] | undefined): readonly Position[] | undefined {
  const [traced, setTraced] = useState(line);
  useEffect(() => {
    if (!line || line.length < 3 || prefersReducedMotion()) {
      const frame = requestAnimationFrame(() => {
        setTraced(line);
      });
      return () => {
        cancelAnimationFrame(frame);
      };
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const share = Math.min(1, (now - start) / TRACE_MS);
      // Eases out, as a pen slowing down at the end of a stroke.
      const eased = 1 - (1 - share) ** 3;
      setTraced(line.slice(0, Math.max(2, Math.ceil(eased * line.length))));
      if (share < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [line]);
  return traced;
}
