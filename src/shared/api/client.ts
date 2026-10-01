import createClient from 'openapi-fetch';

import { env } from '@/shared/config/env';

import type { components, paths } from './schema.gen';

/** Typed HTTP client generated from the backend's OpenAPI document (`pnpm api:generate`). */
export const apiClient = createClient<paths>({ baseUrl: env.VITE_API_URL });

export type ApiError = components['schemas']['ApiError'];
