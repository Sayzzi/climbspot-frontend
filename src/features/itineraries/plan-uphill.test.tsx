import { screen, waitFor, within } from '@testing-library/react';
import { delay, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anUphillItinerary, apiErrorResponse, handlers, nearbyResults } from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { stubLanguages } from '@/test/languages';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

type User = Awaited<ReturnType<typeof renderApp>>['user'];

const POINT = { latitude: 45.9, longitude: 6.13 };

function uphillApi(
  answer: () => Response | Promise<Response> = () =>
    HttpResponse.json({ itineraries: [anUphillItinerary()] }),
) {
  const sent: unknown[] = [];
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.uphill(async (request) => {
      sent.push(await request.json());
      return (await answer()) as never;
    }),
  );
  return sent;
}

async function openPlan() {
  const app = await renderApp('/?latitude=45.9&longitude=6.13');
  await app.user.click(await screen.findByRole('tab', { name: 'Plan' }));
  return app;
}

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));
const submit = (user: User) =>
  user.click(plan().getByRole('button', { name: 'Find uphill itineraries' }));

describe('Plan tab: Uphill Itineraries', () => {
  it('sits next to Climbs and Filters', async () => {
    uphillApi();

    await renderApp('/?latitude=45.9&longitude=6.13');

    expect(
      within(await screen.findByRole('tablist'))
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual(['Climbs', 'Filters', 'Plan']);
  });

  it('asks for a starting point before planning', async () => {
    const sent = uphillApi();
    const { user } = await openPlan();

    await submit(user);

    expect(plan().getByText('Place your starting point on the map first.')).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('places the starting point where the map is clicked, and moves it', async () => {
    uphillApi();
    await openPlan();

    fakeMap.click(POINT);
    fakeMap.click({ latitude: 45.95, longitude: 6.2 });

    const map = within(screen.getByRole('region', { name: 'Map of nearby climbs' }));
    expect(map.getAllByRole('button', { name: 'Starting point' })).toHaveLength(1);
    expect(
      fakeMap.props()?.markers?.find((marker) => marker.id === 'plan-start')?.position,
    ).toEqual({
      latitude: 45.95,
      longitude: 6.2,
    });
  });

  it('does not place a starting point while another tab is open', async () => {
    uphillApi();
    await renderApp('/?latitude=45.9&longitude=6.13');
    await screen.findByRole('tab', { name: 'Plan' });

    fakeMap.click(POINT);

    expect(screen.queryByRole('button', { name: 'Starting point' })).not.toBeInTheDocument();
  });

  it('sends the request with the chosen Gradient range, length, radius and Activity', async () => {
    const sent = uphillApi();
    const { user } = await openPlan();
    fakeMap.click(POINT);

    await user.selectOptions(plan().getByRole('combobox', { name: 'Gradient from' }), '3%');
    await user.selectOptions(plan().getByRole('combobox', { name: 'Gradient to' }), '7%');
    await user.selectOptions(plan().getByRole('combobox', { name: 'Length' }), '5 km');
    await user.selectOptions(plan().getByRole('combobox', { name: 'Within' }), '25 km');
    await user.selectOptions(plan().getByRole('combobox', { name: 'Activity' }), 'Road cycling');
    await submit(user);

    await waitFor(() => {
      expect(sent).toEqual([
        {
          start: POINT,
          minGradient: 0.03,
          maxGradient: 0.07,
          length: 5000,
          radius: 25_000,
          activity: 'road_cycling',
        },
      ]);
    });
  });

  it('starts from sensible defaults', async () => {
    const sent = uphillApi();
    const { user } = await openPlan();
    fakeMap.click(POINT);

    await submit(user);

    await waitFor(() => {
      expect(sent[0]).toEqual({
        start: POINT,
        minGradient: 0.02,
        maxGradient: 0.05,
        length: 3000,
        radius: 10_000,
        activity: 'running',
      });
    });
  });

  it('shows that it is working and cannot be sent twice', async () => {
    const sent = uphillApi(async () => {
      await delay(50);
      return HttpResponse.json({ itineraries: [anUphillItinerary()] });
    });
    const { user } = await openPlan();
    fakeMap.click(POINT);

    await submit(user);
    const pending = plan().getByRole('button', { name: 'Finding itineraries…' });
    expect(pending).toBeDisabled();
    await user.click(pending);

    await plan().findByRole('list', { name: 'Proposed itineraries' });
    expect(sent).toHaveLength(1);
  });

  it('lists the proposals with their measurements and how they match', async () => {
    uphillApi(() =>
      HttpResponse.json({
        itineraries: [
          anUphillItinerary(),
          anUphillItinerary({
            exact: false,
            averageGradient: 0.017,
            differences: [{ kind: 'gradient', min: 0.02, max: 0.05, actual: 0.017 }],
          }),
        ],
      }),
    );
    const { user } = await openPlan();
    fakeMap.click(POINT);

    await submit(user);

    const [firstItem, secondItem] = within(
      await plan().findByRole('list', { name: 'Proposed itineraries' }),
    ).getAllByRole('listitem');
    if (!firstItem || !secondItem) {
      throw new Error('two proposals expected');
    }
    const first = within(firstItem);
    expect(first.getByText('Matches your request')).toBeInTheDocument();
    expect(first.getByText('3 km')).toBeInTheDocument();
    expect(first.getByText('135 m')).toBeInTheDocument();
    expect(first.getByText('4.5%')).toBeInTheDocument();
    expect(first.getByText('8%')).toBeInTheDocument();
    expect(first.getByText('Cat 4')).toBeInTheDocument();
    expect(first.getByText('800 m away')).toBeInTheDocument();
    expect(within(secondItem).getByText('Close match: 1.7% instead of 2%–5%')).toBeInTheDocument();
  });

  it('draws the selected proposal on the map with its Elevation Profile', async () => {
    uphillApi(() =>
      HttpResponse.json({
        itineraries: [
          anUphillItinerary(),
          anUphillItinerary({
            averageGradient: 0.03,
            path: {
              type: 'LineString',
              coordinates: [
                [6, 45],
                [6, 45.02],
              ],
            },
          }),
        ],
      }),
    );
    const { user } = await openPlan();
    fakeMap.click(POINT);
    await submit(user);
    const list = within(await plan().findByRole('list', { name: 'Proposed itineraries' }));

    expect(screen.getByText('Line through 4 points')).toBeInTheDocument();
    expect(
      plan().getByRole('img', { name: 'Elevation profile: 3 km from 450 m to 585 m.' }),
    ).toBeInTheDocument();

    const [, showSecond] = list.getAllByRole('button', { name: /^Show/ });
    if (!showSecond) {
      throw new Error('a second proposal expected');
    }
    await user.click(showSecond);

    expect(screen.getByText('Line through 2 points')).toBeInTheDocument();
  });

  it('uses the Visitor’s units', async () => {
    stubLanguages('en-US');
    uphillApi();
    const { user } = await openPlan();
    fakeMap.click(POINT);

    await submit(user);

    const list = within(await plan().findByRole('list', { name: 'Proposed itineraries' }));
    expect(list.getByText('443 ft')).toBeInTheDocument();
  });

  it('suggests what to change when nothing is found', async () => {
    uphillApi(() => HttpResponse.json({ itineraries: [] }));
    const { user } = await openPlan();
    fakeMap.click(POINT);

    await submit(user);

    expect(await plan().findByText('No itinerary found around this point.')).toBeInTheDocument();
    expect(
      plan().getByText('Try another point, another Activity or a wider Gradient range.'),
    ).toBeInTheDocument();
  });

  it('explains when planning is unavailable and keeps the request', async () => {
    uphillApi(() => apiErrorResponse(503, 'ROUTING_UNAVAILABLE'));
    const { user } = await openPlan();
    fakeMap.click(POINT);
    await user.selectOptions(plan().getByRole('combobox', { name: 'Length' }), '5 km');

    await submit(user);

    expect(await plan().findByRole('alert')).toHaveTextContent(
      'Planning is temporarily unavailable. Please try again in a moment.',
    );
    expect(plan().getByRole('combobox', { name: 'Length' })).toHaveDisplayValue('5 km');
  });
});
