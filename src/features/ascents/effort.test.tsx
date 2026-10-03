import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anAscent, anAscentSummary, handlers, nearbyResults, recorder } from '@/test/api';
import { stubLanguages } from '@/test/languages';
import { setFlatPace } from '@/test/pace';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const ID = '00000000-0000-4000-8000-000000000001';

async function firstResult() {
  const [first] = within(await screen.findByRole('list', { name: 'Nearby climbs' })).getAllByRole(
    'listitem',
  );
  if (!first) {
    throw new Error('a result expected');
  }
  return within(first);
}

describe('Km-Effort of Ascents', () => {
  it('shows the Km-Effort of each runnable Ascent in the results', async () => {
    server.use(handlers.nearby(() => nearbyResults([anAscentSummary()])));

    await renderApp('/?latitude=45&longitude=6');

    expect((await firstResult()).getByText('Km-effort').nextSibling).toHaveTextContent('2.2');
  });

  it('shows the Km-Effort on the Ascent page', async () => {
    server.use(handlers.ascent(() => HttpResponse.json(anAscent({ id: ID }))));

    await renderApp(`/ascents/${ID}`);

    const measurements = within(await screen.findByRole('region', { name: 'Measurements' }));
    expect(measurements.getByText('Km-effort').nextSibling).toHaveTextContent('2.2');
  });

  it('keeps Km-Effort in Km-Effort with imperial units', async () => {
    stubLanguages('en-US');
    server.use(handlers.nearby(() => nearbyResults([anAscentSummary()])));

    await renderApp('/?latitude=45&longitude=6');

    expect((await firstResult()).getByText('Km-effort').nextSibling).toHaveTextContent('2.2');
  });

  it('shows no Km-Effort for an Ascent that cannot be run', async () => {
    const { effort: _effort, ...unrunnable } = anAscentSummary({
      surface: 'paved',
      activities: ['road_cycling'],
    });
    server.use(handlers.nearby(() => nearbyResults([unrunnable])));

    await renderApp('/?latitude=45&longitude=6');

    expect((await firstResult()).queryByText('Km-effort')).not.toBeInTheDocument();
  });
});

describe('Estimated Time of Ascents', () => {
  it('invites to set a Flat Pace where the time would be, and opens the setting', async () => {
    server.use(handlers.nearby(() => nearbyResults([anAscentSummary()])));
    const { user } = await renderApp('/?latitude=45&longitude=6');

    const result = await firstResult();
    await user.click(
      within(result.getByText('Estimated time').nextSibling as HTMLElement).getByRole('button', {
        name: 'Set your pace to see the time',
      }),
    );

    expect(screen.getByRole('dialog', { name: 'Flat pace' })).toBeInTheDocument();
  });

  it('shows the Estimated Time from the Flat-Equivalent Distance and the Flat Pace', async () => {
    // 1,811 m flat-equivalent at 5:30/km: 598 s.
    server.use(handlers.nearby(() => nearbyResults([anAscentSummary()])));
    const { user } = await renderApp('/?latitude=45&longitude=6');
    await firstResult();

    await setFlatPace(user, '5:30');

    expect((await firstResult()).getByText('Estimated time').nextSibling).toHaveTextContent(
      '≈ 10 min',
    );
  });

  it('updates every Estimated Time without asking the API again', async () => {
    const sent = recorder();
    server.use(
      handlers.nearby((request) => {
        sent.record(request);
        return nearbyResults([anAscentSummary()]);
      }),
    );
    const { user } = await renderApp('/?latitude=45&longitude=6');
    await firstResult();
    await setFlatPace(user, '5:30');
    const asked = sent.requests.length;

    await setFlatPace(user, '4:00');

    expect((await firstResult()).getByText('Estimated time').nextSibling).toHaveTextContent(
      '≈ 7 min',
    );
    expect(sent.requests).toHaveLength(asked);
  });

  it('keeps an hour exactly in minutes', async () => {
    // 12,000 m flat-equivalent at 5:00/km: 60 min.
    server.use(
      handlers.nearby(() =>
        nearbyResults([
          anAscentSummary({ effort: { kmEffort: 12.5, flatEquivalentDistance: 12_000 } }),
        ]),
      ),
    );
    const { user } = await renderApp('/?latitude=45&longitude=6');
    await firstResult();

    await setFlatPace(user, '5:00');

    expect((await firstResult()).getByText('Estimated time').nextSibling).toHaveTextContent(
      '≈ 60 min',
    );
  });

  it('shows hours and minutes on the Ascent page beyond an hour', async () => {
    // 14,167 m flat-equivalent at 5:30/km: 4,675 s, 78 min.
    server.use(
      handlers.nearby(() => nearbyResults([])),
      handlers.ascent(() =>
        HttpResponse.json(
          anAscent({ id: ID, effort: { kmEffort: 16.2, flatEquivalentDistance: 14_167 } }),
        ),
      ),
    );
    const { user } = await renderApp(`/ascents/${ID}`);
    const measurements = within(await screen.findByRole('region', { name: 'Measurements' }));

    await setFlatPace(user, '5:30');

    expect(measurements.getByText('Estimated time').nextSibling).toHaveTextContent('≈ 1 hr 18 min');
  });
});
