import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { anAccount, handlers, nearbyResults } from '@/test/api';
import { FAKE_TOTP_CODE, fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

beforeEach(() => {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.me(() => HttpResponse.json(anAccount())),
  );
});

const header = () => within(screen.getByRole('banner'));
const field = (name: string) => screen.getByLabelText(name, { selector: 'input' });

describe('Signing in with a passkey', () => {
  it('is offered first, and signs in', async () => {
    fakeAuth.supportPasskeys();
    fakeAuth.withPasskey();
    const { user, router } = await renderApp('/sign-in');

    const buttons = within(screen.getByRole('main')).getAllByRole('button');
    expect(buttons[0]).toHaveAccessibleName('Sign in with a passkey');
    await user.click(screen.getByRole('button', { name: 'Sign in with a passkey' }));

    expect(await header().findByRole('button', { name: 'Ada’s menu' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('is not offered by a browser that cannot use passkeys', async () => {
    await renderApp('/sign-in');

    await screen.findByRole('button', { name: 'Continue with Google' });
    expect(
      screen.queryByRole('button', { name: 'Sign in with a passkey' }),
    ).not.toBeInTheDocument();
  });

  it('asks for the second factor’s code too', async () => {
    fakeAuth.supportPasskeys();
    fakeAuth.withPasskey();
    fakeAuth.withSecondFactor();
    const { user, router } = await renderApp('/sign-in');

    await user.click(await screen.findByRole('button', { name: 'Sign in with a passkey' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/second-factor');
    });
    await screen.findByRole('heading', { level: 1, name: 'Enter your code' });
    await user.type(field('Code from your authenticator app'), FAKE_TOTP_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await header().findByRole('button', { name: 'Ada’s menu' })).toBeInTheDocument();
  });

  it('says when passkeys are unavailable, offering the other ways', async () => {
    fakeAuth.supportPasskeys();
    fakeAuth.passkeysDown();
    const { user } = await renderApp('/sign-in');

    await user.click(await screen.findByRole('button', { name: 'Sign in with a passkey' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Passkeys are unavailable right now. Use another way to sign in.',
    );
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });
});

describe('Managing passkeys', () => {
  async function openPasskeys() {
    fakeAuth.supportPasskeys();
    fakeAuth.signIn();
    const app = await renderApp('/account');
    const security = within(await screen.findByRole('region', { name: 'Security' }));
    return { ...app, security };
  }

  it('adds a passkey and names it', async () => {
    const { user, security } = await openPasskeys();

    await user.click(security.getByRole('button', { name: 'Add a passkey' }));
    const list = within(await security.findByRole('list', { name: 'Your passkeys' }));
    expect(list.getAllByRole('listitem')).toHaveLength(1);

    await user.click(list.getByRole('button', { name: /^Rename/ }));
    await user.clear(field('Passkey name'));
    await user.type(field('Passkey name'), 'iPhone');
    await user.click(security.getByRole('button', { name: 'Save' }));

    expect(await list.findByText('iPhone')).toBeVisible();
    expect(fakeAuth.passkeysOf().map((passkey) => passkey.name)).toEqual(['iPhone']);
  });

  it('lists the passkeys and removes one', async () => {
    fakeAuth.withPasskey('ada@example.com', 'MacBook');
    fakeAuth.withPasskey('ada@example.com', 'Old phone');
    const { user, security } = await openPasskeys();
    const list = within(await security.findByRole('list', { name: 'Your passkeys' }));
    expect(list.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('MacBook'),
      expect.stringContaining('Old phone'),
    ]);

    await user.click(list.getByRole('button', { name: 'Remove Old phone' }));

    await waitFor(() => {
      expect(list.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(fakeAuth.passkeysOf().map((passkey) => passkey.name)).toEqual(['MacBook']);
  });

  it('does not offer to add one where the browser cannot use passkeys', async () => {
    fakeAuth.signIn();
    await renderApp('/account');
    const security = within(await screen.findByRole('region', { name: 'Security' }));

    expect(security.getByText('This browser cannot use passkeys.')).toBeVisible();
    expect(security.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });
});
