import { delay } from 'msw';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { anAscentSummary, apiErrorResponse, handlers, nearbyResults, recorder } from '@/test/api';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const AT_LE_BOURG = '/?latitude=45&longitude=6';

const results = () => screen.findByRole('list', { name: 'Nearby climbs' });

describe('Nearby search', () => {
  it('lists the Ascents near the position in the URL, nearest Start first', async () => {
    const sent = recorder();
    server.use(
      handlers.nearby((request) => {
        sent.record(request);
        return nearbyResults([
          anAscentSummary({ id: 'a1', name: 'Le Mur', distanceToStart: 800 }),
          anAscentSummary({ id: 'a2', name: 'La Bosse', distanceToStart: 2400 }),
        ]);
      }),
    );

    await renderApp(AT_LE_BOURG);

    const items = within(await results()).getAllByRole('listitem');
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual([
      'Le Mur',
      'La Bosse',
    ]);
    expect(sent.lastUrl()?.searchParams.get('latitude')).toBe('45');
    expect(sent.lastUrl()?.searchParams.get('longitude')).toBe('6');
  });

  it('shows the facts that let Visitors compare Ascents', async () => {
    server.use(
      handlers.nearby(() =>
        nearbyResults([
          anAscentSummary({
            name: 'Le Mur',
            distanceToStart: 1500,
            length: 1200,
            elevationGain: 96,
            averageGradient: 0.08,
            category: 'cat4',
            surface: 'gravel',
            activities: ['running', 'trail_running', 'gravel_cycling', 'mountain_biking'],
          }),
        ]),
      ),
    );

    await renderApp(AT_LE_BOURG);

    const [item] = within(await results()).getAllByRole('listitem');
    if (!item) {
      throw new Error('no result');
    }
    const facts = within(item);
    expect(facts.getByText('1.5 km to the start')).toBeInTheDocument();
    expect(facts.getByText('1.2 km')).toBeInTheDocument();
    expect(facts.getByText('96 m')).toBeInTheDocument();
    expect(facts.getByText('8%')).toBeInTheDocument();
    expect(facts.getByText('Cat 4')).toBeInTheDocument();
    expect(facts.getByText('Gravel')).toBeInTheDocument();
    expect(
      facts.getByText('Running, Trail running, Gravel cycling, Mountain biking'),
    ).toBeInTheDocument();
  });

  it('marks each Ascent Start on the map and keeps map and list selection in sync', async () => {
    server.use(
      handlers.nearby(() =>
        nearbyResults([
          anAscentSummary({ id: 'a1', name: 'Le Mur' }),
          anAscentSummary({ id: 'a2', name: 'La Bosse' }),
        ]),
      ),
    );
    const { user } = await renderApp(AT_LE_BOURG);
    await results();
    const map = within(screen.getByRole('region', { name: 'Map of nearby climbs' }));

    await user.click(map.getByRole('button', { name: 'La Bosse' }));

    const list = within(await results());
    expect(list.getByRole('button', { name: 'La Bosse' })).toHaveAttribute('aria-pressed', 'true');
    expect(list.getByRole('button', { name: 'Le Mur' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(list.getByRole('button', { name: 'Le Mur' }));

    expect(map.getByRole('button', { name: 'Le Mur' })).toHaveAttribute('aria-pressed', 'true');
    expect(map.getByRole('button', { name: 'La Bosse' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows that the search is running', async () => {
    server.use(
      handlers.nearby(async () => {
        await delay(50);
        return nearbyResults([anAscentSummary()]);
      }),
    );

    await renderApp(AT_LE_BOURG);

    expect(await screen.findByText('Looking for climbs…')).toBeInTheDocument();
    await results();
    expect(screen.queryByText('Looking for climbs…')).not.toBeInTheDocument();
  });

  it('suggests widening the search when nothing is nearby', async () => {
    server.use(handlers.nearby(() => nearbyResults([])));

    await renderApp(AT_LE_BOURG);

    expect(await screen.findByText('No climbs around here yet')).toBeInTheDocument();
    expect(screen.getByText('Try a wider radius or fewer filters.')).toBeInTheDocument();
  });

  it('explains a failure and lets the Visitor retry', async () => {
    let calls = 0;
    server.use(
      handlers.nearby(() => {
        calls += 1;
        return calls === 1
          ? apiErrorResponse(500, 'INTERNAL_ERROR')
          : nearbyResults([anAscentSummary({ name: 'Le Mur' })]);
      }),
    );
    const { user } = await renderApp(AT_LE_BOURG);

    expect(
      await screen.findByText('Something went wrong on our side. Please try again.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(within(await results()).getByRole('heading', { name: 'Le Mur' })).toBeInTheDocument();
  });

  it('explains when ClimbSpot cannot be reached', async () => {
    server.use(handlers.nearby(() => Response.error() as never));

    await renderApp(AT_LE_BOURG);

    expect(
      await screen.findByText('We could not reach ClimbSpot. Check your connection.'),
    ).toBeInTheDocument();
  });
});
