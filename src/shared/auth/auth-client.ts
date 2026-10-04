import { createClient, isAuthError, type AuthError, type Session } from '@supabase/supabase-js';

import { env } from '@/shared/config/env';

import {
  AuthFailure,
  type AuthChange,
  type AuthClient,
  type AuthSession,
  type Passkey,
} from './types';

/** The session's authenticator assurance level, read from its access token. */
function assuranceOf(accessToken: string): string | undefined {
  try {
    const payload = accessToken.split('.')[1] ?? '';
    const claims = JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/'))) as {
      aal?: string;
    };
    return claims.aal;
  } catch {
    return undefined;
  }
}

function toSession(session: Session | null): AuthSession | undefined {
  if (!session) {
    return undefined;
  }
  const hasSecondFactor = (session.user.factors ?? []).some(
    (factor) => factor.factor_type === 'totp' && factor.status === 'verified',
  );
  return {
    visitorId: session.user.id,
    accessToken: session.access_token,
    email: session.user.email,
    secondFactor: !hasSecondFactor
      ? 'none'
      : assuranceOf(session.access_token) === 'aal2'
        ? 'given'
        : 'required',
  };
}

/** Supabase's error, as a reason the app can explain. */
function failureOf(error: AuthError): AuthFailure {
  switch (error.code) {
    case 'invalid_credentials':
      return new AuthFailure('invalid-credentials');
    case 'email_not_confirmed':
      return new AuthFailure('email-not-confirmed');
    case 'weak_password':
      return new AuthFailure('weak-password');
    case 'reauthentication_needed':
      return new AuthFailure('reauthentication-needed');
    case 'reauthentication_not_valid':
    case 'mfa_verification_failed':
      return new AuthFailure('invalid-code');
    default:
      return new AuthFailure('failed');
  }
}

/**
 * A passkey ceremony's error: the Visitor closing the prompt, a passkey already on this
 * device, or anything else making passkeys (in beta) unusable for now.
 */
function passkeyFailureOf(error: unknown): AuthFailure {
  const { code, cause } = (error ?? {}) as { code?: string; cause?: { name?: string } };
  if (code === 'ERROR_CEREMONY_ABORTED' || cause?.name === 'NotAllowedError') {
    return new AuthFailure('passkey-cancelled');
  }
  if (code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
    return new AuthFailure('passkey-exists');
  }
  return isAuthError(error) && error.code === 'mfa_verification_failed'
    ? failureOf(error)
    : new AuthFailure('passkeys-unavailable');
}

const toPasskey = (passkey: {
  id: string;
  friendly_name?: string;
  created_at: string;
}): Passkey => ({
  id: passkey.id,
  name: passkey.friendly_name,
  createdAt: passkey.created_at,
});

