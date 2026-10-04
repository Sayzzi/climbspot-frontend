import { act } from '@testing-library/react';

import {
  AuthFailure,
  type AuthChange,
  type AuthClient,
  type AuthSession,
  type Passkey,
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

/** The code the fake authenticator apps give. */
export const FAKE_TOTP_CODE = '246810';
const ENROLMENT = {
  factorId: 'factor-1',
  qrCode: 'data:image/svg+xml;base64,PHN2Zy8+',
  secret: 'JBSWY3DPEHPK3PXP',
};
/** Each account's passkeys, and how the fake's passkeys behave. */
const passkeys = new Map<string, Passkey[]>();
const passkeyControl = { supported: false, down: false, cancelled: false, next: 1 };

/** How many authenticator apps each account with a second factor has. */
const secondFactors = new Map<string, number>();

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
  enrollAuthenticator: () =>
    Promise.resolve({
      ...ENROLMENT,
      factorId: `factor-${String((secondFactors.get(current?.email ?? '') ?? 0) + 1)}`,
    }),
  verifyAuthenticator: (factorId, code) => {
    if (!current?.email || !factorId.startsWith('factor-') || code !== FAKE_TOTP_CODE) {
      return Promise.reject(new AuthFailure('invalid-code'));
    }
    secondFactors.set(current.email, (secondFactors.get(current.email) ?? 0) + 1);
    giveCode();
    return Promise.resolve();
  },
  giveSecondFactor: (code) => {
    if (!current || code !== FAKE_TOTP_CODE) {
      return Promise.reject(new AuthFailure('invalid-code'));
    }
    giveCode();
    return Promise.resolve();
  },
  authenticatorCount: () => Promise.resolve(secondFactors.get(current?.email ?? '') ?? 0),
  removeAuthenticators: () => {
    if (current?.email) {
      secondFactors.delete(current.email);
      current = { ...current, secondFactor: 'none' };
      notifyCurrent();
    }
    return Promise.resolve();
  },
  supportsPasskeys: () => passkeyControl.supported,
  signInWithPasskey: () => {
    const failure = passkeyFailure();
    if (failure) return Promise.reject(failure);
    // The browser offers the passkeys it holds: the fake holds the first account's.
    const [email] = [...passkeys.entries()].find(([, held]) => held.length > 0) ?? [];
    if (email === undefined) return Promise.reject(new AuthFailure('passkey-cancelled'));
    fakeAuth.signIn(email);
    return Promise.resolve();
  },
  registerPasskey: () => {
    const failure = passkeyFailure();
    if (failure) return Promise.reject(failure);
    const email = current?.email ?? '';
    const passkey: Passkey = {
      id: `passkey-${String(passkeyControl.next++)}`,
      name: undefined,
      createdAt: '2026-10-04T08:00:00.000Z',
    };
    passkeys.set(email, [...(passkeys.get(email) ?? []), passkey]);
    return Promise.resolve(passkey);
  },
  passkeys: () => Promise.resolve(passkeys.get(current?.email ?? '') ?? []),
  renamePasskey: (id, name) => {
    const email = current?.email ?? '';
    passkeys.set(
      email,
      (passkeys.get(email) ?? []).map((passkey) =>
        passkey.id === id ? { ...passkey, name } : passkey,
      ),
    );
    return Promise.resolve();
  },
  removePasskey: (id) => {
    const email = current?.email ?? '';
    passkeys.set(
      email,
      (passkeys.get(email) ?? []).filter((passkey) => passkey.id !== id),
    );
    return Promise.resolve();
  },
  requireSecondFactor: () => {
    if (current) {
      current = { ...current, secondFactor: 'required', accessToken: FAKE_TOKEN };
      notifyCurrent();
    }
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

function passkeyFailure(): AuthFailure | undefined {
  if (passkeyControl.down) return new AuthFailure('passkeys-unavailable');
  if (passkeyControl.cancelled) return new AuthFailure('passkey-cancelled');
  return undefined;
}

function notifyCurrent() {
  act(() => {
    notify({ session: current, expired: false });
  });
}

/** The session gives its second factor's code. */
function giveCode() {
  if (!current) {
    return;
  }
  current = { ...current, secondFactor: 'given', accessToken: `${FAKE_TOKEN}-aal2` };
  act(() => {
    notify({ session: current, expired: false });
  });
}

export const fakeAuth = {
  /** Starts the test signed in (call before rendering) or signs in during it. */
  signIn(email = 'ada@example.com') {
    current = {
      visitorId: `visitor-${email}`,
      accessToken: FAKE_TOKEN,
      email,
      secondFactor: secondFactors.has(email) ? 'required' : 'none',
    };
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
  /** The account has a second factor: signing in asks for its code. */
  withSecondFactor(email = 'ada@example.com', apps = 1) {
    secondFactors.set(email, apps);
  },
  /** The second factor turns on elsewhere: this session has not given its code. */
  secondFactorAddedElsewhere(email = 'ada@example.com') {
    secondFactors.set(email, 1);
  },
  hasSecondFactor: (email = 'ada@example.com') => secondFactors.has(email),
  /** The browser can use passkeys (jsdom, like old browsers, cannot). */
  supportPasskeys() {
    passkeyControl.supported = true;
  },
  /** Supabase's passkeys cannot be used right now. */
  passkeysDown() {
    passkeyControl.down = true;
  },
  /** The account already has a passkey on this device. */
  withPasskey(email = 'ada@example.com', name = 'MacBook') {
    passkeys.set(email, [
      ...(passkeys.get(email) ?? []),
      {
        id: `passkey-${String(passkeyControl.next++)}`,
        name,
        createdAt: '2026-10-01T08:00:00.000Z',
      },
    ]);
  },
  passkeysOf: (email = 'ada@example.com') => passkeys.get(email) ?? [],
  /** The signed-in Visitor gives their second factor's code. */
  giveSecondFactorNow: () => authClient.giveSecondFactor(FAKE_TOTP_CODE),
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
    secondFactors.clear();
    passkeys.clear();
    Object.assign(passkeyControl, { supported: false, down: false, cancelled: false, next: 1 });
  },
};
