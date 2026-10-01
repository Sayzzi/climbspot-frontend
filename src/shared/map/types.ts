/** A point on the map, in WGS 84 decimal degrees. */
export interface MapPosition {
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapMarker {
  readonly id: string;
  readonly position: MapPosition;
  /** Accessible name of the marker. */
  readonly label: string;
  readonly selected?: boolean;
  readonly tone?: 'default' | 'start' | 'top';
}

export interface MapViewProps {
  /** Accessible name of the map region. */
  readonly label: string;
  /** Initial centre, used when there is nothing to frame. */
  readonly center?: MapPosition;
  readonly zoom?: number;
  /** Positions the map frames when it opens (e.g. a path). */
  readonly fitTo?: readonly MapPosition[];
  readonly markers?: readonly MapMarker[];
  /** A line drawn through these positions (e.g. an Ascent's path). */
  readonly line?: readonly MapPosition[];
  readonly onMarkerSelect?: (id: string) => void;
  /** Called with the new centre once the Visitor has moved the map. */
  readonly onAreaChange?: (center: MapPosition) => void;
  readonly className?: string;
}
