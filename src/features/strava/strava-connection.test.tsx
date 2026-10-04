import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { leaveFor } from '@/shared/lib/leave-for';
import {
  anAccount,
  apiErrorResponse,
  aStravaConnection,
  handlers,
  STRAVA_AUTHORIZE_URL,
  stravaApi,
} from '@/test/api';
import { FAKE_TOKEN, fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

// Leaving for Strava's page is a full navigation, which jsdom cannot make.
vi.mock('@/shared/lib/leave-for', () => ({ leaveFor: vi.fn() }));

beforeEach(() => {
  vi.mocked(leaveFor).mockClear();
});

function signedIn() {
  server.use(handlers.me(() => HttpResponse.json(anAccount())));
  fakeAuth.signIn();
}

const section = () => within(screen.getByRole('region', { name: 'Strava' }));

async function openAccount() {
  const app = await renderApp('/account');
  await screen.findByRole('region', { name: 'Strava' });
  return app;
}

describe('Strava section on the Account page', () => {
  it('says what ClimbSpot will read, and leaves for Strava to connect', async () => {
    const strava = stravaApi();
    signedIn();
    const { user } = await openAccount();

    expect(
      await section().findByText(/reads your runs and trail runs, private ones included/),
    ).toBeVisible();
    await user.click(section().getByRole('button', { name: 'Connect with Strava' }));

    await waitFor(() => {
      expect(leaveFor).toHaveBeenCalledWith(STRAVA_AUTHORIZE_URL);
    });
    expect(strava.requestsTo('GET', '/strava/authorize')[0]?.headers.get('Authorization')).toBe(
      `Bearer ${FAKE_TOKEN}`,
    );
  });

  it('shows the connected athlete, powered by Strava', async () => {
    stravaApi(aStravaConnection());
    signedIn();
    await openAccount();

    expect(await section().findByText('Connected as Ada Runner')).toBeVisible();
    expect(section().getByText('Powered by Strava')).toBeVisible();
    expect(
      section().queryByRole('button', { name: 'Connect with Strava' }),
    ).not.toBeInTheDocument();
  });

  it('explains when Strava cannot be reached', async () => {
    stravaApi(undefined, { authorize: () => apiErrorResponse(503, 'STRAVA_UNAVAILABLE') });
    signedIn();
    const { user } = await openAccount();

    await user.click(await section().findByRole('button', { name: 'Connect with Strava' }));

    expect(await section().findByRole('alert')).toHaveTextContent(
      'Strava is unavailable right now, or its limits are reached. Please try again later.',
    );
    expect(leaveFor).not.toHaveBeenCalled();
  });

  it('ends the connection once the Visitor confirms what is erased', async () => {
    const strava = stravaApi(aStravaConnection());
    signedIn();
    const { user } = await openAccount();

    await user.click(await section().findByRole('button', { name: 'End the connection' }));
    expect(
      section().getByText(
        'End the Strava connection? ClimbSpot erases your imported runs, your times on climbs and the flat pace from Strava.',
      ),
    ).toBeVisible();
    await user.click(section().getByRole('button', { name: 'Cancel' }));
    expect(strava.requestsTo('DELETE', '/strava/connection')).toHaveLength(0);

    await user.click(section().getByRole('button', { name: 'End the connection' }));
    await user.click(section().getByRole('button', { name: 'Yes, end it' }));

    expect(await section().findByRole('button', { name: 'Connect with Strava' })).toBeVisible();
    expect(strava.requestsTo('DELETE', '/strava/connection')).toHaveLength(1);
  });

  it('is not there for a Visitor who is not signed in', async () => {
    stravaApi();
    await renderApp('/account');

    await screen.findByText('Sign in to see your account.');
    expect(screen.queryByRole('region', { name: 'Strava' })).not.toBeInTheDocument();
  });
});

describe('Coming back from Strava', () => {
  it('hands the code to the API, then shows the Account page connected', async () => {
    const strava = stravaApi();
    signedIn();
    const { router } = await renderApp('/strava/callback?code=the-code&state=the-state&scope=read');

    expect(await screen.findByText('Connected as Ada Runner')).toBeVisible();
    expect(router.state.location.pathname).toBe('/account');
    const [connecting] = strava.requestsTo('POST', '/strava/connection');
    expect(await connecting?.json()).toEqual({ code: 'the-code', state: 'the-state' });
    expect(strava.requestsTo('POST', '/strava/connection')).toHaveLength(1);
  });

  it('says so when the Visitor did not allow ClimbSpot', async () => {
    const strava = stravaApi();
    signedIn();
    const { user, router } = await renderApp('/strava/callback?error=access_denied&state=s');

    expect(
      await screen.findByText(
        'Strava was not connected: ClimbSpot was not allowed to read your runs.',
      ),
    ).toBeVisible();
    expect(strava.requestsTo('POST', '/strava/connection')).toHaveLength(0);
    await user.click(screen.getByRole('link', { name: 'Back to your account' }));
    expect(router.state.location.pathname).toBe('/account');
  });

  it('explains a refused authorisation', async () => {
    stravaApi(undefined, { connect: () => apiErrorResponse(422, 'STRAVA_AUTHORIZATION_REFUSED') });
    signedIn();
    await renderApp('/strava/callback?code=old&state=s');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This Strava authorisation cannot be used. Connect again from your account.',
    );
  });
});

