import { createContext } from 'react';

import type { AuthSession, SignUpOutcome } from './types';

export interface AuthContextValue {
  readonly available: boolean;
  readonly session: AuthSession | undefined;
  /** True once a session ended because the API no longer accepted it. */
  readonly expired: boolean;
  readonly sendMagicLink: (email: string) => Promise<void>;
  readonly signInWithGoogle: () => Promise<void>;
  readonly signInWithPassword: (email: string, password: string) => Promise<void>;
  readonly signUp: (email: string, password: string) => Promise<SignUpOutcome>;
  readonly signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
