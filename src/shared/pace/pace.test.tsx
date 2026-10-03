import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { handlers, nearbyResults } from '@/test/api';
import { stubLanguages } from '@/test/languages';
import { setFlatPace } from '@/test/pace';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const open = () => renderApp('/?latitude=45&longitude=6');
const paceButton = () => screen.getByRole('button', { name: /^(Set your pace|Flat pace: .+)$/ });

describe('Flat Pace', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invites the Visitor to set their pace until they do', async () => {
    server.use(handlers.nearby(() => nearbyResults([])));
    await open();

    expect(await screen.findByRole('button', { name: 'Set your pace' })).toBeInTheDocument();
  });

  it('takes a pace per km and shows it in the header', async () => {
    server.use(handlers.nearby(() => nearbyResults([])));
    const { user } = await open();

    await setFlatPace(user, '5:30');

    expect(paceButton()).toHaveAccessibleName('Flat pace: 5:30/km');
    expect(screen.queryByRole('dialog', { name: 'Flat pace' })).not.toBeInTheDocument();
  });

  it('takes a pace per mile with imperial units', async () => {
    stubLanguages('en-US');
    server.use(handlers.nearby(() => nearbyResults([])));
    const { user } = await open();

    await user.click(paceButton());
    expect(
      within(screen.getByRole('dialog', { name: 'Flat pace' })).getByRole('textbox', {
        name: 'Your pace on the flat (min:s per mile)',
      }),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await setFlatPace(user, '8:51');
    expect(paceButton()).toHaveAccessibleName('Flat pace: 8:51/mi');

    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Units' })).getByRole('radio', {
        name: 'Metric',
      }),
    );
    expect(paceButton()).toHaveAccessibleName('Flat pace: 5:30/km');
  });

  it.each([
    ['2:30', 'Enter a pace between 3:00 and 12:00 per km.'],
    ['12:01', 'Enter a pace between 3:00 and 12:00 per km.'],
    ['fast', 'Enter a pace as minutes and seconds, like 5:30.'],
  ])('refuses %s', async (pace, message) => {
    server.use(handlers.nearby(() => nearbyResults([])));
    const { user } = await open();

    await setFlatPace(user, pace);

    const dialog = within(screen.getByRole('dialog', { name: 'Flat pace' }));
    expect(dialog.getByRole('alert')).toHaveTextContent(message);
    expect(paceButton()).toHaveAccessibleName('Set your pace');
  });

  it('remembers the pace for the next visit', async () => {
    server.use(handlers.nearby(() => nearbyResults([])));
    const first = await open();
    await setFlatPace(first.user, '4:45');
    first.unmount();

    await open();

    expect(paceButton()).toHaveAccessibleName('Flat pace: 4:45/km');
  });

  it('keeps the pace for the visit when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    server.use(handlers.nearby(() => nearbyResults([])));
    const { user } = await open();

    await setFlatPace(user, '6:00');

    expect(paceButton()).toHaveAccessibleName('Flat pace: 6:00/km');
  });
});
