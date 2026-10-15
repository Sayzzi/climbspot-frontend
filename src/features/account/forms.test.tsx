import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { anAccount, handlers, nearbyResults } from '@/test/api';
import { FAKE_TOTP_CODE, fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const PASSPHRASE = 'correct horse battery staple';

const field = (name: string) => screen.getByLabelText(name, { selector: 'input' });
const header = () => within(screen.getByRole('banner'));

beforeEach(() => {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.me(() => HttpResponse.json(anAccount())),
  );
});

describe('The sign-in page', () => {
  it('says what signing in is for, and no longer that there is no password', async () => {
    await renderApp('/sign-in');

    expect(
      await screen.findByText(
        'Save your itineraries, connect Strava and add climbs. Use a password, a link by e-mail, Google or a passkey.',
      ),
    ).toBeVisible();
    expect(screen.queryByText(/No password/)).not.toBeInTheDocument();
  });
});

describe('Confirmations', () => {
  it('confirms signing in', async () => {
    fakeAuth.withPassword('ada@example.com', PASSPHRASE);
    const { user } = await renderApp('/sign-in');

    await user.type(await screen.findByRole('textbox', { name: 'E-mail' }), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue with a password' }));
    await user.type(field('Password'), PASSPHRASE);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await header().findByRole('status')).toHaveTextContent('You’re signed in.');
  });

  it('confirms signing in once the second factor’s code is given, not before', async () => {
    fakeAuth.withPassword('ada@example.com', PASSPHRASE);
    fakeAuth.withSecondFactor();
    const { user } = await renderApp('/sign-in');

    await user.type(await screen.findByRole('textbox', { name: 'E-mail' }), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue with a password' }));
    await user.type(field('Password'), PASSPHRASE);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { level: 1, name: 'Enter your code' });
    expect(header().queryByText('You’re signed in.')).not.toBeInTheDocument();

    await user.type(field('Code from your authenticator app'), FAKE_TOTP_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await header().findByText('You’re signed in.')).toBeVisible();
  });

  it('says nothing of a session found on opening the site', async () => {
    fakeAuth.signIn();
    await renderApp('/account');
    await screen.findByRole('heading', { level: 1, name: 'Your account' });

    expect(header().queryByText('You’re signed in.')).not.toBeInTheDocument();
  });

  it('confirms turning the second factor on', async () => {
    fakeAuth.signIn();
    const { user } = await renderApp('/account');
    const security = within(await screen.findByRole('region', { name: 'Security' }));

    await user.click(security.getByRole('button', { name: 'Turn on the second factor' }));
    await user.type(field('First code from the app'), FAKE_TOTP_CODE);
    await user.click(security.getByRole('button', { name: 'Turn it on' }));

    expect(await security.findByRole('status')).toHaveTextContent(
      'The second factor is on: signing in now asks for a code.',
    );
  });
});

describe('Adding a climb', () => {
  it('guides through its three steps, in order', async () => {
    fakeAuth.signIn();
    await renderApp('/ascents/new');
    await screen.findByRole('heading', { level: 1, name: 'Add a climb' });

    const name = screen.getByRole('textbox', { name: 'Name' });
    const surface = screen.getByRole('radiogroup', { name: 'Surface' });
    const file = screen.getByLabelText('GPX file');
    expect(name.compareDocumentPosition(surface) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(surface.compareDocumentPosition(file) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
