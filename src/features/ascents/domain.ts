import type { Activity, Category, Surface } from './types';

/**
 * Checks at compile time that `values` lists every member of the union `T`,
 * so a value the API adds or removes becomes a type error here.
 */
const everyOf =
  <T extends string>() =>
  <const V extends readonly T[]>(
    values: V & ([Exclude<T, V[number]>] extends [never] ? unknown : 'missing values'),
  ): V =>
    values;

/* Runtime lists of the API's enums, in display order. */
export const surfaces = everyOf<Surface>()(['paved', 'gravel', 'trail']);

export const activities = everyOf<Activity>()([
  'running',
  'trail_running',
  'road_cycling',
  'gravel_cycling',
  'mountain_biking',
]);

export const categories = everyOf<Category>()([
  'uncategorized',
  'cat4',
  'cat3',
  'cat2',
  'cat1',
  'hc',
]);

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
