import type { components } from '@/shared/api/schema.gen';

export type Surface = components['schemas']['Surface'];
export type Activity = components['schemas']['Activity'];
export type Category = components['schemas']['Category'];
export type Relief = components['schemas']['Relief'];

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

export const reliefs = everyOf<Relief>()(['flat', 'rolling', 'hilly']);
