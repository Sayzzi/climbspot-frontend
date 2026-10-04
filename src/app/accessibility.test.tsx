import { screen } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  anAccount,
  anAscent,
  anAscentSummary,
  handlers,
  nearbyResults,
  savedItinerariesApi,
} from '@/test/api';
import { expectAccessible } from '@/test/axe';
import { fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const ID = '00000000-0000-4000-8000-000000000001';

beforeEach(() => {
  server.use(
    handlers.nearby(() => nearbyResults([anAscentSummary({ id: ID, name: 'Le Mur' })])),
    handlers.ascent(() => HttpResponse.json(anAscent({ id: ID, name: 'Le Mur' }))),
    handlers.me(() => HttpResponse.json(anAccount())),
  );
  savedItinerariesApi();
});

describe('Accessibility (WCAG 2.2 AA)', () => {
  it.each([
    ['the home page and its panels', '/?latitude=45&longitude=6', 'heading', 'ClimbSpot'],
    ['a climb’s page', `/ascents/${ID}`, 'heading', 'Le Mur'],
    ['the sign-in page', '/sign-in', 'heading', 'Sign in'],
  ])('holds on %s', async (_, path, role, name) => {
    await renderApp(path);
    await screen.findByRole(role, { name, level: 1 });

    await expectAccessible();
  });

  it.each([
    ['the account page', '/account', 'Your account'],
    ['adding a climb', '/ascents/new', 'Add a climb'],
    ['My itineraries', '/itineraries', 'My itineraries'],
  ])('holds on %s, signed in', async (_, path, name) => {
    fakeAuth.signIn();
    await renderApp(path);
    await screen.findByRole('heading', { name, level: 1 });

    await expectAccessible();
  });
});

describe('Skipping to the content', () => {
  it('is the first thing to reach with the keyboard, and leads to the main content', async () => {
    const { user } = await renderApp('/sign-in');
    await screen.findByRole('heading', { name: 'Sign in', level: 1 });

    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveFocus();
    await user.click(skip);

    expect(screen.getByRole('main')).toHaveFocus();
  });
});
