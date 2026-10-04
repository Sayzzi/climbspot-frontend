import { cleanup, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { anAscentSummary, handlers, nearbyResults } from '@/test/api';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const HERE = '/?latitude=45&longitude=6';
const HEADLINE = 'Find the hills worth climbing near you.';

beforeEach(() => {
  server.use(handlers.nearby(() => nearbyResults([anAscentSummary({ name: 'Le Mur' })])));
  reduceMotion(false);
});

function reduceMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const welcome = () => screen.queryByRole('heading', { level: 1, name: HEADLINE });

describe('The welcome screen', () => {
  it('says what ClimbSpot does on a first visit, with two ways in', async () => {
    await renderApp(HERE);

    expect(await screen.findByRole('heading', { level: 1, name: HEADLINE })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Climbs near me' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Explore the map' })).toBeVisible();
  });

  it('lifts to show the climbs near the Visitor, moving the focus to them', async () => {
    const { user } = await renderApp(HERE);

    await user.click(await screen.findByRole('button', { name: 'Climbs near me' }));

    await waitFor(() => {
      expect(welcome()).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('complementary', { name: 'Search' })).toHaveFocus();
    });
  });

  it('lifts to explore the map, moving the focus to it', async () => {
    const { user } = await renderApp(HERE);

    await user.click(await screen.findByRole('button', { name: 'Explore the map' }));

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Map of nearby climbs' }).parentElement,
      ).toHaveFocus();
    });
    expect(welcome()).not.toBeInTheDocument();
  });

  it('lifts at once when the Visitor asked to reduce motion', async () => {
    reduceMotion(true);
    const { user } = await renderApp(HERE);

    await user.click(await screen.findByRole('button', { name: 'Explore the map' }));

    expect(welcome()).not.toBeInTheDocument();
  });

  it('is not shown again on later visits, until the logo asks for it', async () => {
    const first = await renderApp(HERE);
    await first.user.click(await screen.findByRole('button', { name: 'Explore the map' }));
    await waitFor(() => {
      expect(welcome()).not.toBeInTheDocument();
    });
    cleanup();

    const { user, router } = await renderApp(HERE);
    await screen.findByRole('list', { name: 'Nearby climbs' });
    expect(welcome()).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'ClimbSpot' }));

    expect(await screen.findByRole('heading', { level: 1, name: HEADLINE })).toBeVisible();
    expect(router.state.location.pathname).toBe('/');
  });
});
