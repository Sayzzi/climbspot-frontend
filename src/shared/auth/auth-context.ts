import { createContext } from 'react';

import type { AuthSession } from './types';

export interface AuthContextValue {
  readonly available: boolean;
  readonly session: AuthSession | undefined;
  /** True once a session ended because the API no longer accepted it. */
  readonly expired: boolean;
  readonly sendMagicLink: (email: string) => Promise<void>;
  readonly signInWithGoogle: () => Promise<void>;
  readonly signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
