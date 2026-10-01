import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { anAscentSummary, handlers, nearbyResults, recorder } from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { stubGeolocation } from '@/test/geolocation';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

function nearbyApi() {
  const sent = recorder();
  server.use(
    handlers.nearby((request) => {
      sent.record(request);
      return nearbyResults([anAscentSummary({ name: 'Le Mur' })]);
    }),
  );
  return sent;
}

describe('Locating the Visitor', () => {
  it('uses the shared position and puts it in the URL', async () => {
    const sent = nearbyApi();
    stubGeolocation({ position: { latitude: 45.19, longitude: 5.72 } });

    const { router } = await renderApp('/');

    expect(await screen.findByRole('list', { name: 'Nearby climbs' })).toBeInTheDocument();
    expect(router.state.location.search).toMatchObject({ latitude: 45.19, longitude: 5.72 });
    expect(sent.lastUrl()?.searchParams.get('latitude')).toBe('45.19');
    expect(sent.lastUrl()?.searchParams.get('longitude')).toBe('5.72');
  });

  it('replaces the position-less history entry instead of adding one', async () => {
    nearbyApi();
    stubGeolocation({ position: { latitude: 45.19, longitude: 5.72 } });

    const { router } = await renderApp('/');

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ latitude: 45.19 });
    });
    expect(router.history.canGoBack()).toBe(false);
  });

  it('says it is looking for the position', async () => {
    stubGeolocation('pending');

    await renderApp('/');

    expect(await screen.findByText('Finding your location…')).toBeInTheDocument();
  });

  it.each([
    [{ error: 'denied' } as const, 'Location access is turned off.'],
    [{ error: 'unavailable' } as const, 'We could not determine your location.'],
    [{ error: 'timeout' } as const, 'Finding your location took too long.'],
    ['unsupported' as const, 'This browser cannot share your location.'],
  ])('explains why the position is unknown (%o)', async (behaviour, message) => {
    stubGeolocation(behaviour);

    await renderApp('/');

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByText('Move the map and search that area instead.')).toBeInTheDocument();
  });

  it('searches the area the Visitor moved the map to', async () => {
    const sent = nearbyApi();
    stubGeolocation({ error: 'denied' });
    const { router, user } = await renderApp('/');
    await screen.findByText('Location access is turned off.');

    fakeMap.moveTo({ latitude: 44.17, longitude: 5.28 });
    await user.click(screen.getByRole('button', { name: 'Search this area' }));

    expect(
      within(await screen.findByRole('list', { name: 'Nearby climbs' })).getByRole('heading', {
        name: 'Le Mur',
      }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toMatchObject({ latitude: 44.17, longitude: 5.28 });
    expect(sent.lastUrl()?.searchParams.get('latitude')).toBe('44.17');
  });

  it('lets the Visitor search elsewhere after a first search', async () => {
    const sent = nearbyApi();
    const { router, user } = await renderApp('/?latitude=45&longitude=6');
    await screen.findByRole('list', { name: 'Nearby climbs' });

    fakeMap.moveTo({ latitude: 45.92, longitude: 6.87 });
    await user.click(screen.getByRole('button', { name: 'Search this area' }));

    await waitFor(() => {
      expect(sent.lastUrl()?.searchParams.get('latitude')).toBe('45.92');
    });
    expect(router.state.location.search).toMatchObject({ latitude: 45.92, longitude: 6.87 });
  });

  it('does not offer to search an area before the map has moved', async () => {
    nearbyApi();

    await renderApp('/?latitude=45&longitude=6');
    await screen.findByRole('list', { name: 'Nearby climbs' });

    expect(screen.queryByRole('button', { name: 'Search this area' })).not.toBeInTheDocument();
  });
});
