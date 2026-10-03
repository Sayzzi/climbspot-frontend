import { useEffect } from 'react';

import type { MapViewProps } from '@/shared/map/types';

import { fakeMap } from './fake-map-control';

/**
 * Stand-in for the WebGL map in jsdom: markers become buttons and the lines are
 * exposed as text. Tests drive it through `fakeMap`.
 */
export function MapView(props: MapViewProps) {
  const { label, markers = [], line, alternatives = [], dashedLine, onMarkerSelect } = props;

  useEffect(() => {
    fakeMap.register(props);
    return () => {
      fakeMap.register(undefined);
    };
  });

  return (
    <section aria-label={label}>
      {markers.map((marker) => (
        <button
          key={marker.id}
          type="button"
          aria-pressed={marker.selected ?? false}
          onClick={() => onMarkerSelect?.(marker.id)}
        >
          {marker.label}
        </button>
      ))}
      {line && <p>{`Line through ${String(line.length)} points`}</p>}
      {dashedLine && <p>{`Dashed line through ${String(dashedLine.length)} points`}</p>}
      {alternatives.length > 0 && (
        <p>{`Other lines through ${alternatives.map((other) => String(other.length)).join(', ')} points`}</p>
      )}
    </section>
  );
}