function supabaseAuthClient(url: string, publishableKey: string): AuthClient {
  // Picks up the session from the link or Google's redirect on its own.
  const supabase = createClient(url, publishableKey, { auth: { detectSessionInUrl: true } });
  const listeners = new Set<(change: AuthChange) => void>();
  let current: AuthSession | undefined;
  let signingOut = false;

  supabase.auth.onAuthStateChange((_event, session) => {
    const previous = current;
    current = toSession(session);
    // A session that ends without the Visitor signing out has expired: the API refused
    // it, or Supabase could no longer refresh it.
    const change = {
      session: current,
      expired: previous !== undefined && current === undefined && !signingOut,
    };
    for (const listener of listeners) listener(change);
  });

  /** The Visitor's verified authenticator apps (TOTP), the only second factor asked for. */
  const authenticatorApps = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw failureOf(error);
    return data.totp;
  };

  return {
    available: true,
    session: () => current,
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    sendMagicLink: async (email, returnTo) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: returnTo },
      });
      if (error) throw error;
    },
    signInWithGoogle: async (returnTo) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: returnTo },
      });
      if (error) throw error;
    },
    signInWithPassword: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw failureOf(error);
    },
    signUp: async (email, password, returnTo) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: returnTo },
      });
      if (error) throw failureOf(error);
      return data.session ? 'signed-in' : 'confirmation-sent';
    },
    sendPasswordReset: async (email, returnTo) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: returnTo });
      if (error) throw failureOf(error);
    },
    updatePassword: async (password, code) => {
      const { error } = await supabase.auth.updateUser({
        password,
        ...(code !== undefined && { nonce: code }),
      });
      if (error) throw failureOf(error);
    },
    requestReauthentication: async () => {
      const { error } = await supabase.auth.reauthenticate();
      if (error) throw failureOf(error);
    },
    enrollAuthenticator: async () => {
      // An enrolment left unfinished would stand in the way of this one.
      const listed = await supabase.auth.mfa.listFactors();
      for (const factor of listed.data?.all ?? []) {
        if (factor.factor_type === 'totp' && factor.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Authenticator ${new Date().toISOString()}`,
      });
      if (error) throw failureOf(error);
      return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
    },
    verifyAuthenticator: async (factorId, code) => {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw failureOf(error);
    },
    giveSecondFactor: async (code) => {
      // Each of the Visitor's apps gives its own codes: try them in turn.
      for (const factor of await authenticatorApps()) {
        const verified = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
        if (!verified.error) {
          return;
        }
        if (verified.error.code !== 'mfa_verification_failed') {
          throw failureOf(verified.error);
        }
      }
      throw new AuthFailure('invalid-code');
    },
    authenticatorCount: async () => (await authenticatorApps()).length,
    removeAuthenticators: async () => {
      for (const factor of await authenticatorApps()) {
        const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (removed.error) throw failureOf(removed.error);
      }
      // The session's user now has no factor: refreshing tells the listeners.
      await supabase.auth.refreshSession();
    },
    supportsPasskeys: () => typeof window.PublicKeyCredential === 'function',
    signInWithPasskey: async () => {
      const { error } = await supabase.auth.signInWithPasskey().catch((thrown: unknown) => ({
        error: thrown,
      }));
      if (error) throw passkeyFailureOf(error);
    },
    registerPasskey: async () => {
      const { data, error } = await supabase.auth.registerPasskey().catch((thrown: unknown) => ({
        data: null,
        error: thrown,
      }));
      if (error || !data) throw passkeyFailureOf(error);
      return toPasskey(data);
    },
    passkeys: async () => {
      const { data, error } = await supabase.auth.passkey.list();
      if (error) throw passkeyFailureOf(error);
      return data.map(toPasskey);
    },
    renamePasskey: async (id, name) => {
      const { error } = await supabase.auth.passkey.update({ passkeyId: id, friendlyName: name });
      if (error) throw passkeyFailureOf(error);
    },
    removePasskey: async (id) => {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
      if (error) throw passkeyFailureOf(error);
    },
    requireSecondFactor: async () => {
      // The factor was added elsewhere: the user, refreshed, now has it. If they no longer
      // do (turned off a moment ago), the API's answer is stale: nothing to ask for.
      const { data } = await supabase.auth.refreshSession();
      const refreshed = toSession(data.session);
      if (refreshed && (await authenticatorApps()).length > 0) {
        current = { ...refreshed, secondFactor: 'required' };
        for (const listener of listeners) listener({ session: current, expired: false });
      }
    },
    signOut: async () => {
      // Supabase tells its listeners before `signOut` resolves.
      signingOut = true;
      try {
        await supabase.auth.signOut();
      } finally {
        signingOut = false;
      }
    },
    expire: async () => {
      await supabase.auth.signOut({ scope: 'local' });
    },
  };
}

/** Signing in is off until the Supabase project is configured. */
const unavailable: AuthClient = {
  available: false,
  session: () => undefined,
  onChange: () => () => undefined,
  sendMagicLink: () => Promise.reject(new Error('Signing in is not configured.')),
  signInWithGoogle: () => Promise.reject(new Error('Signing in is not configured.')),
  signInWithPassword: () => Promise.reject(new AuthFailure('failed')),
  signUp: () => Promise.reject(new AuthFailure('failed')),
  sendPasswordReset: () => Promise.reject(new AuthFailure('failed')),
  updatePassword: () => Promise.reject(new AuthFailure('failed')),
  requestReauthentication: () => Promise.reject(new AuthFailure('failed')),
  enrollAuthenticator: () => Promise.reject(new AuthFailure('failed')),
  verifyAuthenticator: () => Promise.reject(new AuthFailure('failed')),
  giveSecondFactor: () => Promise.reject(new AuthFailure('failed')),
  authenticatorCount: () => Promise.resolve(0),
  removeAuthenticators: () => Promise.reject(new AuthFailure('failed')),
  requireSecondFactor: () => Promise.resolve(),
  supportsPasskeys: () => false,
  signInWithPasskey: () => Promise.reject(new AuthFailure('passkeys-unavailable')),
  registerPasskey: () => Promise.reject(new AuthFailure('passkeys-unavailable')),
  passkeys: () => Promise.resolve([]),
  renamePasskey: () => Promise.reject(new AuthFailure('passkeys-unavailable')),
  removePasskey: () => Promise.reject(new AuthFailure('passkeys-unavailable')),
  signOut: () => Promise.resolve(),
  expire: () => Promise.resolve(),
};

export const authClient: AuthClient =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? supabaseAuthClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : unavailable;
