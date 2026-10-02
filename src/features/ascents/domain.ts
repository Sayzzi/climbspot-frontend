import type { Activity, Surface } from '@/shared/domain/values';

/**
 * Activities each Surface allows, so Contributors know what they choose before
 * uploading. A copy of the API's single mapping (ADR 0007), which the API does
 * not expose; update both together.
 */
export const activitiesBySurface: Record<Surface, readonly Activity[]> = {
  paved: ['running', 'road_cycling'],
  gravel: ['running', 'trail_running', 'gravel_cycling', 'mountain_biking'],
  trail: ['trail_running', 'mountain_biking'],
};

/** Mirrors the API's nearby search defaults and limits, in metres. */
export const DEFAULT_RADIUS = 10_000;
export const MAXIMUM_RADIUS = 50_000;
export const SEARCH_RADII = [2_000, 5_000, 10_000, 25_000, 50_000] as const;

/** Mirror the API's cheapest upload rules, checked before sending. */
export const MAXIMUM_GPX_FILE_SIZE = 5 * 1024 * 1024;
export const MAXIMUM_NAME_LENGTH = 100;
