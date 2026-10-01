import type { components } from '@/shared/api/schema.gen';

export type NearbyAscent = components['schemas']['NearbyAscents']['ascents'][number];
export type Ascent = components['schemas']['Ascent'];
export type Surface = components['schemas']['Surface'];
export type Activity = components['schemas']['Activity'];
export type Category = components['schemas']['Category'];

export interface Position {
  readonly latitude: number;
  readonly longitude: number;
}

/** What a nearby search asks the API for. */
export interface NearbyCriteria {
  readonly position: Position;
  /** Metres. */
  readonly radius?: number | undefined;
  readonly activities?: readonly Activity[] | undefined;
  readonly categories?: readonly Category[] | undefined;
}
