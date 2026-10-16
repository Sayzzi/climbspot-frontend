import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { authClient } from './auth-client';
import { AuthContext } from './auth-context';
import { complete } from './signed-in-visitor';
import type { AuthSession } from './types';

/** Where the Visitor comes back after signing in: the home page of this site. */
const returnTo = () => `${window.location.origin}/`;

/** Where a link to choose a new password brings the Visitor. */
const newPasswordPage = () => `${window.location.origin}/new-password`;

/** How long signing in is confirmed for. */
const SIGNED_IN_MS = 5000;

/** Holds the signed-in Visitor's session for the whole app. */
export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | undefined>(() => authClient.session());
  const [expired, setExpired] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);

  useEffect(() => {
    let before = complete(authClient.session());
    return authClient.onChange((change) => {
      const after = complete(change.session);
      if (!before && after && !change.restored) {
        setJustSignedIn(true);
      } else if (!after) {
        setJustSignedIn(false);
      }
      before = after;
      setSession(change.session);
      setExpired(change.expired);
    });
  }, []);

  useEffect(() => {
    if (!justSignedIn) {
      return;
    }
    const timer = setTimeout(() => {
      setJustSignedIn(false);
    }, SIGNED_IN_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [justSignedIn]);

  const value = useMemo(
    () => ({
      available: authClient.available,
      // Until the second factor's code is given, the Visitor counts as signed out.
      session: complete(session),
      secondFactorPending: session?.secondFactor === 'required',
      expired,
      justSignedIn,
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
      authenticatorCount: () => authClient.authenticatorCount(),
      removeAuthenticators: () => authClient.removeAuthenticators(),
      supportsPasskeys: authClient.supportsPasskeys(),
      signInWithPasskey: () => authClient.signInWithPasskey(),
      registerPasskey: () => authClient.registerPasskey(),
      passkeys: () => authClient.passkeys(),
      renamePasskey: (id: string, name: string) => authClient.renamePasskey(id, name),
      removePasskey: (id: string) => authClient.removePasskey(id),
      signOut: () => authClient.signOut(),
    }),
    [session, expired, justSignedIn],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
