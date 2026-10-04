import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { aLoopItinerary, anUphillItinerary, handlers, nearbyResults } from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { stubGeolocation } from '@/test/geolocation';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));

beforeEach(() => {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.uphill(() => HttpResponse.json({ itineraries: [anUphillItinerary()] })),
    handlers.loops(() => HttpResponse.json({ itineraries: [aLoopItinerary()] })),
  );
});

async function openPlan() {
  const app = await renderApp('/?latitude=45.9&longitude=6.13');
  await app.user.click(await screen.findByRole('tab', { name: 'Plan' }));
  return app;
}

describe('The Plan panel', () => {
  it('places the starting point where the Visitor is, without the map', async () => {
    stubGeolocation({ position: { latitude: 45.91, longitude: 6.14 } });
    const { user } = await openPlan();

    await user.click(plan().getByRole('button', { name: 'Use my location' }));

    expect(
      await plan().findByText('Starting point placed. Click the map to move it.'),
    ).toBeVisible();
    expect(
      fakeMap.props()?.markers?.find((marker) => marker.id === 'plan-start')?.position,
    ).toEqual({ latitude: 45.91, longitude: 6.14 });
  });

  it('says when the Visitor’s location is not available', async () => {
    stubGeolocation({ error: 'denied' });
    const { user } = await openPlan();

    await user.click(plan().getByRole('button', { name: 'Use my location' }));

    expect(await plan().findByRole('status')).toHaveTextContent(
      'Your location is not available: place your starting point on the map.',
    );
  });

  it('gives each proposal’s key figures first, like a trail sign', async () => {
    stubGeolocation({ position: { latitude: 45.91, longitude: 6.14 } });
    const { user } = await openPlan();
    await user.click(plan().getByRole('button', { name: 'Use my location' }));
    await waitFor(() => {
      expect(plan().getByText('Starting point placed. Click the map to move it.')).toBeVisible();
    });

    await user.click(plan().getByRole('button', { name: 'Find uphill itineraries' }));

    const [proposal] = await plan().findAllByRole('article');
    if (!proposal) throw new Error('a proposal expected');
    const terms = within(proposal)
      .getAllByRole('term')
      .map((term) => term.textContent);
    expect(terms.slice(0, 3)).toEqual(['Length', 'Elevation gain', 'Average gradient']);
  });
});
