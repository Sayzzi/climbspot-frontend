import { createContext } from 'react';

import type { AuthenticatorEnrolment, AuthSession, SignUpOutcome } from './types';

export interface AuthContextValue {
  readonly available: boolean;
  /** The signed-in Visitor's session; none until it gave the second factor's code, if needed. */
  readonly session: AuthSession | undefined;
  /** Signed in, but the second factor's code is still to give. */
  readonly secondFactorPending: boolean;
  /** True once a session ended because the API no longer accepted it. */
  readonly expired: boolean;
  readonly sendMagicLink: (email: string) => Promise<void>;
  readonly signInWithGoogle: () => Promise<void>;
  readonly signInWithPassword: (email: string, password: string) => Promise<void>;
  readonly signUp: (email: string, password: string) => Promise<SignUpOutcome>;
  readonly sendPasswordReset: (email: string) => Promise<void>;
  readonly updatePassword: (password: string, code?: string) => Promise<void>;
  readonly requestReauthentication: () => Promise<void>;
  readonly enrollAuthenticator: () => Promise<AuthenticatorEnrolment>;
  readonly verifyAuthenticator: (factorId: string, code: string) => Promise<void>;
  readonly giveSecondFactor: (code: string) => Promise<void>;
  readonly authenticatorCount: () => Promise<number>;
  readonly removeAuthenticators: () => Promise<void>;
  readonly signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
