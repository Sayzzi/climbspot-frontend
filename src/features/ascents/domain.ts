import type { Activity, Category, Surface } from './types';

/*
 * Runtime lists of the API's enums, in display order. `satisfies` keeps them in
 * step with the generated types: a value the API drops becomes a type error.
 */
export const surfaces = ['paved', 'gravel', 'trail'] as const satisfies readonly Surface[];

export const activities = [
  'running',
  'trail_running',
  'road_cycling',
  'gravel_cycling',
  'mountain_biking',
] as const satisfies readonly Activity[];

export const categories = [
  'uncategorized',
  'cat4',
  'cat3',
  'cat2',
  'cat1',
  'hc',
] as const satisfies readonly Category[];

/** Mirrors the API's nearby search defaults and limits, in metres. */
export const DEFAULT_RADIUS = 10_000;
export const MAXIMUM_RADIUS = 50_000;
export const SEARCH_RADII = [2_000, 5_000, 10_000, 25_000, 50_000] as const;

/**
 * Activities each Surface allows: mirrors the API's single mapping (ADR 0007),
 * so Contributors know what they choose before uploading.
 */
export const activitiesBySurface: Record<Surface, readonly Activity[]> = {
  paved: ['running', 'road_cycling'],
  gravel: ['running', 'trail_running', 'gravel_cycling', 'mountain_biking'],
  trail: ['trail_running', 'mountain_biking'],
};

/** Mirror the API's cheapest upload rules, checked before sending. */
export const MAXIMUM_GPX_FILE_SIZE = 5 * 1024 * 1024;
export const MAXIMUM_NAME_LENGTH = 100;
