import type { Position } from '@/shared/lib/position';

export interface MapMarker {
  readonly id: string;
  readonly position: Position;
  /** Accessible name of the marker. */
  readonly label: string;
  readonly selected?: boolean;
  readonly tone?: 'default' | 'start' | 'top';
}

/** What a panel adds to the map while it is shown: its markers, a line, and clicks. */
export interface MapOverlay {
  readonly markers?: readonly MapMarker[];
  readonly line?: readonly Position[];
  readonly onMapClick?: (position: Position) => void;
}

export interface MapViewProps {
  /** Accessible name of the map region. */
  readonly label: string;
  /** Centre of the map, followed when it changes; ignored while `fitTo` is set. */
  readonly center: Position;
  readonly zoom: number;
  /** Positions the map frames when it opens (e.g. a path). */
  readonly fitTo?: readonly Position[];
  readonly markers?: readonly MapMarker[];
  /** A line drawn through these positions (e.g. an Ascent's path). */
  readonly line?: readonly Position[];
  readonly onMarkerSelect?: (id: string) => void;
  /** Called with the position the Visitor clicked or tapped on the map. */
  readonly onMapClick?: (position: Position) => void;
  /** When false, the map ignores panning and zooming gestures (default true). */
  readonly interactive?: boolean;
  /** Called with the new centre once the Visitor (not the app) has moved the map. */
  readonly onAreaChange?: (center: Position) => void;
  readonly className?: string;
}
