import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { aLoopItinerary, anUphillItinerary, handlers, nearbyResults } from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { setFlatPace } from '@/test/pace';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));

async function proposals(kind: 'uphill' | 'loop', itinerary: object) {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.uphill(() => HttpResponse.json({ itineraries: [itinerary] }) as never),
    handlers.loops(() => HttpResponse.json({ itineraries: [itinerary] }) as never),
  );
  const app = await renderApp('/?latitude=45.9&longitude=6.13');
  await app.user.click(await screen.findByRole('tab', { name: 'Plan' }));
  if (kind === 'loop') {
    await app.user.click(plan().getByRole('radio', { name: 'Loop' }));
  }
  fakeMap.click({ latitude: 45.9, longitude: 6.13 });
  await app.user.click(
    plan().getByRole('button', {
      name: kind === 'loop' ? 'Find loops' : 'Find uphill itineraries',
    }),
  );
  const [first] = within(
    await plan().findByRole('list', { name: 'Proposed itineraries' }),
  ).getAllByRole('listitem');
  if (!first) {
    throw new Error('a proposal expected');
  }
  return { ...app, proposal: within(first) };
}

describe('Effort of Itinerary proposals', () => {
  it('shows the Km-Effort of a running Loop, and invites to set a Flat Pace for its time', async () => {
    const { proposal } = await proposals('loop', aLoopItinerary());

    expect(proposal.getByText('Km-effort').nextSibling).toHaveTextContent('6.7');
    expect(
      within(proposal.getByText('Estimated time').nextSibling as HTMLElement).getByRole('button', {
        name: 'Set your pace to see the time',
      }),
    ).toBeInTheDocument();
  });

  it('shows the Estimated Time of running proposals once the Flat Pace is set', async () => {
    // 6,300 m flat-equivalent at 5:30/km: 2,079 s.
    const { user, proposal } = await proposals('loop', aLoopItinerary());

    await setFlatPace(user, '5:30');

    expect(proposal.getByText('Estimated time').nextSibling).toHaveTextContent('≈ 35 min');
  });

  it('shows the effort of a running Uphill Itinerary', async () => {
    // 4,520 m flat-equivalent at 5:30/km: 1,492 s.
    const { user, proposal } = await proposals('uphill', anUphillItinerary());

    await setFlatPace(user, '5:30');

    expect(proposal.getByText('Km-effort').nextSibling).toHaveTextContent('4.4');
    expect(proposal.getByText('Estimated time').nextSibling).toHaveTextContent('≈ 25 min');
  });

  it('shows neither for cycling proposals', async () => {
    const { effort: _effort, ...cycling } = aLoopItinerary();

    const { proposal } = await proposals('loop', cycling);

    expect(proposal.queryByText('Km-effort')).not.toBeInTheDocument();
    expect(proposal.queryByText('Estimated time')).not.toBeInTheDocument();
  });
});
