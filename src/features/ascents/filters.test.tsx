import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { anAscentSummary, handlers, nearbyResults, recorder } from '@/test/api';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const AT_LE_BOURG = '/?latitude=45&longitude=6';

function nearbyApi() {
  const sent = recorder();
  server.use(
    handlers.nearby((request) => {
      sent.record(request);
      return nearbyResults([anAscentSummary()]);
    }),
  );
  return sent;
}

const activities = () => within(screen.getByRole('group', { name: 'Activities' }));
const categories = () => within(screen.getByRole('group', { name: 'Categories' }));

describe('Search filters', () => {
  it('sends the chosen Activities to the API and keeps them in the URL', async () => {
    const sent = nearbyApi();
    const { router, user } = await renderApp(AT_LE_BOURG);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    await user.click(activities().getByRole('checkbox', { name: 'Road cycling' }));
    await user.click(activities().getByRole('checkbox', { name: 'Gravel cycling' }));

    await waitFor(() => {
      expect(sent.lastUrl()?.searchParams.getAll('activity')).toEqual([
        'road_cycling',
        'gravel_cycling',
      ]);
    });
    expect(router.state.location.search).toMatchObject({
      latitude: 45,
      longitude: 6,
      activity: ['road_cycling', 'gravel_cycling'],
    });
  });

  it('sends the chosen Categories to the API', async () => {
    const sent = nearbyApi();
    const { user } = await renderApp(AT_LE_BOURG);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    await user.click(categories().getByRole('checkbox', { name: 'Cat 3' }));
    await user.click(categories().getByRole('checkbox', { name: 'HC' }));

    await waitFor(() => {
      expect(sent.lastUrl()?.searchParams.getAll('category')).toEqual(['cat3', 'hc']);
    });
  });

  it('removes a filter when it is unchecked', async () => {
    const sent = nearbyApi();
    const { router, user } = await renderApp(`${AT_LE_BOURG}&activity=["running"]`);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    await user.click(activities().getByRole('checkbox', { name: 'Running' }));

    await waitFor(() => {
      expect(sent.lastUrl()?.searchParams.getAll('activity')).toEqual([]);
    });
    expect(router.state.location.search).not.toHaveProperty('activity');
  });

  it('searches within the chosen radius', async () => {
    const sent = nearbyApi();
    const { router, user } = await renderApp(AT_LE_BOURG);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Search radius' }), '25 km');

    await waitFor(() => {
      expect(sent.lastUrl()?.searchParams.get('radius')).toBe('25000');
    });
    expect(router.state.location.search).toMatchObject({ radius: 25_000 });
  });

  it('uses a 10 km radius by default', async () => {
    const sent = nearbyApi();

    await renderApp(AT_LE_BOURG);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    expect(screen.getByRole('combobox', { name: 'Search radius' })).toHaveDisplayValue('10 km');
    expect(sent.lastUrl()?.searchParams.get('radius')).toBeNull();
  });

  it('restores a shared search from its URL', async () => {
    const sent = nearbyApi();

    await renderApp(`${AT_LE_BOURG}&radius=5000&activity=["trail_running"]&category=["cat4"]`);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    expect(activities().getByRole('checkbox', { name: 'Trail running' })).toBeChecked();
    expect(activities().getByRole('checkbox', { name: 'Running' })).not.toBeChecked();
    expect(categories().getByRole('checkbox', { name: 'Cat 4' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Search radius' })).toHaveDisplayValue('5 km');
    const url = sent.lastUrl();
    expect(url?.searchParams.get('radius')).toBe('5000');
    expect(url?.searchParams.getAll('activity')).toEqual(['trail_running']);
    expect(url?.searchParams.getAll('category')).toEqual(['cat4']);
  });

  it('shows a shared radius that is not one of the presets', async () => {
    const sent = nearbyApi();

    await renderApp(`${AT_LE_BOURG}&radius=15000`);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    expect(screen.getByRole('combobox', { name: 'Search radius' })).toHaveDisplayValue('15 km');
    expect(sent.lastUrl()?.searchParams.get('radius')).toBe('15000');
  });

  it('ignores filters that do not exist', async () => {
    const sent = nearbyApi();

    await renderApp(`${AT_LE_BOURG}&activity=["swimming"]&radius=999999`);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    expect(sent.lastUrl()?.searchParams.getAll('activity')).toEqual([]);
    expect(sent.lastUrl()?.searchParams.get('radius')).toBeNull();
  });
});
