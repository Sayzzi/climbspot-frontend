import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { ApiRequestError, unwrap } from '@/shared/api/request';

import type { Ascent } from '../types';

/** An Ascent as openapi-fetch types it: GeoJSON pairs widened to `number[]`. */
type ReceivedAscent = Omit<Ascent, 'path'> & {
  readonly path: { readonly type: 'LineString'; readonly coordinates: readonly number[][] };
};

/** Restores the `[longitude, latitude]` pairs the API contract guarantees, checking each one. */
export function toAscent(received: ReceivedAscent): Ascent {
  return {
    ...received,
    path: {
      type: received.path.type,
      coordinates: received.path.coordinates.map(([longitude, latitude]) => {
        if (longitude === undefined || latitude === undefined) {
          throw new TypeError('The API sent a path point without two coordinates.');
        }
        return [longitude, latitude];
      }),
    },
  };
}

export function ascentQuery(id: string) {
  return queryOptions({
    queryKey: ['ascents', id],
    queryFn: async ({ signal }) =>
      toAscent(await unwrap(apiClient.GET('/ascents/{id}', { params: { path: { id } }, signal }))),
  });
}

/** The API answers a malformed id with VALIDATION_FAILED: for a Visitor, both mean "no such Ascent". */
export function isAscentMissing(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.code === 'ASCENT_NOT_FOUND' || error.code === 'VALIDATION_FAILED')
  );
}
