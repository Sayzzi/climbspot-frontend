import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anAscent, handlers } from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const ID = '00000000-0000-4000-8000-000000000001';

describe('A climb’s page', () => {
  it('gives the climb’s key figures first, and what it is, like a trail sign', async () => {
    server.use(
      handlers.ascent(() =>
        HttpResponse.json(anAscent({ id: ID, name: 'Le Mur', surface: 'paved', category: 'cat2' })),
      ),
    );
    await renderApp(`/ascents/${ID}`);

    const page = within(await screen.findByRole('article'));
    expect(page.getByRole('heading', { level: 1, name: 'Le Mur' })).toBeVisible();
    expect(
      within(page.getByRole('list', { name: 'About this climb' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(expect.arrayContaining(['Paved', 'Cat 2']));
    expect(
      page
        .getAllByRole('term')
        .slice(0, 3)
        .map((term) => term.textContent),
    ).toEqual(['Length', 'Elevation gain', 'Average gradient']);
  });

  it('marks its Top with a waymark', async () => {
    server.use(handlers.ascent(() => HttpResponse.json(anAscent({ id: ID, name: 'Le Mur' }))));
    await renderApp(`/ascents/${ID}`);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });

    expect(fakeMap.props()?.markers?.find((marker) => marker.label === 'Top')?.tone).toBe(
      'waymark',
    );
  });
});