describe('What Strava gives, as the connection comes and goes', () => {
  const paceButton = () =>
    within(screen.getByRole('banner')).getByRole('button', { name: /^(Set pace|Flat pace: .+)$/ });

  /** The account and the Strava Connection, Strava's Flat Pace following the connection. */
  function connectionWithPace(connected: boolean) {
    let isConnected = connected;
    const changes: unknown[] = [];
    const account = () =>
      anAccount(
        isConnected
          ? { flatPace: 312, flatPaceSource: 'strava', stravaFlatPace: 312 }
          : { flatPace: null, flatPaceSource: null, stravaFlatPace: null },
      );
    server.use(
      handlers.me(() => HttpResponse.json(account())),
      handlers.updateMe(async (request) => {
        changes.push(await request.json());
        return HttpResponse.json(account());
      }),
    );
    const strava = stravaApi(connected ? aStravaConnection() : undefined, {
      connect: () => {
        isConnected = true;
        strava.set(aStravaConnection());
        return HttpResponse.json(aStravaConnection());
      },
      end: () => {
        isConnected = false;
        strava.set({
          status: 'none',
          athlete: null,
          connectedAt: null,
          lastSyncAt: null,
          recordedRuns: 0,
        });
        return new HttpResponse(null, { status: 204 }) as never;
      },
    });
    return { changes };
  }

  it('lets go of Strava’s Flat Pace when the connection ends', async () => {
    const { changes } = connectionWithPace(true);
    fakeAuth.signIn();
    const { user } = await openAccount();
    await waitFor(() => {
      expect(paceButton()).toHaveAccessibleName('Flat pace: 5:12/km, from Strava');
    });

    await user.click(await section().findByRole('button', { name: 'End the connection' }));
    await user.click(section().getByRole('button', { name: 'Yes, end it' }));

    await waitFor(() => {
      expect(paceButton()).toHaveAccessibleName('Set pace');
    });
    fakeAuth.renewToken();
    await section().findByRole('button', { name: 'Connect with Strava' });
    expect(changes).toEqual([]);
  });

  it('takes up Strava’s Flat Pace once connected', async () => {
    connectionWithPace(false);
    fakeAuth.signIn();
    await renderApp('/strava/callback?code=the-code&state=the-state');

    await waitFor(() => {
      expect(paceButton()).toHaveAccessibleName('Flat pace: 5:12/km, from Strava');
    });
  });

  it('says when the first import stopped at Strava’s limits', async () => {
    // Strava's limits are still reached when signing in synchronises.
    stravaApi(aStravaConnection({ lastSyncAt: null, recordedRuns: 4 }), {
      sync: () => apiErrorResponse(503, 'STRAVA_UNAVAILABLE'),
    });
    signedIn();
    await openAccount();

    expect(
      await section().findByText(
        'Not all your runs are imported yet: Strava’s limits were reached. The import carries on at the next synchronisation.',
      ),
    ).toBeVisible();
  });
});
