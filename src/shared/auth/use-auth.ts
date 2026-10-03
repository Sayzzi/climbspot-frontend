import { use } from 'react';

import { AuthContext, type AuthContextValue } from './auth-context';

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (value === undefined) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return value;
}
