/** A signed-in Visitor's session, as far as the app needs it. */
export interface AuthSession {
  /** Who is signed in: the same across the session, while its token is renewed. */
  readonly visitorId: string;
  /** Sent to the API to prove who the Visitor is; renewed about every hour. */
  readonly accessToken: string;
  readonly email: string | undefined;
  /**
   * The Visitor's second factor: `none` when they have none, `required` until this
   * session gives its code (they count as signed out meanwhile), `given` once it has.
   */
  readonly secondFactor: 'none' | 'required' | 'given';
}

/** What an authenticator app needs to start giving codes. */
export interface AuthenticatorEnrolment {
  readonly factorId: string;
  /** An image of the QR code to scan, as a data URL. */
  readonly qrCode: string;
  /** The same, as a key to type. */
  readonly secret: string;
}

/** Why signing in or creating an account did not work, in terms the app can explain. */
export type AuthFailureReason =
  | 'invalid-credentials'
  | 'email-not-confirmed'
  | 'weak-password'
  /** Changing the password needs the code just sent by e-mail ("Secure password change"). */
  | 'reauthentication-needed'
  | 'invalid-code'
  | 'failed';

export class AuthFailure extends Error {
  readonly reason: AuthFailureReason;

  constructor(reason: AuthFailureReason) {
    super(`Signing in failed: ${reason}.`);
    this.name = 'AuthFailure';
    this.reason = reason;
  }
}

/** What creating an account led to: signed in at once, or an e-mail to confirm first. */
export type SignUpOutcome = 'signed-in' | 'confirmation-sent';

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
  /** @throws {AuthFailure} when the e-mail and password do not sign in. */
  signInWithPassword(email: string, password: string): Promise<void>;
  /**
   * Creates an account with a password; the confirmation link brings the Visitor back
   * to `returnTo`. Never tells whether the address already had an account.
   * @throws {AuthFailure}
   */
  signUp(email: string, password: string, returnTo: string): Promise<SignUpOutcome>;
  /** Sends a link to choose a new password, bringing the Visitor back to `returnTo` signed in. */
  sendPasswordReset(email: string, returnTo: string): Promise<void>;
  /**
   * Sets the signed-in Visitor's password; `code` is the one sent by e-mail when Supabase
   * asks the Visitor to prove it is them.
   * @throws {AuthFailure} `reauthentication-needed` when a code is needed and none was given.
   */
  updatePassword(password: string, code?: string): Promise<void>;
  /** Sends the signed-in Visitor a code by e-mail, for `updatePassword`. */
  requestReauthentication(): Promise<void>;
  /** Starts adding an authenticator app as a second factor. */
  enrollAuthenticator(): Promise<AuthenticatorEnrolment>;
  /**
   * Turns the authenticator on with a first code from it; the session then counts as
   * having given the second factor.
   * @throws {AuthFailure} `invalid-code`
   */
  verifyAuthenticator(factorId: string, code: string): Promise<void>;
  /**
   * Gives the second factor's code for this session, from any of the Visitor's apps.
   * @throws {AuthFailure} `invalid-code`
   */
  giveSecondFactor(code: string): Promise<void>;
  /** How many authenticator apps give the Visitor's codes. */
  authenticatorCount(): Promise<number>;
  /** Turns the second factor off: every authenticator app stops being asked for. */
  removeAuthenticators(): Promise<void>;
  /** The API says this session must give the second factor's code: ask for it. */
  requireSecondFactor(): Promise<void>;
  signOut(): Promise<void>;
  /** Ends a session the API refused; like any session the Visitor did not end, it expired. */
  expire(): Promise<void>;
}
