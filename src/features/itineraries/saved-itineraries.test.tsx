import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  aHillSession,
  aLoopItinerary,
  anAccount,
  anUphillItinerary,
  aSavedItinerary,
  handlers,
  nearbyResults,
  savedItinerariesApi,
} from '@/test/api';
import { savedFiles } from '@/test/downloads';
import { FAKE_TOKEN, fakeAuth } from '@/test/fake-auth';
import { fakeMap } from '@/test/fake-map-control';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

type User = Awaited<ReturnType<typeof renderApp>>['user'];
type Kind = 'uphill' | 'loop' | 'session';

const KINDS: Record<Kind, { radio: string; submit: string }> = {
  uphill: { radio: 'Uphill', submit: 'Find uphill itineraries' },
  loop: { radio: 'Loop', submit: 'Find loops' },
  session: { radio: 'Hill session', submit: 'Find hill sessions' },
};

function plannerApi() {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.me(() => HttpResponse.json(anAccount())),
    handlers.uphill(() => HttpResponse.json({ itineraries: [anUphillItinerary()] })),
    handlers.loops(() => HttpResponse.json({ itineraries: [aLoopItinerary()] })),
    handlers.sessions(() => HttpResponse.json({ sessions: [aHillSession()] })),
  );
}

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));
const main = () => within(screen.getByRole('main'));

/** Plans one kind of proposal on the map and waits for the proposals. */
async function propose(kind: Kind) {
  plannerApi();
  const app = await renderApp('/?latitude=45.9&longitude=6.13');
  await app.user.click(await screen.findByRole('tab', { name: 'Plan' }));
  await app.user.click(plan().getByRole('radio', { name: KINDS[kind].radio }));
  fakeMap.click({ latitude: 45.9, longitude: 6.13 });
  await app.user.click(plan().getByRole('button', { name: KINDS[kind].submit }));
  await plan().findByRole('list', { name: 'Proposed itineraries' });
  return app;
}

async function openMyItineraries(saved: Parameters<typeof savedItinerariesApi>[0] = []) {
  plannerApi();
  const api = savedItinerariesApi(saved);
  fakeAuth.signIn();
  const app = await renderApp('/itineraries');
  await screen.findByRole('heading', { level: 1, name: 'My itineraries' });
  return { ...app, api };
}

const savedList = () => main().findByRole('list', { name: 'Saved itineraries' });

async function rename(user: User, name: string) {
  const field = main().getByRole('textbox', { name: 'Name' });
  await user.clear(field);
  await user.type(field, name);
}

