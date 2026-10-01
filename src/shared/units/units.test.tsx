import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { anAscent, anAscentSummary, handlers, nearbyResults } from '@/test/api';
import { stubLanguages } from '@/test/languages';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

function searchApi() {
  server.use(
    handlers.nearby(() =>
      nearbyResults([
        anAscentSummary({
          name: 'Le Mur',
          distanceToStart: 1500,
          length: 1200,
          elevationGain: 96,
          averageGradient: 0.08,
        }),
      ]),
    ),
  );
}

async function firstResult() {
  const [item] = within(await screen.findByRole('list', { name: 'Nearby climbs' })).getAllByRole(
    'listitem',
  );
  if (!item) {
    throw new Error('no result');
  }
  return within(item);
}

const units = () => within(screen.getByRole('radiogroup', { name: 'Units' }));

describe('Units', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses miles and feet for US English browsers', async () => {
    stubLanguages('en-US', 'en');
    searchApi();

    await renderApp('/?latitude=45&longitude=6');

    const result = await firstResult();
    expect(result.getByText('0.9 mi to the start')).toBeInTheDocument();
    expect(result.getByText('0.7 mi')).toBeInTheDocument();
    expect(result.getByText('315 ft')).toBeInTheDocument();
    expect(result.getByText('8%')).toBeInTheDocument();
    expect(units().getByRole('radio', { name: 'Imperial' })).toBeChecked();
  });

  it.each(['en-GB', 'fr-FR', 'de'])(
    'uses metres and kilometres for %s browsers',
    async (language) => {
      stubLanguages(language);
      searchApi();

      await renderApp('/?latitude=45&longitude=6');

      const result = await firstResult();
      expect(result.getByText('1.5 km to the start')).toBeInTheDocument();
      expect(result.getByText('96 m')).toBeInTheDocument();
      expect(units().getByRole('radio', { name: 'Metric' })).toBeChecked();
    },
  );

  it('switches every distance and elevation at once, Gradients excepted', async () => {
    searchApi();
    const { user } = await renderApp('/?latitude=45&longitude=6');
    await firstResult();

    await user.click(units().getByRole('radio', { name: 'Imperial' }));

    const result = await firstResult();
    expect(result.getByText('0.9 mi to the start')).toBeInTheDocument();
    expect(result.getByText('315 ft')).toBeInTheDocument();
    expect(result.getByText('8%')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Search radius' })).toHaveDisplayValue('6.2 mi');
  });

  it('remembers the choice for the next visit', async () => {
    searchApi();
    const first = await renderApp('/?latitude=45&longitude=6');
    await first.user.click(units().getByRole('radio', { name: 'Imperial' }));
    first.unmount();

    await renderApp('/?latitude=45&longitude=6');

    expect((await firstResult()).getByText('315 ft')).toBeInTheDocument();
  });

  it('falls back to the language default when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    searchApi();
    const { user } = await renderApp('/?latitude=45&longitude=6');

    expect((await firstResult()).getByText('96 m')).toBeInTheDocument();
    await user.click(units().getByRole('radio', { name: 'Imperial' }));
    expect((await firstResult()).getByText('315 ft')).toBeInTheDocument();
  });

  it('applies to the Ascent page', async () => {
    stubLanguages('en-US');
    server.use(handlers.ascent(() => HttpResponse.json(anAscent({ elevationGain: 96 }))));

    await renderApp(`/ascents/${anAscent().id}`);

    const measurements = within(await screen.findByRole('region', { name: 'Measurements' }));
    expect(measurements.getByText('Elevation gain').nextSibling).toHaveTextContent('315 ft');
  });
});
