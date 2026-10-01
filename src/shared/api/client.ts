import createClient from 'openapi-fetch';

import { env } from '@/shared/config/env';

import type { paths } from './schema.gen';

/** Typed HTTP client generated from the backend's OpenAPI document (`pnpm api:generate`). */
export const apiClient = createClient<paths>({
  baseUrl: env.VITE_API_URL,
  // Resolve `fetch` per request rather than at import time, so that anything
  // wrapping it later (e.g. request interception in tests) is honoured.
  fetch: (request) => globalThis.fetch(request),
});
