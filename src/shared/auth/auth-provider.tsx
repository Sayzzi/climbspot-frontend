import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { authClient } from './auth-client';
import { AuthContext } from './auth-context';
import type { AuthSession } from './types';

/** Where the Visitor comes back after signing in: the home page of this site. */
const returnTo = () => `${window.location.origin}/`;

/** Where a link to choose a new password brings the Visitor. */
const newPasswordPage = () => `${window.location.origin}/new-password`;

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
      // Until the second factor's code is given, the Visitor counts as signed out.
      session: session?.secondFactor === 'required' ? undefined : session,
      secondFactorPending: session?.secondFactor === 'required',
      expired,
      sendMagicLink: (email: string) => authClient.sendMagicLink(email, returnTo()),
      signInWithGoogle: () => authClient.signInWithGoogle(returnTo()),
      signInWithPassword: (email: string, password: string) =>
        authClient.signInWithPassword(email, password),
      signUp: (email: string, password: string) => authClient.signUp(email, password, returnTo()),
      sendPasswordReset: (email: string) => authClient.sendPasswordReset(email, newPasswordPage()),
      updatePassword: (password: string, code?: string) =>
        authClient.updatePassword(password, code),
      requestReauthentication: () => authClient.requestReauthentication(),
      enrollAuthenticator: () => authClient.enrollAuthenticator(),
      verifyAuthenticator: (factorId: string, code: string) =>
        authClient.verifyAuthenticator(factorId, code),
      giveSecondFactor: (code: string) => authClient.giveSecondFactor(code),
      signOut: () => authClient.signOut(),
    }),
    [session, expired],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
