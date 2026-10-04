import { act } from '@testing-library/react';

import type { AuthChange, AuthClient, AuthSession } from '@/shared/auth/types';

/** The access token the fake gives a signed-in Visitor. */
export const FAKE_TOKEN = 'fake-access-token';

let current: AuthSession | undefined;
const listeners = new Set<(change: AuthChange) => void>();
const sentLinks: { email: string; returnTo: string }[] = [];
let googleSignIns = 0;

function notify(change: AuthChange) {
  for (const listener of listeners) listener(change);
}

/** Stand-in for Supabase Auth: tests drive it through `fakeAuth`. */
export const authClient: AuthClient = {
  available: true,
  session: () => current,
  onChange: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  sendMagicLink: (email, returnTo) => {
    sentLinks.push({ email, returnTo });
    return Promise.resolve();
  },
  signInWithGoogle: () => {
    googleSignIns += 1;
    return Promise.resolve();
  },
  signOut: () => {
    current = undefined;
    notify({ session: undefined, expired: false });
    return Promise.resolve();
  },
  expire: () => {
    current = undefined;
    notify({ session: undefined, expired: true });
    return Promise.resolve();
  },
};

export const fakeAuth = {
  /** Starts the test signed in (call before rendering) or signs in during it. */
  signIn(email = 'ada@example.com') {
    current = { visitorId: `visitor-${email}`, accessToken: FAKE_TOKEN, email };
    act(() => {
      notify({ session: current, expired: false });
    });
  },
  /** Renews the signed-in Visitor's token, as Supabase does about every hour. */
  renewToken() {
    if (!current) {
      throw new Error('Nobody is signed in.');
    }
    current = { ...current, accessToken: `${FAKE_TOKEN}-renewed` };
    act(() => {
      notify({ session: current, expired: false });
    });
  },
  sentLinks: () => sentLinks,
  googleSignIns: () => googleSignIns,
  reset() {
    current = undefined;
    listeners.clear();
    sentLinks.length = 0;
    googleSignIns = 0;
  },
};
