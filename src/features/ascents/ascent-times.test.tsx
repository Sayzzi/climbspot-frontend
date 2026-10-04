import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  anAccount,
  anAscent,
  anAscentSummary,
  handlers,
  nearbyResults,
  recorder,
} from '@/test/api';
import { fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const ID = '00000000-0000-4000-8000-000000000001';

const results = () => screen.findByRole('list', { name: 'Nearby climbs' });

function signedIn() {
  server.use(handlers.me(() => HttpResponse.json(anAccount())));
  fakeAuth.signIn();
}

function ascentWithTimes(ascentTimes: { startedAt: string; seconds: number }[]) {
  const asked = recorder();
  server.use(
    handlers.ascent(() => HttpResponse.json(anAscent({ id: ID, name: 'Le Mur' }))),
    handlers.myAscentTimes((_id, request) => {
      asked.record(request);
      return HttpResponse.json({ ascentTimes });
    }),
  );
  return asked;
}

describe('Ascent Times', () => {
  it('show the signed-in Visitor’s best on Ascent cards', async () => {
    signedIn();
    server.use(
      handlers.nearby(() =>
        nearbyResults([
          { ...anAscentSummary({ name: 'Le Mur' }), myAscentTimes: { best: 312, count: 3 } },
          anAscentSummary({ name: 'La Bosse' }),
        ]),
      ),
    );
    await renderApp('/?latitude=45&longitude=6');

    const [mur, bosse] = within(await results()).getAllByRole('listitem');
    if (!mur || !bosse) {
      throw new Error('two Ascents expected');
    }
    expect(await within(mur).findByText('Your best: 5:12 · up 3 times')).toBeInTheDocument();
    expect(within(bosse).queryByText(/Your best/)).not.toBeInTheDocument();
  });

  it('list every Ascent Time on the Ascent’s page, newest first, the best marked', async () => {
    signedIn();
    ascentWithTimes([
      { startedAt: '2026-10-02T07:10:00.000Z', seconds: 320 },
      { startedAt: '2026-09-20T07:10:00.000Z', seconds: 3725 },
      { startedAt: '2026-09-12T07:10:00.000Z', seconds: 312 },
    ]);
    await renderApp(`/ascents/${ID}`);

    const times = within(await screen.findByRole('region', { name: 'Your times' }));
    expect(times.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Oct 2, 2026 5:20',
      'Sep 20, 2026 1:02:05',
      'Sep 12, 2026 5:12 Best',
    ]);
    expect(times.getByText('Powered by Strava')).toBeVisible();
  });

  it('show nothing on the Ascent’s page without any', async () => {
    signedIn();
    const asked = ascentWithTimes([]);
    await renderApp(`/ascents/${ID}`);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });

    await expect.poll(() => asked.requests.length).toBe(1);
    expect(screen.queryByRole('region', { name: 'Your times' })).not.toBeInTheDocument();
  });

  it('are never asked for when nobody is signed in', async () => {
    const asked = ascentWithTimes([{ startedAt: '2026-10-02T07:10:00.000Z', seconds: 320 }]);
    await renderApp(`/ascents/${ID}`);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });

    expect(asked.requests).toHaveLength(0);
    expect(screen.queryByRole('region', { name: 'Your times' })).not.toBeInTheDocument();
  });
});
