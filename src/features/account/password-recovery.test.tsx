import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { anAccount, handlers, nearbyResults } from '@/test/api';
import { FAKE_EMAIL_CODE, fakeAuth } from '@/test/fake-auth';
import { pwnedPasswords } from '@/test/pwned-passwords';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

type User = Awaited<ReturnType<typeof renderApp>>['user'];

const NEW_PASSWORD = 'a brand new passphrase to remember';

beforeEach(() => {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.me(() => HttpResponse.json(anAccount())),
  );
});

const field = (name: string) => screen.getByLabelText(name, { selector: 'input' });

describe('Forgetting the password', () => {
  it('sends a link to choose a new one', async () => {
    const { user } = await renderApp('/sign-in');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue with a password' }));

    await user.click(screen.getByRole('button', { name: 'Forgot your password?' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check your inbox: we sent a link to choose a new password to ada@example.com.',
    );
    expect(fakeAuth.resetLinks()).toEqual([
      { email: 'ada@example.com', returnTo: `${window.location.origin}/new-password` },
    ]);
  });

  it('needs the e-mail address first', async () => {
    const { user } = await renderApp('/sign-in');
    await user.click(screen.getByRole('button', { name: 'Continue with a password' }));

    await user.click(screen.getByRole('button', { name: 'Forgot your password?' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter an e-mail address.');
    expect(fakeAuth.resetLinks()).toEqual([]);
  });

  it('chooses the new password on the page the link opens', async () => {
    fakeAuth.signIn();
    const { user } = await renderApp('/new-password');

    await user.type(field('New password'), NEW_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Save the password' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Your password is saved.');
    expect(fakeAuth.passwordOf('ada@example.com')).toBe(NEW_PASSWORD);
  });

  it('says when the link no longer works', async () => {
    await renderApp('/new-password');

    expect(
      await screen.findByText(
        'This link has expired or was already used. Ask for a new one from the sign-in page.',
      ),
    ).toBeVisible();
  });
});

describe('The Security section', () => {
  async function openSecurity() {
    fakeAuth.signIn();
    const app = await renderApp('/account');
    const security = within(await screen.findByRole('region', { name: 'Security' }));
    return { ...app, security };
  }

  async function savePassword(user: User, password: string) {
    await user.type(field('New password'), password);
    await user.click(screen.getByRole('button', { name: 'Save the password' }));
  }

  it('sets or changes the password', async () => {
    const { user, security } = await openSecurity();

    expect(
      security.getByText('Set a password to sign in with it, or change the one you have.'),
    ).toBeVisible();
    await savePassword(user, NEW_PASSWORD);

    expect(await security.findByRole('status')).toHaveTextContent('Your password is saved.');
    expect(fakeAuth.passwordOf('ada@example.com')).toBe(NEW_PASSWORD);
  });

  it('applies the same rules as when creating an account', async () => {
    pwnedPasswords([NEW_PASSWORD]);
    const { user, security } = await openSecurity();

    await savePassword(user, 'too short');
    expect(await security.findByRole('alert')).toHaveTextContent('Use at least 15 characters.');

    await user.clear(field('New password'));
    await savePassword(user, NEW_PASSWORD);
    expect(await security.findByRole('alert')).toHaveTextContent(
      'This password appears in known data leaks. Choose another one.',
    );
    expect(fakeAuth.passwordOf('ada@example.com')).toBeUndefined();
  });

  it('asks for the code sent by e-mail when Supabase wants proof it is them', async () => {
    fakeAuth.requireReauthentication();
    const { user, security } = await openSecurity();

    await savePassword(user, NEW_PASSWORD);

    expect(
      await security.findByText('To confirm it is you, enter the code we sent to ada@example.com.'),
    ).toBeVisible();
    expect(fakeAuth.codesSent()).toBe(1);
    await user.type(field('Code from the e-mail'), '000000');
    await user.click(security.getByRole('button', { name: 'Confirm' }));
    expect(await security.findByRole('alert')).toHaveTextContent('Wrong or expired code.');

    await user.clear(field('Code from the e-mail'));
    await user.type(field('Code from the e-mail'), FAKE_EMAIL_CODE);
    await user.click(security.getByRole('button', { name: 'Confirm' }));

    expect(await security.findByRole('status')).toHaveTextContent('Your password is saved.');
    expect(fakeAuth.passwordOf('ada@example.com')).toBe(NEW_PASSWORD);
  });
});
