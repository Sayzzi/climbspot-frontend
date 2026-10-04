import { ApiRequestError, NetworkError } from './request';

/**
 * Every error code the API may answer with, plus client-side failures. Written by hand:
 * the API's schema types `code` as a plain string.
 */
export const errorCodes = [
  'BAD_REQUEST',
  'VALIDATION_FAILED',
  'ROUTE_NOT_FOUND',
  'AUTHENTICATION_REQUIRED',
  'ACCOUNT_DELETION_UNAVAILABLE',
  'STRAVA_UNAVAILABLE',
  'STRAVA_AUTHORIZATION_REFUSED',
  'STRAVA_CONNECTION_LOST',
  'INTERNAL_ERROR',
  'ASCENT_NOT_FOUND',
  'SAVED_ITINERARY_NOT_FOUND',
  'SAVED_ITINERARY_TOO_LARGE',
  'GPX_INVALID',
  'GPX_EMPTY',
  'GPX_TOO_LARGE',
  'ASCENT_TOO_LONG',
  'ASCENT_TOO_FLAT',
  'ASCENT_TOO_LOW',
  'ASCENT_DIP_TOO_LARGE',
  'ELEVATION_UNAVAILABLE',
  'ROUTING_UNAVAILABLE',
  'NETWORK_ERROR',
  'UNKNOWN_ERROR',
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export type ErrorMessageKey = `errors.${ErrorCode}`;

const isKnown = (code: string): code is ErrorCode =>
  (errorCodes as readonly string[]).includes(code);

/** Translation key (common namespace) describing any failure to the Visitor. */
export function errorMessageKey(error: unknown): ErrorMessageKey {
  if (error instanceof NetworkError) {
    return 'errors.NETWORK_ERROR';
  }
  if (error instanceof ApiRequestError && isKnown(error.code)) {
    return `errors.${error.code}`;
  }
  return 'errors.UNKNOWN_ERROR';
}