describe('Saving a proposal', () => {
  it.each([
    ['uphill', '3 km at 4.5%'],
    ['loop', '5.6 km loop'],
    ['session', '8 × 300 m at 7.5%'],
  ] as const)('saves a %s proposal under its name by default', async (kind, name) => {
    const { sent } = savedItinerariesApi();
    fakeAuth.signIn();
    const { user } = await propose(kind);

    await user.click(plan().getByRole('button', { name: 'Save' }));
    expect(plan().getByRole('textbox', { name: 'Name' })).toHaveValue(name);
    await user.click(plan().getByRole('button', { name: 'Save' }));

    expect(await plan().findByRole('status')).toHaveTextContent('Saved to My itineraries.');
    const [request] = sent.requests;
    expect(request?.method).toBe('POST');
    expect(request?.headers.get('Authorization')).toBe(`Bearer ${FAKE_TOKEN}`);
    const body = (await request?.json()) as { name: string; proposal: { kind: string } };
    expect(body.name).toBe(name);
    expect(body.proposal.kind).toBe(kind);
  });

  it('saves the proposal itself, under the name the Visitor gives', async () => {
    const api = savedItinerariesApi();
    fakeAuth.signIn();
    const { user } = await propose('loop');

    await user.click(plan().getByRole('button', { name: 'Save' }));
    const field = plan().getByRole('textbox', { name: 'Name' });
    await user.clear(field);
    await user.type(field, 'Morning loop');
    await user.click(plan().getByRole('button', { name: 'Save' }));
    await plan().findByRole('status');

    expect(api.saved()).toEqual([
      expect.objectContaining({ name: 'Morning loop', proposal: aLoopItinerary() }),
    ]);
    await user.click(plan().getByRole('link', { name: 'My itineraries' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Morning loop' })).toBeVisible();
  });

  it('leads a Visitor who is not signed in to sign in', async () => {
    const { user, router } = await propose('loop');

    expect(plan().queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    await user.click(plan().getByRole('link', { name: 'Sign in to save' }));

    expect(router.state.location.pathname).toBe('/sign-in');
  });
});

describe('My itineraries', () => {
  it('is reachable from the account menu', async () => {
    plannerApi();
    savedItinerariesApi();
    fakeAuth.signIn();
    const { user, router } = await renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Ada’s menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'My itineraries' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'My itineraries' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/itineraries');
  });

  it('lists Saved Itineraries newest first and shows the first one', async () => {
    await openMyItineraries([
      aSavedItinerary({ name: 'Lakeside loop', savedAt: '2026-10-01T08:00:00.000Z' }),
      aSavedItinerary({
        name: 'Col climb',
        proposal: anUphillItinerary(),
        savedAt: '2026-09-20T08:00:00.000Z',
      }),
    ]);

    const items = within(await savedList()).getAllByRole('listitem');
    expect(items.map((item) => within(item).getByRole('button').textContent)).toEqual([
      expect.stringContaining('Lakeside loop'),
      expect.stringContaining('Col climb'),
    ]);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Lakeside loop' }),
    ).toBeInTheDocument();
    expect(main().getByRole('region', { name: 'Map of Lakeside loop' })).toBeInTheDocument();
    expect(main().getByRole('img', { name: /^Elevation profile: 5.6 km/ })).toBeInTheDocument();
    expect(main().getByText('Height gained')).toBeInTheDocument();
    expect(fakeMap.props()?.line).toHaveLength(4);
  });

  it('shows the Saved Itinerary the Visitor selects', async () => {
    const { user } = await openMyItineraries([
      aSavedItinerary({ name: 'Lakeside loop' }),
      aSavedItinerary({ name: 'Hill repeats', proposal: aHillSession() }),
    ]);
    await savedList();

    await user.click(main().getByRole('button', { name: /^Show Hill repeats/ }));

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Hill repeats' }),
    ).toBeInTheDocument();
    expect(main().getByText('Repeat length')).toBeInTheDocument();
    expect(fakeMap.props()?.dashedLine).toHaveLength(3);
  });

  it('downloads a Saved Itinerary as GPX, and a saved Hill Session as a workout too', async () => {
    const { user } = await openMyItineraries([
      aSavedItinerary({ name: 'Hill repeats', proposal: aHillSession() }),
    ]);
    await screen.findByRole('heading', { level: 2, name: 'Hill repeats' });

    await user.click(main().getByRole('button', { name: 'Download GPX' }));
    await user.click(main().getByRole('button', { name: 'Download workout (FIT)' }));

    await vi.waitFor(() => {
      expect(savedFiles().map((file) => file.name)).toEqual([
        'ClimbSpot hill session Hill repeats.gpx',
        'ClimbSpot hill session Hill repeats.fit',
      ]);
    });
  });

  it('offers no workout for an Itinerary', async () => {
    await openMyItineraries([aSavedItinerary({ name: 'Lakeside loop' })]);
    await screen.findByRole('heading', { level: 2, name: 'Lakeside loop' });

    expect(main().getByRole('button', { name: 'Download GPX' })).toBeInTheDocument();
    expect(
      main().queryByRole('button', { name: 'Download workout (FIT)' }),
    ).not.toBeInTheDocument();
  });

  it('renames a Saved Itinerary', async () => {
    const saved = aSavedItinerary({ name: 'Lakeside loop' });
    const { user, api } = await openMyItineraries([saved]);
    await screen.findByRole('heading', { level: 2, name: 'Lakeside loop' });

    await user.click(main().getByRole('button', { name: 'Rename' }));
    await rename(user, 'Sunday loop');
    await user.click(main().getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Sunday loop' }),
    ).toBeInTheDocument();
    expect(
      within(await savedList()).getByRole('button', { name: /^Show Sunday loop/ }),
    ).toBeInTheDocument();
    const patch = api.sent.requests.find((request) => request.method === 'PATCH');
    expect(new URL(patch?.url ?? '').pathname).toBe(`/saved-itineraries/${saved.id}`);
    expect(await patch?.json()).toEqual({ name: 'Sunday loop' });
  });

  it('deletes a Saved Itinerary once the Visitor confirms', async () => {
    const { user, api } = await openMyItineraries([
      aSavedItinerary({ name: 'Lakeside loop' }),
      aSavedItinerary({ name: 'Col climb', proposal: anUphillItinerary() }),
    ]);
    await screen.findByRole('heading', { level: 2, name: 'Lakeside loop' });

    await user.click(main().getByRole('button', { name: 'Delete' }));
    expect(main().getByText('Delete “Lakeside loop”? This cannot be undone.')).toBeVisible();
    await user.click(main().getByRole('button', { name: 'Cancel' }));
    expect(api.saved()).toHaveLength(2);

    await user.click(main().getByRole('button', { name: 'Delete' }));
    await user.click(main().getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Col climb' })).toBeInTheDocument();
    expect(within(await savedList()).getAllByRole('listitem')).toHaveLength(1);
    expect(api.saved().map((itinerary) => itinerary.name)).toEqual(['Col climb']);
  });

  it('says how to save an itinerary when there is none', async () => {
    const { user, router } = await openMyItineraries([]);

    expect(
      await main().findByText(
        'Nothing saved yet. Plan an itinerary from the Plan tab of the map, then save it.',
      ),
    ).toBeInTheDocument();
    await user.click(main().getByRole('link', { name: 'Plan an itinerary' }));
    expect(router.state.location.pathname).toBe('/');
  });

  it('invites a Visitor who is not signed in to sign in', async () => {
    plannerApi();
    const { sent } = savedItinerariesApi();
    const { user, router } = await renderApp('/itineraries');

    expect(await main().findByText('Sign in to see your saved itineraries.')).toBeVisible();
    expect(sent.requests).toHaveLength(0);
    await user.click(main().getByRole('link', { name: 'Sign in' }));
    expect(router.state.location.pathname).toBe('/sign-in');
  });
});
