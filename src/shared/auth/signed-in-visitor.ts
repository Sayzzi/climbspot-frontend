import { authClient } from './auth-client';

/**
 * The signed-in Visitor's id where hooks cannot reach (e.g. route loaders); none until
 * they gave the second factor's code, if they need one.
 */
export function signedInVisitorId(): string | undefined {
  const session = authClient.session();
  return session?.secondFactor === 'required' ? undefined : session?.visitorId;
}
