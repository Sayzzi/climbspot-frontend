import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { authClient } from './auth-client';
import { AuthContext } from './auth-context';
import type { AuthSession } from './types';

/** Where the Visitor comes back after signing in: the home page of this site. */
const returnTo = () => `${window.location.origin}/`;

/** Holds the signed-in Visitor's session for the whole app. */
export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | undefined>(() => authClient.session());
  const [expired, setExpired] = useState(false);

  useEffect(
    () =>
      authClient.onChange((change) => {
        setSession(change.session);
        setExpired(change.expired);
      }),
    [],
  );

  const value = useMemo(
    () => ({
      available: authClient.available,
      session,
      expired,
      sendMagicLink: (email: string) => authClient.sendMagicLink(email, returnTo()),
      signInWithGoogle: () => authClient.signInWithGoogle(returnTo()),
      signOut: () => authClient.signOut(),
    }),
    [session, expired],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
