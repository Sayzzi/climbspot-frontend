import type { QueryClient } from '@tanstack/react-query';
import { createRouter, type RouterHistory } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

interface AppRouterOptions {
  readonly queryClient: QueryClient;
  /** Defaults to the browser history; tests pass a memory history. */
  readonly history?: RouterHistory;
}

export function createAppRouter({ queryClient, history }: AppRouterOptions) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
    ...(history && { history }),
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
