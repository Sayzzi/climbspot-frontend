import { createClient, type Session } from '@supabase/supabase-js';

import { env } from '@/shared/config/env';

import type { AuthChange, AuthClient, AuthSession } from './types';

const toSession = (session: Session | null): AuthSession | undefined =>
  session ? { accessToken: session.access_token, email: session.user.email } : undefined;

function supabaseAuthClient(url: string, publishableKey: string): AuthClient {
  // Picks up the session from the link or Google's redirect on its own.
  const supabase = createClient(url, publishableKey, { auth: { detectSessionInUrl: true } });
  const listeners = new Set<(change: AuthChange) => void>();
  let current: AuthSession | undefined;
  let expiring = false;

  supabase.auth.onAuthStateChange((_event, session) => {
    current = toSession(session);
    const change = { session: current, expired: expiring && current === undefined };
    expiring = false;
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
    signOut: async () => {
      await supabase.auth.signOut();
    },
    expire: async () => {
      expiring = true;
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
  signOut: () => Promise.resolve(),
  expire: () => Promise.resolve(),
};

export const authClient: AuthClient =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? supabaseAuthClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : unavailable;
