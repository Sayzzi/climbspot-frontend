import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { anAccount, handlers, nearbyResults } from '@/test/api';
import { fakeAuth } from '@/test/fake-auth';
import { pwnedPasswords } from '@/test/pwned-passwords';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

type User = Awaited<ReturnType<typeof renderApp>>['user'];

const PASSPHRASE = 'correct horse battery staple';

beforeEach(() => {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.me(() => HttpResponse.json(anAccount())),
  );
});

async function choosePassword(user: User, email = 'ada@example.com') {
  await user.type(screen.getByRole('textbox', { name: 'E-mail' }), email);
  await user.click(screen.getByRole('button', { name: 'Continue with a password' }));
}

const passwordField = (name: string) => screen.getByLabelText(name, { selector: 'input' });

describe('Signing in with a password', () => {
  it('signs in with the e-mail and password, then shows the home page', async () => {
    fakeAuth.withPassword('ada@example.com', PASSPHRASE);
    const { user, router } = await renderApp('/sign-in');
    await choosePassword(user);

    await user.type(passwordField('Password'), PASSPHRASE);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('button', { name: 'Ada’s menu' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('explains a wrong e-mail or password', async () => {
    fakeAuth.withPassword('ada@example.com', PASSPHRASE);
    const { user } = await renderApp('/sign-in');
    await choosePassword(user);

    await user.type(passwordField('Password'), 'not the right one at all');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong e-mail or password.');
  });

  it('asks to confirm the address of an account not confirmed yet', async () => {
    fakeAuth.withPassword('ada@example.com', PASSPHRASE, { confirmed: false });
    const { user } = await renderApp('/sign-in');
    await choosePassword(user);

    await user.type(passwordField('Password'), PASSPHRASE);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Confirm your e-mail address first, with the link we sent you.',
    );
  });

  it('keeps the link by e-mail and Google', async () => {
    await renderApp('/sign-in');

    expect(await screen.findByRole('button', { name: 'Send me a sign-in link' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });
});

describe('Creating an account with a password', () => {
  async function createAccount(user: User, password: string) {
    await choosePassword(user);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(passwordField('Choose a password'), password);
    await user.click(screen.getByRole('button', { name: 'Create my account' }));
  }

  it('asks to confirm the e-mail address', async () => {
    const { user } = await renderApp('/sign-in');

    await createAccount(user, PASSPHRASE);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check your inbox: confirm your address with the link sent to ada@example.com.',
    );
    expect(fakeAuth.signUps()).toEqual([
      { email: 'ada@example.com', password: PASSPHRASE, returnTo: `${window.location.origin}/` },
    ]);
  });

  it('signs in at once when no confirmation is asked', async () => {
    fakeAuth.confirmNothing();
    const { user } = await renderApp('/sign-in');

    await createAccount(user, PASSPHRASE);

    expect(await screen.findByRole('button', { name: 'Ada’s menu' })).toBeInTheDocument();
  });

  it('says how long a password must be, and accepts any characters', async () => {
    const { user } = await renderApp('/sign-in');
    await choosePassword(user);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    expect(
      screen.getByText('At least 15 characters: a sentence you remember works well.'),
    ).toBeVisible();
    await user.type(passwordField('Choose a password'), 'fourteen chars');
    await user.click(screen.getByRole('button', { name: 'Create my account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Use at least 15 characters.');
    expect(fakeAuth.signUps()).toEqual([]);
  });

  it('refuses a password known from data leaks, sending only part of its fingerprint', async () => {
    const pwned = pwnedPasswords([PASSPHRASE]);
    const { user } = await renderApp('/sign-in');

    await createAccount(user, PASSPHRASE);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This password appears in known data leaks. Choose another one.',
    );
    expect(fakeAuth.signUps()).toEqual([]);
    expect(pwned.asked).toHaveLength(1);
    expect(pwned.asked[0]).toMatch(/^[0-9A-F]{5}$/);
  });

  it('creates the account when the leak check cannot be made', async () => {
    pwnedPasswords([], { failing: true });
    const { user } = await renderApp('/sign-in');

    await createAccount(user, PASSPHRASE);

    expect(await screen.findByRole('status')).toHaveTextContent(/Check your inbox/);
  });

  it('goes back to signing in for a Visitor who has an account', async () => {
    const { user } = await renderApp('/sign-in');
    await choosePassword(user);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    await user.click(screen.getByRole('button', { name: 'I already have an account' }));

    expect(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});
