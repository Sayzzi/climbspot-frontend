import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  aHillSession,
  aLoopItinerary,
  anUphillItinerary,
  handlers,
  nearbyResults,
} from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { stubLanguages } from '@/test/languages';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

type User = Awaited<ReturnType<typeof renderApp>>['user'];

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));

function planningApi() {
  const sent: Record<string, unknown>[] = [];
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.loops(async (request) => {
      sent.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ itineraries: [aLoopItinerary()] }) as never;
    }),
    handlers.sessions(async (request) => {
      sent.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ sessions: [aHillSession()] }) as never;
    }),
    handlers.uphill(async (request) => {
      sent.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ itineraries: [anUphillItinerary()] }) as never;
    }),
  );
  return sent;
}

async function openPlan(kind: 'uphill' | 'loop') {
  const app = await renderApp('/?latitude=45.9&longitude=6.13');
  await app.user.click(await screen.findByRole('tab', { name: 'Plan' }));
  if (kind === 'loop') {
    await app.user.click(plan().getByRole('radio', { name: 'Loop' }));
  }
  fakeMap.click({ latitude: 45.9, longitude: 6.13 });
  return app;
}

async function typeInto(user: User, name: string, text: string) {
  const field = plan().getByRole('textbox', { name });
  await user.clear(field);
  await user.type(field, text);
}

const find = (user: User, kind: 'uphill' | 'loop') =>
  user.click(
    plan().getByRole('button', {
      name: kind === 'loop' ? 'Find loops' : 'Find uphill itineraries',
    }),
  );

describe('Free distances in the Plan tab', () => {
  it.each([
    ['11', 11_000],
    ['7.5', 7500],
    ['3,2', 3200],
  ])('asks for a Loop of any distance: %s km', async (typed, metres) => {
    const sent = planningApi();
    const { user } = await openPlan('loop');

    await typeInto(user, 'Distance (km)', typed);
    await find(user, 'loop');

    await plan().findByRole('list', { name: 'Proposed itineraries' });
    expect(sent[0]).toMatchObject({ distance: metres });
  });

  it('asks for an Uphill Itinerary of any length', async () => {
    const sent = planningApi();
    const { user } = await openPlan('uphill');

    await typeInto(user, 'Length (km)', '1.5');
    await find(user, 'uphill');

    await plan().findByRole('list', { name: 'Proposed itineraries' });
    expect(sent[0]).toMatchObject({ length: 1500 });
  });

  it('takes miles with imperial units', async () => {
    stubLanguages('en-US');
    const sent = planningApi();
    const { user } = await openPlan('loop');

    expect(plan().getByRole('textbox', { name: 'Distance (mi)' })).toHaveDisplayValue('3.11');
    await typeInto(user, 'Distance (mi)', '3');
    await find(user, 'loop');

    await plan().findByRole('list', { name: 'Proposed itineraries' });
    expect(sent[0]).toMatchObject({ distance: 4828 });
  });

  it.each([
    ['loop', 'Distance (km)', '0.5', 'Enter a distance between 1 and 100 km.'],
    ['loop', 'Distance (km)', 'far', 'Enter a distance between 1 and 100 km.'],
    ['uphill', 'Length (km)', '31', 'Enter a distance between 0.5 and 30 km.'],
  ] as const)('refuses a %s %s of %s', async (kind, field, typed, message) => {
    const sent = planningApi();
    const { user } = await openPlan(kind);

    await typeInto(user, field, typed);
    await find(user, kind);

    expect(plan().getByRole('alert')).toHaveTextContent(message);
    expect(sent).toHaveLength(0);
  });

  it('gives the allowed range in miles with imperial units', async () => {
    stubLanguages('en-US');
    const sent = planningApi();
    const { user } = await openPlan('loop');

    await typeInto(user, 'Distance (mi)', '70');
    await find(user, 'loop');

    expect(plan().getByRole('alert')).toHaveTextContent(
      'Enter a distance between 0.63 and 62.13 mi.',
    );
    expect(sent).toHaveLength(0);
  });

  it('offers Gradients up to 30 %', async () => {
    const sent = planningApi();
    const { user } = await openPlan('uphill');

    await user.selectOptions(plan().getByRole('combobox', { name: 'Gradient to' }), '30%');
    await user.selectOptions(plan().getByRole('combobox', { name: 'Gradient from' }), '20%');
    await find(user, 'uphill');

    await plan().findByRole('list', { name: 'Proposed itineraries' });
    expect(sent[0]).toMatchObject({ minGradient: 0.2, maxGradient: 0.3 });
  });

  it('rewrites a typed distance in the new unit when the Visitor switches units', async () => {
    const sent = planningApi();
    const { user } = await openPlan('loop');

    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Units' })).getByRole('radio', {
        name: 'Imperial',
      }),
    );

    expect(plan().getByRole('textbox', { name: 'Distance (mi)' })).toHaveDisplayValue('3.11');
    await find(user, 'loop');
    await plan().findByRole('list', { name: 'Proposed itineraries' });
    expect(sent[0]).toMatchObject({ distance: 5000 });
  });

  it('takes short Repeats in miles', async () => {
    stubLanguages('en-US');
    const sent = planningApi();
    const { user } = await renderApp('/?latitude=45.9&longitude=6.13');
    await user.click(await screen.findByRole('tab', { name: 'Plan' }));
    await user.click(plan().getByRole('radio', { name: 'Hill session' }));
    fakeMap.click({ latitude: 45.9, longitude: 6.13 });

    expect(plan().getByRole('textbox', { name: 'Repeat length (mi)' })).toHaveDisplayValue('0.19');
    await typeInto(user, 'Repeat length (mi)', '0.15');
    await user.click(plan().getByRole('button', { name: 'Find hill sessions' }));

    await plan().findByRole('list', { name: 'Proposed itineraries' });
    expect(sent[0]).toMatchObject({ repeatLength: 241 });
  });
});
