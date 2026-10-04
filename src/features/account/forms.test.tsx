import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render-app';

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
