import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { ApiRequestError, unwrap } from '@/shared/api/request';

import type { Ascent } from '../types';

/**
 * openapi-fetch widens the GeoJSON `[longitude, latitude]` tuples of an Ascent's
 * path to `number[][]`; the API contract guarantees pairs, so restore its type.
 */
export const asAscent = (ascent: unknown) => ascent as Ascent;

export function ascentQuery(id: string) {
  return queryOptions({
    queryKey: ['ascents', id],
    queryFn: async ({ signal }) =>
      asAscent(await unwrap(apiClient.GET('/ascents/{id}', { params: { path: { id } }, signal }))),
  });
}

/** The API answers a malformed id with VALIDATION_FAILED: for a Visitor, both mean "no such Ascent". */
export function isAscentMissing(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.code === 'ASCENT_NOT_FOUND' || error.code === 'VALIDATION_FAILED')
  );
}
