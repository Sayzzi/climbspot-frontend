import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { leaveFor } from '@/shared/lib/leave-for';
import {
  anAccount,
  apiErrorResponse,
  aStravaConnection,
  handlers,
  nearbyResults,
  STRAVA_AUTHORIZE_URL,
  stravaApi,
} from '@/test/api';
import { fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

vi.mock('@/shared/lib/leave-for', () => ({ leaveFor: vi.fn() }));

beforeEach(() => {
  vi.mocked(leaveFor).mockClear();
  server.use(
    handlers.me(() => HttpResponse.json(anAccount())),
    handlers.nearby(() => nearbyResults([])),
  );
});

const section = () => within(screen.getByRole('region', { name: 'Strava' }));

async function openAccount() {
  fakeAuth.signIn();
  const app = await renderApp('/account');
  await screen.findByRole('region', { name: 'Strava' });
  return app;
}

describe('Synchronising Recorded Runs', () => {
  it('shows how many Recorded Runs were imported, and when last', async () => {
    const connection = aStravaConnection({
      recordedRuns: 12,
      lastSyncAt: '2026-10-01T08:00:00.000Z',
    });
    // Nothing new when signing in synchronises.
    stravaApi(connection, { sync: () => HttpResponse.json(connection) });
    await openAccount();

    expect(
      await section().findByText('12 runs imported · last synchronised Oct 1, 2026'),
    ).toBeVisible();
  });

  it('imports what is new with the Synchronise button', async () => {
    // Nothing new when signing in synchronises; a run finished since by the button.
    let synchronisations = 0;
    const strava = stravaApi(aStravaConnection({ recordedRuns: 12 }), {
      sync: () => {
        synchronisations += 1;
        return HttpResponse.json(aStravaConnection({ recordedRuns: 11 + synchronisations }));
      },
    });
    const { user } = await openAccount();
    await section().findByText(/12 runs imported/);
    const before = strava.requestsTo('POST', '/strava/sync').length;

    await user.click(section().getByRole('button', { name: 'Synchronise' }));

    expect(await section().findByText(/13 runs imported/)).toBeVisible();
    expect(strava.requestsTo('POST', '/strava/sync')).toHaveLength(before + 1);
  });

  it('synchronises once when the Visitor signs in', async () => {
    const strava = stravaApi(aStravaConnection());
    const { user } = await renderApp('/');

    fakeAuth.signIn();

    await waitFor(() => {
      expect(strava.requestsTo('POST', '/strava/sync')).toHaveLength(1);
    });
    await user.click(screen.getByRole('link', { name: 'Add a climb' }));
    await screen.findByRole('heading', { level: 1, name: 'Add a climb' });
    expect(strava.requestsTo('POST', '/strava/sync')).toHaveLength(1);
  });

  it('says the import will carry on when Strava is unavailable', async () => {
    stravaApi(aStravaConnection(), {
      sync: () => apiErrorResponse(503, 'STRAVA_UNAVAILABLE'),
    });
    const { user } = await openAccount();

    await user.click(await section().findByRole('button', { name: 'Synchronise' }));

    expect(await section().findByRole('alert')).toHaveTextContent(
      'Strava is unavailable right now, or its limits are reached: the import carries on at the next synchronisation.',
    );
  });

  it('says the connection was lost, and offers to connect again', async () => {
    // Signing in synchronises fine; the Visitor then withdraws ClimbSpot at Strava.
    let synchronisations = 0;
    const strava = stravaApi(aStravaConnection(), {
      sync: () => {
        synchronisations += 1;
        if (synchronisations === 1) {
          return HttpResponse.json(aStravaConnection());
        }
        strava.set(aStravaConnection({ status: 'lost' }));
        return apiErrorResponse(409, 'STRAVA_CONNECTION_LOST');
      },
    });
    const { user } = await openAccount();

    await user.click(await section().findByRole('button', { name: 'Synchronise' }));

    expect(
      await section().findByText(
        'The Strava connection was lost: ClimbSpot is no longer allowed to read your runs.',
      ),
    ).toBeVisible();
    expect(section().queryByRole('button', { name: 'Synchronise' })).not.toBeInTheDocument();
    await user.click(section().getByRole('button', { name: 'Connect with Strava' }));
    await waitFor(() => {
      expect(leaveFor).toHaveBeenCalledWith(STRAVA_AUTHORIZE_URL);
    });
  });
});
