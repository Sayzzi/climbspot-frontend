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

describe('Managing the second factor', () => {
  async function openSecurityWith(apps: number) {
    fakeAuth.withSecondFactor('ada@example.com', apps);
    fakeAuth.signIn();
    await fakeAuth.giveSecondFactorNow();
    const app = await renderApp('/account');
    const security = within(await screen.findByRole('region', { name: 'Security' }));
    return { ...app, security };
  }

  it('invites to add a second app, and adds it', async () => {
    const { user, security } = await openSecurityWith(1);

    expect(
      await security.findByText(
        'Add a second app too (on another phone, or in your password manager), in case you lose this one.',
      ),
    ).toBeVisible();
    await user.click(security.getByRole('button', { name: 'Add a second app' }));
    await user.type(field('First code from the app'), FAKE_TOTP_CODE);
    await user.click(security.getByRole('button', { name: 'Turn it on' }));

    expect(await security.findByText('Two authenticator apps give your codes.')).toBeVisible();
    expect(security.queryByRole('button', { name: 'Add a second app' })).not.toBeInTheDocument();
  });

  it('turns off after a code', async () => {
    const { user, security } = await openSecurityWith(2);

    await user.click(await security.findByRole('button', { name: 'Turn off the second factor' }));
    await user.type(field('Code from your authenticator app'), '000000');
    await user.click(security.getByRole('button', { name: 'Turn it off' }));
    expect(await security.findByRole('alert')).toHaveTextContent('Wrong or expired code.');
    expect(fakeAuth.hasSecondFactor()).toBe(true);

    await user.clear(field('Code from your authenticator app'));
    await user.type(field('Code from your authenticator app'), FAKE_TOTP_CODE);
    await user.click(security.getByRole('button', { name: 'Turn it off' }));

    expect(await security.findByText('Second factor: off')).toBeVisible();
    expect(fakeAuth.hasSecondFactor()).toBe(false);
  });
});

describe('The API asking for the second factor', () => {
  it('leads to the code when the session has not given it', async () => {
    fakeAuth.signIn();
    fakeAuth.secondFactorAddedElsewhere();
    server.use(
      handlers.me(() =>
        HttpResponse.json(
          { error: { code: 'SECOND_FACTOR_REQUIRED', message: 'test' } },
          { status: 401 },
        ),
      ),
    );
    const { user, router } = await renderApp('/account');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/second-factor');
    });
    server.use(handlers.me(() => HttpResponse.json(anAccount())));
    await giveCode(user, FAKE_TOTP_CODE);

    expect(await header().findByRole('button', { name: 'Ada’s menu' })).toBeInTheDocument();
  });

  it('explains when signing in cannot be checked', async () => {
    fakeAuth.signIn();
    server.use(
      handlers.me(() =>
        HttpResponse.json(
          { error: { code: 'AUTHENTICATION_UNAVAILABLE', message: 'test' } },
          { status: 503 },
        ),
      ),
    );
    await renderApp('/account');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Signing in cannot be checked right now. Please try again in a moment.',
    );
  });
});

describe('Leaving the code step', () => {
  it('lets the Visitor go elsewhere, where protected pages invite to finish signing in', async () => {
    fakeAuth.withSecondFactor();
    fakeAuth.signIn();
    const { user, router } = await renderApp('/second-factor');
    await screen.findByRole('heading', { level: 1, name: 'Enter your code' });

    await router.navigate({ to: '/account' });

    expect(
      await screen.findByText('Finish signing in: enter the code from your authenticator app.'),
    ).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Enter my code' }));
    expect(router.state.location.pathname).toBe('/second-factor');
  });

  it('comes back to the page the Visitor was headed for, once the code is given', async () => {
    fakeAuth.withSecondFactor();
    fakeAuth.signIn();
    const { user, router } = await renderApp('/new-password');
    await screen.findByRole('heading', { level: 1, name: 'Enter your code' });

    await giveCode(user, FAKE_TOTP_CODE);

    expect(await screen.findByLabelText('New password', { selector: 'input' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/new-password');
  });
});
