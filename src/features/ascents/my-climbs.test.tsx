import { screen, waitFor, within } from '@testing-library/react';
import { delay, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  anAccount,
  anAscent,
  anAscentSummary,
  apiErrorResponse,
  handlers,
  recorder,
} from '@/test/api';
import { expectAccessible } from '@/test/axe';
import { fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const PAGE = '/my-climbs';

function favourite(id: string, name: string) {
  const { distanceToStart: _distance, ...summary } = anAscentSummary({ id, name });
  return summary;
}

let unmarks: ReturnType<typeof recorder>;

function api(favourites = [favourite('mur', 'Le Mur'), favourite('bosse', 'La Bosse')]) {
  unmarks = recorder();
  server.use(
    handlers.me(() => HttpResponse.json(anAccount())),
    handlers.favourites(() => HttpResponse.json({ ascents: favourites })),
    handlers.ascent((id) => HttpResponse.json(anAscent({ id, name: 'Le Mur', favourite: true }))),
    handlers.unmarkFavourite((_id, request) => {
      unmarks.record(request);
      return new HttpResponse(null, { status: 204 });
    }),
  );
}

const list = () => within(screen.getByRole('list', { name: 'Favourite climbs' }));

describe('My climbs', () => {
  beforeEach(() => {
    fakeAuth.signIn();
  });

  it('is reached from the account menu', async () => {
    api();
    const { user, router } = await renderApp('/account');

    await user.click(await screen.findByRole('button', { name: 'Ada’s menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'My climbs' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'My climbs' })).toBeVisible();
    expect(router.state.location.pathname).toBe(PAGE);
  });

  it('lists the favourites as the API orders them, with their key figures', async () => {
    api();
    await renderApp(PAGE);

    await screen.findByRole('list', { name: 'Favourite climbs' });
    expect(
      list()
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Le Mur', 'La Bosse']);
    const [first] = list().getAllByRole('listitem');
    if (!first) throw new Error('a favourite expected');
    const mur = within(first);
    expect(mur.getByText('Length').nextSibling).toHaveTextContent('1.2 km');
    expect(mur.getByText('Category').nextSibling).toHaveTextContent('Cat 4');
  });

  it('opens a favourite’s page', async () => {
    api();
    const { user, router } = await renderApp(PAGE);

    await user.click(await screen.findByRole('link', { name: 'View Le Mur' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Le Mur' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/ascents/mur');
  });

  it('removes a favourite at once, and confirms it', async () => {
    api();
    const { user } = await renderApp(PAGE);
    await screen.findByRole('list', { name: 'Favourite climbs' });

    await user.click(list().getByRole('button', { name: 'Keep Le Mur in my favourites' }));

    expect(list().queryByRole('heading', { name: 'Le Mur' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Favourites' })).toHaveFocus();
    expect(await screen.findByRole('status')).toHaveTextContent('Removed from your favourites');
    expect(unmarks.lastUrl()?.pathname).toBe('/ascents/mur/favourite');
  });

  it('puts a favourite back and explains when removing it failed', async () => {
    api();
    server.use(handlers.unmarkFavourite(() => apiErrorResponse(500, 'INTERNAL_ERROR')));
    const { user } = await renderApp(PAGE);
    await screen.findByRole('list', { name: 'Favourite climbs' });

    await user.click(list().getByRole('button', { name: 'Keep Le Mur in my favourites' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong on our side. Please try again.',
    );
    await waitFor(() => {
      expect(list().getByRole('heading', { name: 'Le Mur' })).toBeVisible();
    });
  });

  it('invites to find climbs when there is no favourite yet', async () => {
    api([]);
    await renderApp(PAGE);

    expect(
      await screen.findByText(
        'No favourite climbs yet. Press the star on a climb to keep it here.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Find climbs' })).toHaveAttribute('href', '/');
  });

  it('says it is loading', async () => {
    api();
    server.use(
      handlers.favourites(async () => {
        await delay(200);
        return HttpResponse.json({ ascents: [] });
      }),
    );
    await renderApp(PAGE);

    expect(await screen.findByText('Loading your climbs…')).toBeVisible();
  });

  it('explains a failure to load, and retries', async () => {
    api();
    let failing = true;
    server.use(
      handlers.favourites(() =>
        failing
          ? apiErrorResponse(500, 'INTERNAL_ERROR')
          : HttpResponse.json({ ascents: [favourite('mur', 'Le Mur')] }),
      ),
    );
    const { user } = await renderApp(PAGE);
    const retry = await screen.findByRole('button', { name: 'Try again' });

    failing = false;
    await user.click(retry);

    expect(await screen.findByRole('list', { name: 'Favourite climbs' })).toBeVisible();
  });

  it('stays accessible', async () => {
    api();
    await renderApp(PAGE);
    await screen.findByRole('list', { name: 'Favourite climbs' });

    await expectAccessible();
  });
});

describe('My climbs for a Visitor who is not signed in', () => {
  it('invites to sign in', async () => {
    api();
    await renderApp(PAGE);

    expect(await screen.findByText('Sign in to see the climbs you keep.')).toBeVisible();
  });
});
