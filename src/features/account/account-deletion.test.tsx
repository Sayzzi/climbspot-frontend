import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anAccount, apiErrorResponse, handlers, recorder } from '@/test/api';
import { FAKE_TOKEN, fakeAuth } from '@/test/fake-auth';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

function accountApi(
  answer: () => HttpResponse<never> = () => new HttpResponse(null, { status: 204 }),
) {
  const deletions = recorder();
  server.use(
    handlers.me(() => HttpResponse.json(anAccount())),
    handlers.deleteMe((request) => {
      deletions.record(request);
      return answer();
    }),
  );
  return deletions;
}

async function openAccount() {
  fakeAuth.signIn();
  const app = await renderApp('/account');
  await screen.findByText('ada@example.com');
  return app;
}

const header = () => within(screen.getByRole('banner'));
const deletion = () => within(screen.getByRole('region', { name: 'Delete my account' }));

describe('Deleting my account', () => {
  it('says what is erased and what stays', async () => {
    accountApi();
    await openAccount();

    expect(
      deletion().getByText(
        'Deleting your account erases your e-mail, display name, Flat Pace and saved itineraries. The climbs you added stay on ClimbSpot, without your name.',
      ),
    ).toBeVisible();
  });

  it('asks for confirmation, and sends nothing when the Visitor changes their mind', async () => {
    const deletions = accountApi();
    const { user } = await openAccount();

    await user.click(deletion().getByRole('button', { name: 'Delete my account' }));
    expect(
      deletion().getByText('Delete your account for good? This cannot be undone.'),
    ).toBeVisible();
    await user.click(deletion().getByRole('button', { name: 'Cancel' }));

    expect(deletion().getByRole('button', { name: 'Delete my account' })).toBeVisible();
    expect(deletions.requests).toHaveLength(0);
  });

  it('deletes the account once confirmed, then signs the Visitor out and tells them', async () => {
    const deletions = accountApi();
    const { user } = await openAccount();

    await user.click(deletion().getByRole('button', { name: 'Delete my account' }));
    await user.click(deletion().getByRole('button', { name: 'Yes, delete my account' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Your account has been deleted.');
    expect(header().getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(deletions.requests).toHaveLength(1);
    expect(deletions.requests[0]?.headers.get('Authorization')).toBe(`Bearer ${FAKE_TOKEN}`);
  });

  it('explains a failed deletion and keeps the Visitor signed in', async () => {
    accountApi(() => apiErrorResponse(503, 'ACCOUNT_DELETION_UNAVAILABLE') as HttpResponse<never>);
    const { user } = await openAccount();

    await user.click(deletion().getByRole('button', { name: 'Delete my account' }));
    await user.click(deletion().getByRole('button', { name: 'Yes, delete my account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your account could not be deleted right now, and nothing was erased. Please try again later.',
    );
    expect(screen.getByText('ada@example.com')).toBeVisible();
    expect(header().getByRole('button', { name: 'Ada’s menu' })).toBeInTheDocument();
  });
});
