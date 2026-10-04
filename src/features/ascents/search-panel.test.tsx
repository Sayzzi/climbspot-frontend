import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { anAscentSummary, handlers, nearbyResults } from '@/test/api';
import { expectAccessible } from '@/test/axe';
import { fakeMap } from '@/test/fake-map-control';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const HERE = '/?latitude=45&longitude=6';

const panel = () => within(screen.getByRole('complementary', { name: 'Search' }));

describe('The search panel', () => {
  it('leads from an empty search to the filters', async () => {
    server.use(handlers.nearby(() => nearbyResults([])));
    const { user } = await renderApp(HERE);

    await user.click(await panel().findByRole('button', { name: 'Change the filters' }));

    expect(panel().getByRole('tab', { name: 'Filters' })).toHaveAttribute('aria-selected', 'true');
    expect(panel().getByRole('group', { name: 'Activities' })).toBeVisible();
  });

  it('chooses a climb from the list with the keyboard, as from the map', async () => {
    server.use(
      handlers.nearby(() =>
        nearbyResults([
          anAscentSummary({ id: 'a', name: 'Le Mur' }),
          anAscentSummary({ id: 'b', name: 'La Bosse' }),
        ]),
      ),
    );
    const { user } = await renderApp(HERE);
    const choose = await panel().findByRole('button', { name: 'La Bosse' });

    choose.focus();
    await user.keyboard('{Enter}');

    expect(choose).toHaveAttribute('aria-pressed', 'true');
    expect(fakeMap.props()?.markers?.find((marker) => marker.id === 'b')?.selected).toBe(true);
  });

  it('says what each climb is first, like a trail sign', async () => {
    server.use(handlers.nearby(() => nearbyResults([anAscentSummary({ name: 'Le Mur' })])));
    await renderApp(HERE);

    const [climb] = await panel().findAllByRole('article');
    if (!climb) throw new Error('a climb expected');
    const terms = within(climb)
      .getAllByRole('term')
      .map((term) => term.textContent);
    expect(terms.slice(0, 3)).toEqual(['Length', 'Elevation gain', 'Average gradient']);
    expect(within(climb).getByRole('link', { name: 'View Le Mur' })).toHaveTextContent(
      'View details',
    );
    expect(within(climb).getByRole('link', { name: 'View Le Mur' }).textContent).not.toContain('→');
  });

  it('stays accessible with results', async () => {
    server.use(handlers.nearby(() => nearbyResults([anAscentSummary({ name: 'Le Mur' })])));
    await renderApp(HERE);
    await panel().findByRole('list', { name: 'Nearby climbs' });

    await expectAccessible();
  });
});
