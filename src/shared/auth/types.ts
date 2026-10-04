/** A signed-in Visitor's session, as far as the app needs it. */
export interface AuthSession {
  /** Sent to the API to prove who the Visitor is. */
  readonly accessToken: string;
  readonly email: string | undefined;
}

export interface AuthChange {
  readonly session: AuthSession | undefined;
  /** True when the session ended because the API no longer accepted it. */
  readonly expired: boolean;
}

/** Signing in and out with the identity provider (ADR 0009); the only code that knows it. */
export interface AuthClient {
  /** False when the app is not configured for signing in. */
  readonly available: boolean;
  /** The current session, if the Visitor is signed in. */
  session(): AuthSession | undefined;
  /** Calls `listener` whenever the session changes; returns how to stop. */
  onChange(listener: (change: AuthChange) => void): () => void;
  /** Sends a sign-in link to `email`, bringing the Visitor back to `returnTo`. */
  sendMagicLink(email: string, returnTo: string): Promise<void>;
  /** Leaves for Google's sign-in, coming back to `returnTo`. */
  signInWithGoogle(returnTo: string): Promise<void>;
  signOut(): Promise<void>;
  /** Ends a session the API refused; like any session the Visitor did not end, it expired. */
  expire(): Promise<void>;
}
