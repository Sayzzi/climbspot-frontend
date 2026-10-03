import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { aLoopItinerary, apiErrorResponse, handlers, nearbyResults } from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

type User = Awaited<ReturnType<typeof renderApp>>['user'];

const POINT = { latitude: 45.9, longitude: 6.13 };

function loopsApi(
  answer: () => Response | Promise<Response> = () =>
    HttpResponse.json({ itineraries: [aLoopItinerary()] }),
) {
  const sent: unknown[] = [];
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.loops(async (request) => {
      sent.push(await request.json());
      return (await answer()) as never;
    }),
  );
  return sent;
}

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));

async function openLoops() {
  const app = await renderApp('/?latitude=45.9&longitude=6.13');
  await app.user.click(await screen.findByRole('tab', { name: 'Plan' }));
  await app.user.click(plan().getByRole('radio', { name: 'Loop' }));
  return app;
}

const submit = (user: User) => user.click(plan().getByRole('button', { name: 'Find loops' }));

describe('Plan tab: Loops', () => {
  it('offers Uphill and Loop, Uphill first', async () => {
    loopsApi();
    const { user } = await renderApp('/?latitude=45.9&longitude=6.13');
    await user.click(await screen.findByRole('tab', { name: 'Plan' }));

    const kinds = within(plan().getByRole('radiogroup', { name: 'Itinerary' }));
    expect(kinds.getByRole('radio', { name: 'Uphill' })).toBeChecked();
    expect(kinds.getByRole('radio', { name: 'Loop' })).not.toBeChecked();
  });

  it('sends a Loop request from sensible defaults', async () => {
    const sent = loopsApi();
    const { user } = await openLoops();
    fakeMap.click(POINT);

    await submit(user);

    await waitFor(() => {
      expect(sent).toEqual([
        { start: POINT, distance: 5000, relief: 'rolling', activity: 'running' },
      ]);
    });
  });

  it('sends the chosen distance, Relief and Activity', async () => {
    const sent = loopsApi();
    const { user } = await openLoops();
    fakeMap.click(POINT);

    await user.clear(plan().getByRole('textbox', { name: 'Distance (km)' }));
    await user.type(plan().getByRole('textbox', { name: 'Distance (km)' }), '10');
    await user.click(plan().getByRole('radio', { name: 'Hilly' }));
    await user.selectOptions(plan().getByRole('combobox', { name: 'Activity' }), 'Trail running');
    await submit(user);

    await waitFor(() => {
      expect(sent).toEqual([
        { start: POINT, distance: 10_000, relief: 'hilly', activity: 'trail_running' },
      ]);
    });
  });

  it('keeps the starting point when switching between kinds', async () => {
    const sent = loopsApi();
    const { user } = await renderApp('/?latitude=45.9&longitude=6.13');
    await user.click(await screen.findByRole('tab', { name: 'Plan' }));
    fakeMap.click(POINT);

    await user.click(plan().getByRole('radio', { name: 'Loop' }));
    await submit(user);

    await waitFor(() => {
      expect(sent).toHaveLength(1);
    });
  });

  it('lists Loops with their length, Height Gained and Relief, and how they match', async () => {
    loopsApi(() =>
      HttpResponse.json({
        itineraries: [
          aLoopItinerary(),
          aLoopItinerary({
            exact: false,
            relief: 'flat',
            heightGained: 30,
            differences: [{ kind: 'relief', wanted: 'rolling', actual: 'flat' }],
          }),
        ],
      }),
    );
    const { user } = await openLoops();
    fakeMap.click(POINT);

    await submit(user);

    const [firstItem, secondItem] = within(
      await plan().findByRole('list', { name: 'Proposed itineraries' }),
    ).getAllByRole('listitem');
    if (!firstItem || !secondItem) {
      throw new Error('two proposals expected');
    }
    const first = within(firstItem);
    expect(first.getByRole('button', { name: 'Show 5.6 km loop' })).toBeInTheDocument();
    expect(first.getByText('Matches your request')).toBeInTheDocument();
    expect(first.getByText('105 m')).toBeInTheDocument();
    expect(first.getByText('Rolling')).toBeInTheDocument();
    expect(
      within(secondItem).getByText('Close match: Flat instead of Rolling'),
    ).toBeInTheDocument();
  });

  it('draws the selected Loop with its Elevation Profile', async () => {
    loopsApi();
    const { user } = await openLoops();
    fakeMap.click(POINT);

    await submit(user);
    await plan().findByRole('list', { name: 'Proposed itineraries' });

    expect(screen.getByText('Line through 4 points')).toBeInTheDocument();
    expect(
      plan().getByRole('img', { name: 'Elevation profile: 5.6 km, between 450 m and 520 m.' }),
    ).toBeInTheDocument();
  });

  it('suggests what to change when no Loop is found', async () => {
    loopsApi(() => HttpResponse.json({ itineraries: [] }));
    const { user } = await openLoops();
    fakeMap.click(POINT);

    await submit(user);

    expect(await plan().findByText('No itinerary found around this point.')).toBeInTheDocument();
    expect(
      plan().getByText('Try another point, another Activity or another Relief.'),
    ).toBeInTheDocument();
  });

  it('explains when planning is unavailable and keeps the request', async () => {
    loopsApi(() => apiErrorResponse(503, 'ROUTING_UNAVAILABLE'));
    const { user } = await openLoops();
    fakeMap.click(POINT);
    await user.click(plan().getByRole('radio', { name: 'Flat' }));

    await submit(user);

    expect(await plan().findByRole('alert')).toHaveTextContent(
      'Planning is temporarily unavailable. Please try again in a moment.',
    );
    expect(plan().getByRole('radio', { name: 'Flat' })).toBeChecked();
  });
});
