import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anAccount, handlers, nearbyResults, stravaApi } from '@/test/api';
import { fakeAuth } from '@/test/fake-auth';
import { setFlatPace } from '@/test/pace';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const paceButton = () => screen.getByRole('button', { name: /^(Set pace|Flat pace: .+)$/ });

function accountApi(flatPace: number | null) {
  // The Account page shows the Strava section too.
  stravaApi();
  const changes: unknown[] = [];
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.me(() => HttpResponse.json(anAccount({ flatPace }))),
    handlers.updateMe(async (request) => {
      const body = (await request.json()) as { flatPace?: number };
      changes.push(body);
      return HttpResponse.json(anAccount({ flatPace: body.flatPace ?? flatPace }));
    }),
  );
  return changes;
}

describe('Flat Pace on the account', () => {
  it('comes from the account once signed in, on any device', async () => {
    accountApi(300);
    fakeAuth.signIn();
    await renderApp('/');

    await waitFor(() => {
      expect(paceButton()).toHaveAccessibleName('Flat pace: 5:00/km');
    });
  });

  it('is saved to the account when the Visitor changes it', async () => {
    const changes = accountApi(300);
    fakeAuth.signIn();
    const { user } = await renderApp('/');
    await waitFor(() => {
      expect(paceButton()).toHaveAccessibleName('Flat pace: 5:00/km');
    });

    await setFlatPace(user, '5:30');

    await waitFor(() => {
      expect(changes).toEqual([{ flatPace: 330 }]);
    });
  });

  it('carries the browser’s pace over to an account that has none', async () => {
    localStorage.setItem('climbspot.flatPace', '345');
    const changes = accountApi(null);
    fakeAuth.signIn();
    await renderApp('/');

    await waitFor(() => {
      expect(changes).toEqual([{ flatPace: 345 }]);
    });
    expect(paceButton()).toHaveAccessibleName('Flat pace: 5:45/km');
  });

  it('never overwrites the account’s pace with the browser’s', async () => {
    localStorage.setItem('climbspot.flatPace', '345');
    const changes = accountApi(300);
    fakeAuth.signIn();
    await renderApp('/');

    await waitFor(() => {
      expect(paceButton()).toHaveAccessibleName('Flat pace: 5:00/km');
    });
    expect(changes).toEqual([]);
  });

  it('stays in the browser while signed out', async () => {
    server.use(handlers.nearby(() => nearbyResults([])));
    const { user } = await renderApp('/');

    await setFlatPace(user, '6:00');

    expect(paceButton()).toHaveAccessibleName('Flat pace: 6:00/km');
    expect(localStorage.getItem('climbspot.flatPace')).toBe('360');
  });

  it('is shown on the Account page, and changed from there', async () => {
    const changes = accountApi(300);
    fakeAuth.signIn();
    const { user } = await renderApp('/account');
    const main = within(screen.getByRole('main'));

    expect(await main.findByText('5:00/km')).toBeVisible();
    await user.click(main.getByRole('button', { name: 'Change the flat pace' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Flat pace' }));
    await user.clear(dialog.getByRole('textbox'));
    await user.type(dialog.getByRole('textbox'), '5:30');
    await user.click(dialog.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changes).toEqual([{ flatPace: 330 }]);
    });
    expect(main.getByText('5:30/km')).toBeVisible();
  });
});
