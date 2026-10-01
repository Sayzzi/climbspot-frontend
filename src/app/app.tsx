import { RouterProvider } from '@tanstack/react-router';

import { AppProviders } from './providers';
import { createQueryClient } from './query-client';
import { createAppRouter } from './router';

const queryClient = createQueryClient();
const router = createAppRouter({ queryClient });

export function App() {
  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
