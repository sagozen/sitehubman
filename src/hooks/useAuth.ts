import { useContext } from 'react';
import { AuthContext } from '@/src/providers/AuthProvider';
import type { AuthContextValue, LoginInput, RegisterInput } from '@/src/types/auth';
import type { AppUser } from '@/src/types/models';

function missingAuthProviderError(): Error {
  return new Error('AuthProvider is not mounted yet. Try again after the app finishes loading.');
}

const fallbackAuth: AuthContextValue = {
  user: null,
  isLoading: true,
  error: null,
  async signIn(_input: LoginInput): Promise<AppUser> {
    throw missingAuthProviderError();
  },
  async signUp(_input: RegisterInput): Promise<AppUser> {
    throw missingAuthProviderError();
  },
  async signInAsGuest(): Promise<void> {
    throw missingAuthProviderError();
  },
  async signOutUser(): Promise<void> {
    throw missingAuthProviderError();
  },
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    if (__DEV__) {
      console.warn('[useAuth] AuthProvider is not mounted for this render; returning loading fallback.');
    }
    return fallbackAuth;
  }
  return context;
}
