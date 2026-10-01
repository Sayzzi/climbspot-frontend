import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anAscent, anAscentSummary, apiErrorResponse, handlers, nearbyResults } from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const ID = '00000000-0000-4000-8000-000000000001';

function ascentApi(overrides: Parameters<typeof anAscent>[0] = {}) {
  server.use(handlers.ascent(() => HttpResponse.json(anAscent({ id: ID, ...overrides }))));
}

const facts = () => within(screen.getByRole('region', { name: 'Measurements' }));

describe('Ascent page', () => {
  it('opens from the search results', async () => {
    server.use(handlers.nearby(() => nearbyResults([anAscentSummary({ id: ID, name: 'Le Mur' })])));
    ascentApi({ name: 'Le Mur' });
    const { router, user } = await renderApp('/?latitude=45&longitude=6');

    await user.click(await screen.findByRole('link', { name: 'View Le Mur' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Le Mur' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/ascents/${ID}`);
  });

  it('shows the measurements, Surface and Activities', async () => {
    ascentApi({
      length: 1200,
      elevationGain: 96,
      averageGradient: 0.08,
      maximumGradient: 0.105,
      difficultyScore: 9600,
      category: 'cat4',
      surface: 'trail',
      activities: ['trail_running', 'mountain_biking'],
    });

    await renderApp(`/ascents/${ID}`);
    await screen.findByRole('heading', { level: 1 });

    const measurements = facts();
    expect(measurements.getByText('Length').nextSibling).toHaveTextContent('1.2 km');
    expect(measurements.getByText('Elevation gain').nextSibling).toHaveTextContent('96 m');
    expect(measurements.getByText('Average gradient').nextSibling).toHaveTextContent('8%');
    expect(measurements.getByText('Maximum gradient').nextSibling).toHaveTextContent('10.5%');
    expect(measurements.getByText('Difficulty score').nextSibling).toHaveTextContent('9,600');
    expect(measurements.getByText('Category').nextSibling).toHaveTextContent('Cat 4');
    expect(measurements.getByText('Surface').nextSibling).toHaveTextContent('Trail');
    expect(measurements.getByText('Activities').nextSibling).toHaveTextContent(
      'Trail running, Mountain biking',
    );
  });

  it('draws the path on a map framed on it, with its Start and Top', async () => {
    ascentApi({ name: 'Le Mur' });

    await renderApp(`/ascents/${ID}`);

    const map = within(await screen.findByRole('region', { name: 'Map of Le Mur' }));
    expect(map.getByText('Line through 3 points')).toBeInTheDocument();
    expect(map.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(map.getByRole('button', { name: 'Top' })).toBeInTheDocument();
    expect(fakeMap.props()?.fitTo).toHaveLength(3);
  });

  it('charts the Elevation Profile with a text alternative', async () => {
    ascentApi({
      length: 1200,
      maximumGradient: 0.105,
      start: { latitude: 45, longitude: 6, elevation: 200 },
      top: { latitude: 45.0108, longitude: 6, elevation: 296 },
    });

    await renderApp(`/ascents/${ID}`);

    expect(
      await screen.findByRole('img', {
        name: 'Elevation profile: 1.2 km from 200 m to 296 m, steepest stretch at 10.5%.',
      }),
    ).toBeInTheDocument();
  });

  it('links to the Start in the maps app', async () => {
    ascentApi({ start: { latitude: 45.1234, longitude: 6.5678, elevation: 200 } });

    await renderApp(`/ascents/${ID}`);

    expect(await screen.findByRole('link', { name: 'Open the start in Maps' })).toHaveAttribute(
      'href',
      'geo:45.1234,6.5678',
    );
  });

  it('goes back to the previous search', async () => {
    server.use(handlers.nearby(() => nearbyResults([anAscentSummary({ id: ID, name: 'Le Mur' })])));
    ascentApi({ name: 'Le Mur' });
    const { router, user } = await renderApp('/?latitude=45&longitude=6&radius=5000');
    await user.click(await screen.findByRole('link', { name: 'View Le Mur' }));
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });

    await user.click(screen.getByRole('button', { name: 'Back to search' }));

    expect(await screen.findByRole('list', { name: 'Nearby climbs' })).toBeInTheDocument();
    expect(router.state.location.search).toMatchObject({
      latitude: 45,
      longitude: 6,
      radius: 5000,
    });
  });

  it('offers the search page when opened directly', async () => {
    ascentApi();

    await renderApp(`/ascents/${ID}`);

    expect(await screen.findByRole('link', { name: 'Back to search' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('explains when the Ascent does not exist', async () => {
    server.use(handlers.ascent(() => apiErrorResponse(404, 'ASCENT_NOT_FOUND')));

    await renderApp(`/ascents/${ID}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Climb not found' }),
    ).toBeInTheDocument();
    expect(screen.getByText('This climb does not exist or has been removed.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to search' })).toHaveAttribute('href', '/');
  });

  it('explains other failures and lets the Visitor retry', async () => {
    let calls = 0;
    server.use(
      handlers.ascent(() => {
        calls += 1;
        return calls === 1
          ? apiErrorResponse(500, 'INTERNAL_ERROR')
          : HttpResponse.json(anAscent({ id: ID, name: 'Le Mur' }));
      }),
    );
    const { user } = await renderApp(`/ascents/${ID}`);

    expect(
      await screen.findByText('Something went wrong on our side. Please try again.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Le Mur' })).toBeInTheDocument();
  });
});
