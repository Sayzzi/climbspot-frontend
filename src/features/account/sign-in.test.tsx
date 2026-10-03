import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anAccount, apiErrorResponse, handlers, nearbyResults, recorder } from '@/test/api';
import { FAKE_TOKEN, fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

function accountApi(account = anAccount()) {
  const sent = recorder();
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.me((request) => {
      sent.record(request);
      return HttpResponse.json(account);
    }),
  );
  return sent;
}

const header = () => within(screen.getByRole('banner'));

describe('Signing in', () => {
  it('offers to sign in from the header', async () => {
    accountApi();
    const { user, router } = await renderApp('/');

    await user.click(header().getByRole('link', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/sign-in');
  });

  it('sends a sign-in link to an e-mail address', async () => {
    accountApi();
    const { user } = await renderApp('/sign-in');

    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send me a sign-in link' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check your inbox: we sent a sign-in link to ada@example.com.',
    );
    expect(fakeAuth.sentLinks()).toEqual([
      { email: 'ada@example.com', returnTo: `${window.location.origin}/` },
    ]);
  });

  it('refuses an e-mail address that is not one', async () => {
    accountApi();
    const { user } = await renderApp('/sign-in');

    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'ada');
    await user.click(screen.getByRole('button', { name: 'Send me a sign-in link' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an e-mail address.');
    expect(fakeAuth.sentLinks()).toEqual([]);
  });

  it('signs in with Google', async () => {
    accountApi();
    const { user } = await renderApp('/sign-in');

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(fakeAuth.googleSignIns()).toBe(1);
  });

  it('shows the signed-in Visitor’s menu, and sends their token', async () => {
    const sent = accountApi();
    fakeAuth.signIn();
    const { user } = await renderApp('/');

    await user.click(await header().findByRole('button', { name: 'Ada’s menu' }));

    const menu = within(screen.getByRole('menu'));
    expect(menu.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Add a climb',
      'Account',
      'Sign out',
    ]);
    expect(sent.requests.at(-1)?.headers.get('Authorization')).toBe(`Bearer ${FAKE_TOKEN}`);
  });

  it('signs out', async () => {
    accountApi();
    fakeAuth.signIn();
    const { user } = await renderApp('/');

    await user.click(await header().findByRole('button', { name: 'Ada’s menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(await header().findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('asks to sign in again when the session has ended', async () => {
    server.use(
      handlers.nearby(() => nearbyResults([])),
      handlers.me(() => apiErrorResponse(401, 'AUTHENTICATION_REQUIRED')),
    );
    fakeAuth.signIn();
    await renderApp('/');

    expect(
      await screen.findByText('Your session has ended. Sign in again to use your account.'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation')).getByRole('link', { name: 'Sign in' }),
    ).toBeInTheDocument();
  });
});

describe('Account page', () => {
  it('shows the display name and e-mail, and changes the name', async () => {
    accountApi();
    const changes: unknown[] = [];
    server.use(
      handlers.updateMe(async (request) => {
        changes.push(await request.json());
        return HttpResponse.json(anAccount({ displayName: 'Ada L.' }));
      }),
    );
    fakeAuth.signIn();
    const { user } = await renderApp('/account');

    expect(await screen.findByText('ada@example.com')).toBeInTheDocument();
    const name = screen.getByRole('textbox', { name: 'Display name' });
    expect(name).toHaveDisplayValue('Ada');
    await user.clear(name);
    await user.type(name, 'Ada L.');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changes).toEqual([{ displayName: 'Ada L.' }]);
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.');
  });

  it('invites a Visitor who is not signed in to sign in', async () => {
    accountApi();
    await renderApp('/account');

    expect(await screen.findByText('Sign in to see your account.')).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Sign in' }),
    ).toBeInTheDocument();
  });
});
