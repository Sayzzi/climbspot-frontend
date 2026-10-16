import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  anAccount,
  anAscent,
  anAscentSummary,
  apiErrorResponse,
  handlers,
  nearbyResults,
  recorder,
} from '@/test/api';
import { expectAccessible } from '@/test/axe';
import { fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const ID = '00000000-0000-4000-8000-000000000001';
const PAGE = `/ascents/${ID}`;

let marks: ReturnType<typeof recorder>;
let unmarks: ReturnType<typeof recorder>;

function api({ favourite }: { favourite?: boolean } = {}) {
  marks = recorder();
  unmarks = recorder();
  server.use(
    handlers.me(() => HttpResponse.json(anAccount())),
    handlers.ascent((id) =>
      HttpResponse.json(
        anAscent({ id, name: 'Le Mur', ...(favourite !== undefined && { favourite }) }),
      ),
    ),
    handlers.markFavourite((_id, request) => {
      marks.record(request);
      return new HttpResponse(null, { status: 204 });
    }),
    handlers.unmarkFavourite((_id, request) => {
      unmarks.record(request);
      return new HttpResponse(null, { status: 204 });
    }),
  );
}

const star = () => screen.getByRole('button', { name: 'Keep Le Mur in my favourites' });

describe('Favourite Ascents on an Ascent page', () => {
  beforeEach(() => {
    fakeAuth.signIn();
  });

  it('adds the climb to the signed-in Visitor’s favourites, and confirms it', async () => {
    api({ favourite: false });
    const { user } = await renderApp(PAGE);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });
    expect(star()).toHaveAttribute('aria-pressed', 'false');

    await user.click(star());

    expect(star()).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('status')).toHaveTextContent('Added to your favourites');
    expect(marks.lastUrl()?.pathname).toBe(`/ascents/${ID}/favourite`);
  });

  it('takes it out of them, and confirms it', async () => {
    api({ favourite: true });
    const { user } = await renderApp(PAGE);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });
    expect(star()).toHaveAttribute('aria-pressed', 'true');

    await user.click(star());

    expect(star()).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByRole('status')).toHaveTextContent('Removed from your favourites');
    expect(unmarks.requests).toHaveLength(1);
  });

  it('goes back and explains when the change could not be made', async () => {
    api({ favourite: false });
    server.use(handlers.markFavourite(() => apiErrorResponse(500, 'INTERNAL_ERROR')));
    const { user } = await renderApp(PAGE);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });

    await user.click(star());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong on our side. Please try again.',
    );
    await waitFor(() => {
      expect(star()).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('stays accessible', async () => {
    api({ favourite: false });
    await renderApp(PAGE);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });

    await expectAccessible();
  });
});

describe('Favourite Ascents for a Visitor who is not signed in', () => {
  it('invites to sign in instead of offering the star', async () => {
    api();
    await renderApp(PAGE);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });

    expect(screen.queryByRole('button', { name: /favourites/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to keep this climb' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });
});

describe('Favourite Ascents in the search results', () => {
  const HERE = '/?latitude=45&longitude=6';
  const results = () => within(screen.getByRole('list', { name: 'Nearby climbs' }));

  function nearbyApi() {
    api();
    server.use(
      handlers.nearby(() =>
        nearbyResults([
          anAscentSummary({ id: 'kept', name: 'Le Mur', favourite: true }),
          anAscentSummary({ id: 'other', name: 'La Bosse', favourite: false }),
        ]),
      ),
    );
  }

  it('shows which climbs are favourites, and changes one without opening it', async () => {
    fakeAuth.signIn();
    nearbyApi();
    const { user, router } = await renderApp(HERE);
    await screen.findByRole('list', { name: 'Nearby climbs' });
    const bosse = results().getByRole('button', { name: 'Keep La Bosse in my favourites' });
    expect(results().getByRole('button', { name: 'Keep Le Mur in my favourites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(bosse).toHaveAttribute('aria-pressed', 'false');

    await user.click(bosse);

    expect(bosse).toHaveAttribute('aria-pressed', 'true');
    expect(await results().findByRole('status')).toHaveTextContent('Added to your favourites');
    expect(marks.lastUrl()?.pathname).toBe('/ascents/other/favourite');
    expect(router.state.location.pathname).toBe('/');
    expect(results().getByRole('button', { name: 'La Bosse' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('shows no star to a Visitor who is not signed in', async () => {
    nearbyApi();
    await renderApp(HERE);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    expect(results().queryByRole('button', { name: /favourites/ })).not.toBeInTheDocument();
    expect(results().queryByRole('link', { name: /Sign in/ })).not.toBeInTheDocument();
  });

  it('stays accessible', async () => {
    fakeAuth.signIn();
    nearbyApi();
    await renderApp(HERE);
    await screen.findByRole('list', { name: 'Nearby climbs' });

    await expectAccessible();
  });
});
