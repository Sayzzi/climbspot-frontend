import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { anAccount, handlers, nearbyResults, recorder } from '@/test/api';
import { FAKE_TOTP_CODE, fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

type User = Awaited<ReturnType<typeof renderApp>>['user'];

const PASSPHRASE = 'correct horse battery staple';

let accountRequests: ReturnType<typeof recorder>;

beforeEach(() => {
  accountRequests = recorder();
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.me((request) => {
      accountRequests.record(request);
      return HttpResponse.json(anAccount());
    }),
  );
});

const field = (name: string) => screen.getByLabelText(name, { selector: 'input' });
const header = () => within(screen.getByRole('banner'));

async function signInWithPassword(user: User) {
  await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'ada@example.com');
  await user.click(screen.getByRole('button', { name: 'Continue with a password' }));
  await user.type(field('Password'), PASSPHRASE);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

async function giveCode(user: User, code: string) {
  await user.type(field('Code from your authenticator app'), code);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('Turning on a second factor', () => {
  async function openSecurity() {
    fakeAuth.signIn();
    const app = await renderApp('/account');
    const security = within(await screen.findByRole('region', { name: 'Security' }));
    return { ...app, security };
  }

  it('shows the QR code and key, and is on once a first code is right', async () => {
    const { user, security } = await openSecurity();

    expect(security.getByText('Second factor: off')).toBeVisible();
    await user.click(security.getByRole('button', { name: 'Turn on the second factor' }));

    expect(
      security.getByRole('img', { name: 'QR code to scan with your authenticator app' }),
    ).toBeVisible();
    expect(security.getByText('JBSWY3DPEHPK3PXP')).toBeVisible();
    await user.type(field('First code from the app'), FAKE_TOTP_CODE);
    await user.click(security.getByRole('button', { name: 'Turn it on' }));

    expect(await security.findByText('Second factor: on')).toBeVisible();
    expect(fakeAuth.hasSecondFactor()).toBe(true);
  });

  it('stays off with a wrong first code', async () => {
    const { user, security } = await openSecurity();
    await user.click(security.getByRole('button', { name: 'Turn on the second factor' }));

    await user.type(field('First code from the app'), '000000');
    await user.click(security.getByRole('button', { name: 'Turn it on' }));

    expect(await security.findByRole('alert')).toHaveTextContent('Wrong or expired code.');
    expect(fakeAuth.hasSecondFactor()).toBe(false);
  });
});

describe('Signing in with a second factor', () => {
  beforeEach(() => {
    fakeAuth.withPassword('ada@example.com', PASSPHRASE);
    fakeAuth.withSecondFactor();
  });

  it('asks for the code after the password, signed out until it is given', async () => {
    const { user, router } = await renderApp('/sign-in');

    await signInWithPassword(user);

    expect(await screen.findByRole('heading', { level: 1, name: 'Enter your code' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/second-factor');
    expect(header().queryByRole('button', { name: 'Ada’s menu' })).not.toBeInTheDocument();
    expect(accountRequests.requests).toHaveLength(0);

    await giveCode(user, FAKE_TOTP_CODE);

    expect(await header().findByRole('button', { name: 'Ada’s menu' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('asks for it whatever the method, wherever the Visitor lands', async () => {
    fakeAuth.signIn();
    const { router } = await renderApp('/account');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/second-factor');
    });
  });

  it('explains a wrong code', async () => {
    fakeAuth.signIn();
    const { user } = await renderApp('/second-factor');

    await giveCode(user, '000000');

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong or expired code.');
    expect(header().queryByRole('button', { name: 'Ada’s menu' })).not.toBeInTheDocument();
  });

  it('says what to do when the authenticator is lost, and lets the Visitor sign out', async () => {
    fakeAuth.signIn();
    const { user, router } = await renderApp('/second-factor');

    expect(
      await screen.findByText('Lost your authenticator app? Contact the ClimbSpot team.'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
    expect(header().getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
