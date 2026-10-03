import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { aHillSession, apiErrorResponse, handlers, nearbyResults } from '@/test/api';
import { fakeMap } from '@/test/fake-map-control';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

type User = Awaited<ReturnType<typeof renderApp>>['user'];

const POINT = { latitude: 45.9, longitude: 6.13 };

function sessionsApi(
  answer: () => Response | Promise<Response> = () =>
    HttpResponse.json({ sessions: [aHillSession()] }),
) {
  const sent: unknown[] = [];
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.sessions(async (request) => {
      sent.push(await request.json());
      return (await answer()) as never;
    }),
  );
  return sent;
}

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));

async function openSessions() {
  const app = await renderApp('/?latitude=45.9&longitude=6.13');
  await app.user.click(await screen.findByRole('tab', { name: 'Plan' }));
  await app.user.click(plan().getByRole('radio', { name: 'Hill session' }));
  fakeMap.click(POINT);
  return app;
}

const submit = (user: User) =>
  user.click(plan().getByRole('button', { name: 'Find hill sessions' }));

async function firstProposal() {
  const [first] = within(
    await plan().findByRole('list', { name: 'Proposed itineraries' }),
  ).getAllByRole('listitem');
  if (!first) {
    throw new Error('a proposal expected');
  }
  return within(first);
}

describe('Plan tab: Hill sessions', () => {
  it('is the third kind of Itinerary', async () => {
    sessionsApi();
    const { user } = await renderApp('/?latitude=45.9&longitude=6.13');
    await user.click(await screen.findByRole('tab', { name: 'Plan' }));

    expect(
      within(screen.getByRole('radiogroup', { name: 'Itinerary' }))
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['Uphill', 'Loop', 'Hill session']);
  });

  it('asks for 8 × 300 m at 6–8 % by default', async () => {
    const sent = sessionsApi();
    const { user } = await openSessions();

    await submit(user);
    await firstProposal();

    expect(sent).toEqual([
      {
        start: POINT,
        repeats: 8,
        repeatLength: 300,
        minGradient: 0.06,
        maxGradient: 0.08,
        radius: 10_000,
        activity: 'running',
      },
    ]);
  });

  it('sends the chosen Repeats, length, Gradients, radius and running Activity', async () => {
    const sent = sessionsApi();
    const { user } = await openSessions();

    await user.selectOptions(plan().getByRole('combobox', { name: 'Repeats' }), '6');
    await user.clear(plan().getByRole('textbox', { name: 'Repeat length (km)' }));
    await user.type(plan().getByRole('textbox', { name: 'Repeat length (km)' }), '0.4');
    await user.selectOptions(plan().getByRole('combobox', { name: 'Gradient to' }), '15%');
    await user.selectOptions(plan().getByRole('combobox', { name: 'Gradient from' }), '10%');
    await user.selectOptions(plan().getByRole('combobox', { name: 'Within' }), '5 km');
    const activity = plan().getByRole('combobox', { name: 'Activity' });
    expect(
      within(activity)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Running', 'Trail running']);
    await user.selectOptions(activity, 'Trail running');
    await submit(user);
    await firstProposal();

    expect(sent).toEqual([
      {
        start: POINT,
        repeats: 6,
        repeatLength: 400,
        minGradient: 0.1,
        maxGradient: 0.15,
        radius: 5000,
        activity: 'trail_running',
      },
    ]);
  });

  it('runs a cycling planner as a run when switching to a Hill session', async () => {
    const sent = sessionsApi();
    const { user } = await renderApp('/?latitude=45.9&longitude=6.13');
    await user.click(await screen.findByRole('tab', { name: 'Plan' }));
    await user.selectOptions(plan().getByRole('combobox', { name: 'Activity' }), 'Road cycling');
    await user.click(plan().getByRole('radio', { name: 'Hill session' }));
    fakeMap.click(POINT);

    await submit(user);
    await firstProposal();

    expect(sent[0]).toMatchObject({ activity: 'running' });
  });

  it('refuses a Repeat length out of range', async () => {
    const sent = sessionsApi();
    const { user } = await openSessions();

    await user.clear(plan().getByRole('textbox', { name: 'Repeat length (km)' }));
    await user.type(plan().getByRole('textbox', { name: 'Repeat length (km)' }), '0.1');
    await submit(user);

    expect(plan().getByRole('alert')).toHaveTextContent('Enter a distance between 0.2 and 2 km.');
    expect(sent).toHaveLength(0);
  });

  it('shows each session with its totals, its Repeat and its Warm-up', async () => {
    sessionsApi(() =>
      HttpResponse.json({
        sessions: [
          aHillSession(),
          aHillSession({
            exact: false,
            differences: [{ kind: 'gradient', min: 0.06, max: 0.08, actual: 0.052 }],
          }),
        ],
      }),
    );
    const { user } = await openSessions();

    await submit(user);

    const proposal = await firstProposal();
    expect(proposal.getByRole('button', { name: 'Show 8 × 300 m at 7.5%' })).toBeInTheDocument();
    expect(proposal.getByText('Matches your request')).toBeInTheDocument();
    expect(proposal.getByText('Total length').nextSibling).toHaveTextContent('8.4 km');
    expect(proposal.getByText('Height gained').nextSibling).toHaveTextContent('245 m');
    expect(proposal.getByText('Km-effort').nextSibling).toHaveTextContent('10.8');
    expect(proposal.getByText('Repeat length').nextSibling).toHaveTextContent('300 m');
    expect(proposal.getByText('Repeat gradient').nextSibling).toHaveTextContent('7.5%');
    expect(proposal.getByText('Repeat max gradient').nextSibling).toHaveTextContent('7.5%');
    expect(proposal.getByText('Warm-up').nextSibling).toHaveTextContent('1.8 km');
    const [, second] = within(
      plan().getByRole('list', { name: 'Proposed itineraries' }),
    ).getAllByRole('listitem');
    expect(second).toHaveTextContent('Close match: 5.2% instead of 6%–8%');
  });

  it('draws the Repeat, its Warm-up dashed, with the Repeat’s Elevation Profile', async () => {
    sessionsApi();
    const { user } = await openSessions();

    await submit(user);
    await firstProposal();

    expect(screen.getByText('Line through 2 points')).toBeInTheDocument();
    expect(screen.getByText('Dashed line through 3 points')).toBeInTheDocument();
    expect(
      plan().getByRole('img', { name: 'Elevation profile: 300 m from 450 m to 472 m.' }),
    ).toBeInTheDocument();
  });

  it('suggests what to change when no session is found', async () => {
    sessionsApi(() => HttpResponse.json({ sessions: [] }));
    const { user } = await openSessions();

    await submit(user);

    expect(await plan().findByText('No itinerary found around this point.')).toBeInTheDocument();
    expect(
      plan().getByText('Try another point, a wider Gradient range or a wider radius.'),
    ).toBeInTheDocument();
  });

  it('explains when planning is unavailable', async () => {
    sessionsApi(() => apiErrorResponse(503, 'ROUTING_UNAVAILABLE'));
    const { user } = await openSessions();

    await submit(user);

    expect(await plan().findByRole('alert')).toHaveTextContent(
      'Planning is temporarily unavailable. Please try again in a moment.',
    );
  });
});
