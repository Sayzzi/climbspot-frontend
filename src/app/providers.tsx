import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { FlatPaceProvider } from '@/shared/pace';
import { UnitsProvider } from '@/shared/units';

interface AppProvidersProps {
  readonly queryClient: QueryClient;
  readonly children: ReactNode;
}

/** Application-wide context shared by the app and its tests. */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <UnitsProvider>
        <FlatPaceProvider>{children}</FlatPaceProvider>
      </UnitsProvider>
    </QueryClientProvider>
  );
}
