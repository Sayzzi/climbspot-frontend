import createClient from 'openapi-fetch';

import { authClient } from '@/shared/auth/auth-client';
import { env } from '@/shared/config/env';

import { isApiError } from './request';
import type { paths } from './schema.gen';

/** Typed HTTP client generated from the backend's OpenAPI document (`pnpm api:generate`). */
export const apiClient = createClient<paths>({
  baseUrl: env.VITE_API_URL,
  // Resolve `fetch` per request rather than at import time, so that anything
  // wrapping it later (e.g. request interception in tests) is honoured.
  fetch: (request) => globalThis.fetch(request),
});

// The signed-in Visitor's token goes with every request; a token the API no longer
// accepts ends the session, so that the Visitor is asked to sign in again, and one that
// has not given the second factor's code asks for it.
apiClient.use({
  onRequest({ request }) {
    const session = authClient.session();
    if (session) {
      request.headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status === 401 && request.headers.has('Authorization')) {
      const body: unknown = await response
        .clone()
        .json()
        .catch(() => undefined);
      await (isApiError(body) && body.error.code === 'SECOND_FACTOR_REQUIRED'
        ? authClient.requireSecondFactor()
        : authClient.expire());
    }
    return response;
  },
});
