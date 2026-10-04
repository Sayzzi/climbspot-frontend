import type { components } from './schema.gen';

export type ApiError = components['schemas']['ApiError'];

/** The API answered with an error (`ApiError` body and a 4xx/5xx status). */
export class ApiRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
  }
}

/** The API could not be reached at all. */
export class NetworkError extends Error {
  constructor(options?: ErrorOptions) {
    super('The API could not be reached.', options);
    this.name = 'NetworkError';
  }
}

interface ClientResult {
  readonly data?: unknown;
  readonly error?: unknown;
  readonly response: Response;
}

/**
 * Resolves an `apiClient` call to its data, or throws an {@link ApiRequestError}
 * or a {@link NetworkError}, so that callers (e.g. TanStack Query) only see data or errors.
 */
export async function unwrap<R extends ClientResult>(
  request: Promise<R>,
): Promise<NonNullable<R['data']>> {
  const { data, error, response } = await reached(request);
  if (error !== undefined || data === undefined || data === null) {
    throw requestError(error, response);
  }
  return data;
}

/** Like {@link unwrap}, for a request the API answers without a body (204 No Content). */
export async function unwrapEmpty(request: Promise<ClientResult>): Promise<void> {
  const { error, response } = await reached(request);
  if (error !== undefined || !response.ok) {
    throw requestError(error, response);
  }
}

async function reached<R extends ClientResult>(request: Promise<R>): Promise<R> {
  try {
    return await request;
  } catch (cause) {
    throw new NetworkError({ cause });
  }
}

function requestError(error: unknown, response: Response): ApiRequestError {
  const body = isApiError(error) ? error.error : undefined;
  return new ApiRequestError(
    body?.code ?? 'UNKNOWN_ERROR',
    body?.message ?? `HTTP ${String(response.status)}`,
  );
}

export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }
  const { error } = value;
  return typeof error === 'object' && error !== null && 'code' in error;
}
