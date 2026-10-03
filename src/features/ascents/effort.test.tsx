import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anAscent, anAscentSummary, handlers, nearbyResults } from '@/test/api';
import { stubLanguages } from '@/test/languages';
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
