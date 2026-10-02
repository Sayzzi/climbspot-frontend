import type { components } from '@/shared/api/schema.gen';
import type { Position } from '@/shared/lib/position';
import type { Activity, Category } from '@/shared/domain/values';

export type NearbyAscent = components['schemas']['NearbyAscents']['ascents'][number];
export type Ascent = components['schemas']['Ascent'];

export type { Position } from '@/shared/lib/position';

/** What a nearby search asks the API for. */
export interface NearbyCriteria {
  readonly position: Position;
  /** Metres. */
  readonly radius?: number | undefined;
  readonly activities?: readonly Activity[] | undefined;
  readonly categories?: readonly Category[] | undefined;
}
