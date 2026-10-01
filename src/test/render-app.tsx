import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createAppRouter } from '@/app/router';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/query-client';

/** Renders the whole application at `url`, as a Visitor would open it. */
export async function renderApp(url = '/') {
  const queryClient = createQueryClient({ retry: false });
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  const user = userEvent.setup();

  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  await router.load();

  return { router, user, queryClient };
}
