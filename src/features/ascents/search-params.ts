import { z } from 'zod';

import type { SearchFilterValues } from './components/search-filters';
import { activities, categories } from '@/shared/domain/values';

import { MAXIMUM_RADIUS } from './domain';
import type { Position } from './types';

/**
 * The nearby search as it lives in the URL, so it can be shared and survives a
 * refresh. Names and bounds mirror the API; anything invalid is ignored.
 */
export const searchParamsSchema = z.object({
  latitude: z.number().min(-90).max(90).optional().catch(undefined),
  longitude: z.number().min(-180).max(180).optional().catch(undefined),
  radius: z.number().int().positive().max(MAXIMUM_RADIUS).optional().catch(undefined),
  activity: z.array(z.enum(activities)).nonempty().optional().catch(undefined),
  category: z.array(z.enum(categories)).nonempty().optional().catch(undefined),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

/** ~10 m: precise enough for a search, and keeps shared URLs short. */
const roundCoordinate = (degrees: number) => Math.round(degrees * 10_000) / 10_000;

export function positionOf({ latitude, longitude }: SearchParams): Position | undefined {
  return latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined;
}

export function filtersOf({ radius, activity, category }: SearchParams): SearchFilterValues {
  return { radius, activities: activity, categories: category };
}

export function withPosition(
  params: SearchParams,
  { latitude, longitude }: Position,
): SearchParams {
  return { ...params, latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) };
}

export function withFilters(params: SearchParams, filters: SearchFilterValues): SearchParams {
  return {
    ...params,
    radius: filters.radius,
    activity: nonEmpty(filters.activities),
    category: nonEmpty(filters.categories),
  };
}

function nonEmpty<T>(values: readonly T[] | undefined): [T, ...T[]] | undefined {
  const [first, ...rest] = values ?? [];
  return first === undefined ? undefined : [first, ...rest];
}
