import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getAuthErrorMessage,
  getUserProfile,
  isAnonymousAuthDisabledError,
  observeAuthState,
  signInAsAnonymousTrial,
  signIn as signInWithEmail,
  signOutCurrentUser,
  signUp as signUpWithEmail,
} from '@/src/services/authService';
import { useRegisterPushNotifications } from '@/src/hooks/useRegisterPushNotifications';
import { firebaseInitError } from '@/src/services/firebase/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { RoleGatekeeperModal } from '@/src/components/RoleGatekeeperModal';
import { AuthContextValue, LoginInput, RegisterInput } from '@/src/types/auth';
import { AppUser } from '@/src/types/models';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createGuestUser(): AppUser {
  const now = new Date().toISOString();
  return {
    id: 'guest',
    email: '',
    displayName: 'Thean Coc',
    role: 'guest',
    language: 'en',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    isGuest: true,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useRegisterPushNotifications(user?.id);

  // Only use this for guest mode, not real Firebase users
  const managedUser = useRef<AppUser | null>(null);
  const isSigningOut = useRef(false);
  const unsubProfileSnapshot = useRef<(() => void) | null>(null);
  const userRef = useRef<AppUser | null>(null);

  const [roleGatekeeperState, setRoleGatekeeperState] = useState<{
    visible: boolean;
    oldRole: string;
    newRole: string;
    isDeactivated: boolean;
  }>({
    visible: false,
    oldRole: '',
    newRole: '',
    isDeactivated: false,
  });

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const applyGuestSession = useCallback(() => {
    const guestUser = managedUser.current?.isGuest ? managedUser.current : createGuestUser();
    managedUser.current = guestUser;
    setUser(guestUser);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (firebaseInitError) {
      setError(firebaseInitError);
      setIsLoading(false);
      return;
    }

    const authReadyTimeout = setTimeout(() => {
      setError((prev) => prev ?? 'Startup timed out. Check internet or reinstall the latest APK.');
      setIsLoading(false);
    }, 12_000);

    const unsubscribe = observeAuthState(async (firebaseUser) => {
      if (isSigningOut.current) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (managedUser.current?.isGuest) {
        applyGuestSession();
        return;
      }

      if (!firebaseUser) {
        if (managedUser.current?.isGuest) {
          applyGuestSession();
          return;
        }
        managedUser.current = null;
        setUser(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);

        if (managedUser.current?.isGuest) {
          applyGuestSession();
          return;
        }

        if (profile?.isActive === false) {
          await signOutCurrentUser();
          managedUser.current = null;
          setUser(null);
          setError('This account is inactive. Contact an admin.');
          setIsLoading(false);
          return;
        }

        if (profile) {
          setUser(profile);
          setError(null);
        } else {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
            role: 'customer',
            language: 'en',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setError(null);
        }

        // Real-time listener for staff permission changes / deactivations
        if (firebaseUser.uid) {
          unsubProfileSnapshot.current?.();
          unsubProfileSnapshot.current = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            if (!docSnap.exists()) return;
            const updated = docSnap.data();
            if (updated.isActive === false) {
              setRoleGatekeeperState({
                visible: true,
                oldRole: updated.role || 'user',
                newRole: updated.role || 'user',
                isDeactivated: true,
              });
            } else if (updated.role && userRef.current && userRef.current.role !== updated.role && !userRef.current.isGuest) {
              const previous = userRef.current.role;
              setRoleGatekeeperState({
                visible: true,
                oldRole: previous,
                newRole: updated.role,
                isDeactivated: false,
              });
            }
          }, () => undefined);
        }
      } catch {
        if (managedUser.current?.isGuest) {
          applyGuestSession();
          return;
        }

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
          role: 'customer',
          language: 'en',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setError(null);
      } finally {
        if (!managedUser.current?.isGuest) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      clearTimeout(authReadyTimeout);
      unsubscribe();
      unsubProfileSnapshot.current?.();
    };
  }, [applyGuestSession]);

  // FIX: Memoize all auth methods with useCallback so the context value
  // doesn't change on every render. Previously these were inline object
  // methods recreated every render, causing all useAuth() consumers to
  // re-render — a major contributor to the infinite update depth error.

  const signIn = useCallback(async (input: LoginInput) => {
    setError(null);
    setIsLoading(true);
    isSigningOut.current = false;
    managedUser.current = null;

    try {
      const profile = await signInWithEmail(input);
      setUser(profile);
      return profile;
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    setError(null);
    setIsLoading(true);
    isSigningOut.current = false;
    managedUser.current = null;

    try {
      const profile = await signUpWithEmail(input);
      setUser(profile);
      return profile;
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInAsGuest = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    isSigningOut.current = false;
    managedUser.current = null;
    try {
      const profile = await signInAsAnonymousTrial();
      managedUser.current = null;
      setUser(profile);
    } catch (err) {
      if (isAnonymousAuthDisabledError(err)) {
        try {
          await signOutCurrentUser();
        } catch {
          // Best-effort cleanup before local preview guest.
        }
        applyGuestSession();
        setError(getAuthErrorMessage(err));
        return;
      }
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [applyGuestSession]);

  const signOutUser = useCallback(async () => {
    if (__DEV__) {
      console.debug('[auth/provider] signOutUser start', { email: user?.email, role: user?.role });
    }
    isSigningOut.current = true;
    managedUser.current = null;

    setUser(null);
    setError(null);
    setIsLoading(true);

    try {
      await signOutCurrentUser();
      if (__DEV__) {
        console.debug('[auth/provider] Firebase sign-out resolved');
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[auth/provider] Firebase sign-out failed after local clear', err);
      }
      // already cleared locally
    } finally {
      managedUser.current = null;
      setUser(null);
      setError(null);
      setIsLoading(false);
      if (__DEV__) {
        console.debug('[auth/provider] signOutUser finalized');
      }

      setTimeout(() => {
        isSigningOut.current = false;
      }, 300);
    }
  }, [user?.email, user?.role]);

  // FIX: useMemo the context value so it only creates a new object
  // when user, isLoading, error, or the memoized callbacks change.
  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signInAsGuest,
    signOutUser,
  }), [user, isLoading, error, signIn, signUp, signInAsGuest, signOutUser]);

  const handleAcknowledgeRoleUpdate = useCallback(() => {
    if (roleGatekeeperState.isDeactivated) {
      void signOutUser();
    } else if (roleGatekeeperState.newRole) {
      setUser((prev) => (prev ? { ...prev, role: roleGatekeeperState.newRole as any } : prev));
    }
    setRoleGatekeeperState((prev) => ({ ...prev, visible: false }));
  }, [roleGatekeeperState, signOutUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <RoleGatekeeperModal
        visible={roleGatekeeperState.visible}
        oldRole={roleGatekeeperState.oldRole}
        newRole={roleGatekeeperState.newRole}
        isDeactivated={roleGatekeeperState.isDeactivated}
        onAcknowledge={handleAcknowledgeRoleUpdate}
      />
    </AuthContext.Provider>
  );
}

export { AuthContext };
