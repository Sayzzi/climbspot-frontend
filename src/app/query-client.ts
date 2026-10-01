import { QueryClient } from '@tanstack/react-query';

interface QueryClientOptions {
  /** Retries of failed queries; tests turn them off. */
  readonly retry?: number | false;
}

export function createQueryClient({ retry = 1 }: QueryClientOptions = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry,
      },
    },
  });
}
