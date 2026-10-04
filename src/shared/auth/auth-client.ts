import { createClient, type AuthError, type Session } from '@supabase/supabase-js';

import { env } from '@/shared/config/env';

import { AuthFailure, type AuthChange, type AuthClient, type AuthSession } from './types';

const toSession = (session: Session | null): AuthSession | undefined =>
  session
    ? { visitorId: session.user.id, accessToken: session.access_token, email: session.user.email }
    : undefined;

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
      return new AuthFailure('invalid-code');
    default:
      return new AuthFailure('failed');
  }
}

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
  signOut: () => Promise.resolve(),
  expire: () => Promise.resolve(),
};

export const authClient: AuthClient =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? supabaseAuthClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : unavailable;
