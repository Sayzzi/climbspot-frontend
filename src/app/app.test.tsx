import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createQueryClient } from './query-client';
import { createAppRouter } from './router';

function renderAt(url: string) {
  const router = createAppRouter({
    queryClient: createQueryClient(),
    history: createMemoryHistory({ initialEntries: [url] }),
  });

  render(<RouterProvider router={router} />);
}

describe('App', () => {
  it('renders the home page in English', async () => {
    renderAt('/');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Find climbs near you' }),
    ).toBeInTheDocument();
  });

  it('renders a not found page for unknown URLs', async () => {
    renderAt('/does-not-exist');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });
});
