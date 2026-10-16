import { authClient } from './auth-client';
import type { AuthSession } from './types';

/** Signed in as far as the app is concerned: with the second factor's code, if needed. */
export const complete = (session: AuthSession | undefined) =>
  session?.secondFactor === 'required' ? undefined : session;

/** The signed-in Visitor's id where hooks cannot reach (e.g. route loaders). */
export function signedInVisitorId(): string | undefined {
  return complete(authClient.session())?.visitorId;
}
