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
  let result: R;
  try {
    result = await request;
  } catch (cause) {
    throw new NetworkError({ cause });
  }

  const { data, error, response } = result;
  if (error !== undefined || data === undefined || data === null) {
    const body = isApiError(error) ? error.error : undefined;
    throw new ApiRequestError(
      body?.code ?? 'UNKNOWN_ERROR',
      body?.message ?? `HTTP ${String(response.status)}`,
    );
  }
  return data;
}

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }
  const { error } = value;
  return typeof error === 'object' && error !== null && 'code' in error;
}
