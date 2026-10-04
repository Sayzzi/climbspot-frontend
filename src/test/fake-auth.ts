import { act } from '@testing-library/react';

import {
  AuthFailure,
  type AuthChange,
  type AuthClient,
  type AuthSession,
} from '@/shared/auth/types';

/** The access token the fake gives a signed-in Visitor. */
export const FAKE_TOKEN = 'fake-access-token';

let current: AuthSession | undefined;
const listeners = new Set<(change: AuthChange) => void>();
const sentLinks: { email: string; returnTo: string }[] = [];
let googleSignIns = 0;
/** Accounts with a password, and whether their e-mail address is confirmed. */
const passwords = new Map<string, { password: string; confirmed: boolean }>();
const signUps: { email: string; password: string; returnTo: string }[] = [];
let confirmationRequired = true;
const resetLinks: { email: string; returnTo: string }[] = [];
let reauthenticationRequired = false;
let codesSent = 0;

/** The code the fake sends by e-mail when the Visitor must prove it is them. */
export const FAKE_EMAIL_CODE = '123456';

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
  signInWithPassword: (email, password) => {
    const account = passwords.get(email);
    if (account?.password !== password) {
      return Promise.reject(new AuthFailure('invalid-credentials'));
    }
    if (!account.confirmed) {
      return Promise.reject(new AuthFailure('email-not-confirmed'));
    }
    fakeAuth.signIn(email);
    return Promise.resolve();
  },
  signUp: (email, password, returnTo) => {
    signUps.push({ email, password, returnTo });
    passwords.set(email, { password, confirmed: !confirmationRequired });
    if (confirmationRequired) {
      return Promise.resolve('confirmation-sent');
    }
    fakeAuth.signIn(email);
    return Promise.resolve('signed-in');
  },
  sendPasswordReset: (email, returnTo) => {
    resetLinks.push({ email, returnTo });
    return Promise.resolve();
  },
  updatePassword: (password, code) => {
    const email = current?.email;
    if (email === undefined) {
      return Promise.reject(new AuthFailure('failed'));
    }
    if (reauthenticationRequired && code === undefined) {
      return Promise.reject(new AuthFailure('reauthentication-needed'));
    }
    if (reauthenticationRequired && code !== FAKE_EMAIL_CODE) {
      return Promise.reject(new AuthFailure('invalid-code'));
    }
    passwords.set(email, { password, confirmed: true });
    return Promise.resolve();
  },
  requestReauthentication: () => {
    codesSent += 1;
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
  /** An account that signs in with this password; unconfirmed if told so. */
  withPassword(email: string, password: string, { confirmed = true } = {}) {
    passwords.set(email, { password, confirmed });
  },
  /** Accounts are created signed in at once, as when Supabase asks no confirmation. */
  confirmNothing() {
    confirmationRequired = false;
  },
  signUps: () => signUps,
  resetLinks: () => resetLinks,
  /** The password the account now has, if any. */
  passwordOf: (email: string) => passwords.get(email)?.password,
  /** Changing the password needs a code sent by e-mail, as with an old sign-in. */
  requireReauthentication() {
    reauthenticationRequired = true;
  },
  codesSent: () => codesSent,
  sentLinks: () => sentLinks,
  googleSignIns: () => googleSignIns,
  reset() {
    current = undefined;
    listeners.clear();
    sentLinks.length = 0;
    googleSignIns = 0;
    passwords.clear();
    signUps.length = 0;
    confirmationRequired = true;
    resetLinks.length = 0;
    reauthenticationRequired = false;
    codesSent = 0;
  },
};
