import {
  AuthCredential,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser,
  linkWithCredential,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db } from '@/src/services/firebaseClient';
import { getUserProfile } from '@/src/services/authService';
import { AppUser } from '@/src/types/models';

const DEFAULT_OAUTH_ROLE = 'customer' as const;

function displayNameFromFirebaseUser(user: FirebaseUser): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  const local = user.email?.split('@')[0]?.trim();
  if (local) return local;
  return 'User';
}

function authProviderFromFirebaseUser(user: FirebaseUser): 'google' | 'apple' {
  return user.providerData.some((provider) => provider.providerId === 'apple.com') ? 'apple' : 'google';
}

async function createOAuthUserProfile(user: FirebaseUser): Promise<AppUser> {
  const email = (user.email ?? '').trim().toLowerCase();
  const displayName = displayNameFromFirebaseUser(user);
  const authProvider = authProviderFromFirebaseUser(user);
  const profileDoc = {
    email,
    displayName,
    role: DEFAULT_OAUTH_ROLE,
    authType: authProvider,
    authProvider,
    plan: 'free' as const,
    language: 'en',
    isActive: true,
    isGuest: false,
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, firebaseCollections.users, user.uid), profileDoc);

  return {
    id: user.uid,
    email: profileDoc.email,
    displayName: profileDoc.displayName,
    role: profileDoc.role,
    authType: profileDoc.authType,
    authProvider: profileDoc.authProvider,
    plan: profileDoc.plan,
    language: profileDoc.language,
    isActive: true,
    isGuest: false,
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function isGuestLikeProfile(profile: AppUser): boolean {
  return (
    profile.isGuest === true
    || profile.authType === 'anonymous'
    || profile.authProvider === 'anonymous'
    || profile.plan === 'guest_trial'
  );
}

async function convertOAuthGuestProfile(user: FirebaseUser, existing: AppUser): Promise<AppUser> {
  const authProvider = authProviderFromFirebaseUser(user);
  const email = (user.email ?? existing.email ?? '').trim().toLowerCase();
  const displayName = displayNameFromFirebaseUser(user);
  await setDoc(
    doc(db, firebaseCollections.users, user.uid),
    {
      email,
      displayName,
      role: DEFAULT_OAUTH_ROLE,
      authType: authProvider,
      authProvider,
      plan: 'free' as const,
      language: existing.language ?? 'en',
      isActive: true,
      isGuest: false,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  const converted = await getUserProfile(user.uid);
  if (!converted) throw new Error('Account profile is missing after social sign-in.');
  return converted;
}

async function resolveSignedInProfile(user: FirebaseUser): Promise<AppUser> {
  const existing = await getUserProfile(user.uid);

  if (existing) {
    if (existing.isActive === false) {
      await signOut(auth);
      throw new Error('This account is inactive. Contact an admin.');
    }
    if (isGuestLikeProfile(existing)) {
      return convertOAuthGuestProfile(user, existing);
    }
    return existing;
  }

  return createOAuthUserProfile(user);
}

async function signInOrLinkWithCurrentGuest(credential: AuthCredential): Promise<FirebaseUser> {
  const anonymous = auth.currentUser?.isAnonymous ? auth.currentUser : null;
  if (!anonymous) {
    const result = await signInWithCredential(auth, credential);
    return result.user;
  }

  try {
    const result = await linkWithCredential(anonymous, credential);
    return result.user;
  } catch (error) {
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
    if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
      const result = await signInWithCredential(auth, credential);
      return result.user;
    }
    throw error;
  }
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim()
      || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENTID?.trim()
      || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim()
      || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENTID?.trim()
      || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim()
      || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENTID?.trim()
  );
}

export async function signInWithGoogleIdToken(idToken: string): Promise<AppUser> {
  if (!idToken) {
    throw new Error('Google sign-in did not return a token. Try again.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const user = await signInOrLinkWithCurrentGuest(credential);
  return resolveSignedInProfile(user);
}

export async function signInWithAppleTokens(identityToken: string, rawNonce: string): Promise<AppUser> {
  if (!identityToken || !rawNonce) {
    throw new Error('Apple sign-in did not return required credentials. Try again.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: identityToken,
    rawNonce,
  });
  const user = await signInOrLinkWithCurrentGuest(credential);
  return resolveSignedInProfile(user);
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}
