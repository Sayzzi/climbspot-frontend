import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { anAscentSummary, handlers, nearbyResults } from '@/test/api';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const HERE = '/?latitude=45&longitude=6';

beforeEach(() => {
  server.use(handlers.nearby(() => nearbyResults([anAscentSummary({ name: 'Le Mur' })])));
});

/** The scrolls asked of the window, as `{ top, behavior }`. */
function watchScrolls() {
  const scrollTo = vi.spyOn(window, 'scrollTo');
  scrollTo.mockClear();
  return () =>
    scrollTo.mock.calls.flatMap(([options]: unknown[]) =>
      typeof options === 'object' && options !== null ? [options as ScrollToOptions] : [],
    );
}

function reduceMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('The home page', () => {
  beforeEach(() => {
    reduceMotion(false);
  });

  it('says what ClimbSpot does, with two ways in', async () => {
    await renderApp(HERE);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Find the hills worth climbing near you.',
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Climbs near me' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Explore the map' })).toBeVisible();
  });

  it('shows the climbs near the Visitor, moving the focus to them', async () => {
    const scrolls = watchScrolls();
    const { user } = await renderApp(HERE);

    await user.click(await screen.findByRole('button', { name: 'Climbs near me' }));

    expect(scrolls()).toContainEqual({ top: window.innerHeight, behavior: 'smooth' });
    expect(screen.getByRole('complementary', { name: 'Search' })).toHaveFocus();
  });

  it('reveals the map to explore, moving the focus to it', async () => {
    const scrolls = watchScrolls();
    const { user } = await renderApp(HERE);

    await user.click(await screen.findByRole('button', { name: 'Explore the map' }));

    expect(scrolls()).toContainEqual({ top: window.innerHeight, behavior: 'smooth' });
    expect(
      screen.getByRole('region', { name: 'Map of nearby climbs' }).parentElement,
    ).toHaveFocus();
  });

  it('moves without animating when the Visitor asked to reduce motion', async () => {
    reduceMotion(true);
    const scrolls = watchScrolls();
    const { user } = await renderApp(HERE);

    await user.click(await screen.findByRole('button', { name: 'Explore the map' }));

    expect(scrolls()).toContainEqual({ top: window.innerHeight, behavior: 'auto' });
  });
});
