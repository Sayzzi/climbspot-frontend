import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { ApiRequestError, unwrap } from '@/shared/api/request';

export function ascentQuery(id: string) {
  return queryOptions({
    queryKey: ['ascents', id],
    queryFn: ({ signal }) =>
      unwrap(apiClient.GET('/ascents/{id}', { params: { path: { id } }, signal })),
  });
}

/** The API answers a malformed id with VALIDATION_FAILED: for a Visitor, both mean "no such Ascent". */
export function isAscentMissing(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.code === 'ASCENT_NOT_FOUND' || error.code === 'VALIDATION_FAILED')
  );
}
