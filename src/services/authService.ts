import {
  deleteApp,
  initializeApp,
} from 'firebase/app';
import {
  User as FirebaseUser,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db, firebaseApp } from '@/src/services/firebaseClient';
import { LoginInput, RegisterInput } from '@/src/types/auth';
import { AppUser, UserRole } from '@/src/types/models';
import { CUSTOMER_TRIAL_DAYS, GUEST_PREVIEW_TRIAL_DAYS } from '@/src/constants/customerTrial';
import { buildTrialWindow } from '@/src/services/customerTrialService';
import { normalizeRole } from '@/src/utils/authFlow';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toIso(value: any) {
  const date = value?.toDate?.() ?? (value instanceof Date ? value : new Date());
  return date.toISOString();
}

const INTERNAL_ERROR_PATTERN =
  /firebase|firestore|grpc|cloud.?function|googleapis|permission_denied|insufficient permissions|internal error|status code|invalid-argument|failed-precondition|resource-exhausted|unavailable|deadline-exceeded|not-found|already-exists|projects\/|\/databases\//i;

function looksLikeInternalError(message: string) {
  return INTERNAL_ERROR_PATTERN.test(message);
}

function isLikelyUserFacingMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 180) return false;
  if (looksLikeInternalError(trimmed)) return false;
  if (/^[a-z_/:-]+$/i.test(trimmed) && trimmed.includes('/')) return false;
  return true;
}

export function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const normalizedMessage = message.toLowerCase();

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return 'Email or password is incorrect.';
  }
  if (code === 'auth/network-request-failed' || normalizedMessage.includes('network')) {
    return 'No internet connection. Check your connection and try again.';
  }
  if (code === 'unavailable') {
    return 'Our servers are temporarily unavailable. Check your connection and try again.';
  }
  if (code === 'deadline-exceeded') {
    return 'The request took too long. Check your connection and try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'That email is already registered.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method. Try email and password instead.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'ERR_REQUEST_CANCELED') {
    return 'Sign-in was cancelled.';
  }
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return 'Guest sign-in is not available right now. Try email sign-in or contact support.';
  }
  if (code === 'auth/invalid-credential' && normalizedMessage.includes('apple')) {
    return 'Apple sign-in failed. Try another sign-in method or contact support.';
  }
  if (
    code === 'failed-precondition' ||
    normalizedMessage.includes('requires an index') ||
    normalizedMessage.includes('create_composite=')
  ) {
    return 'This list is temporarily unavailable. Please try again in a few minutes.';
  }
  if (code === 'permission-denied' || normalizedMessage.includes('permission')) {
    return 'You do not have access to perform this action.';
  }
  if (code === 'unauthenticated') {
    return 'Your session expired. Sign in again and retry.';
  }
  if (code === 'functions/internal' || code === 'functions/unavailable') {
    return 'Payment is temporarily unavailable. Please try again shortly.';
  }
  if (code === 'functions/deadline-exceeded') {
    return 'The request timed out. Please try again.';
  }
  if (isLikelyUserFacingMessage(message)) {
    return message.trim();
  }
  return 'Something went wrong. Please try again in a moment.';
}

/** Alias for guest/checkout screens — never surfaces raw backend errors. */
export const getCustomerErrorMessage = getAuthErrorMessage;

function mapUser(id: string, data: any): AppUser {
  return {
    id,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    role: normalizeRole(data.role),
    authType: data.authType ?? (data.email ? 'email' : 'anonymous'),
    authProvider: data.authProvider,
    telegramId: data.telegramId,
    telegramUsername: data.telegramUsername,
    telegramPhotoUrl: data.telegramPhotoUrl,
    lastLoginAt: data.lastLoginAt ? toIso(data.lastLoginAt) : undefined,
    plan: data.plan,
    trialStartedAt: data.trialStartedAt ? toIso(data.trialStartedAt) : undefined,
    trialEndsAt: data.trialEndsAt ? toIso(data.trialEndsAt) : undefined,
    language: data.language ?? 'en',
    phone: data.phone,
    companyId: data.companyId,
    branch: data.branch,
    isActive: data.isActive !== false,
    isGuest: data.isGuest === true,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function addDays(from: Date, days: number) {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

export function isAnonymousAuthDisabledError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  return code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation';
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const reference = doc(db, firebaseCollections.users, uid);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) return null;
  return mapUser(snapshot.id, snapshot.data());
}

function isGuestLikeProfile(profile: AppUser | null): boolean {
  return Boolean(
    profile
    && (
      profile.isGuest === true
      || profile.authType === 'anonymous'
      || profile.authProvider === 'anonymous'
      || profile.plan === 'guest_trial'
    )
  );
}

async function completeEmailProfileConversion(firebaseUser: FirebaseUser, displayName: string): Promise<AppUser> {
  const uid = firebaseUser.uid;
  const email = normalizeEmail(firebaseUser.email ?? '');
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('This account is missing a verified email address.');
  }

  await setDoc(
    doc(db, firebaseCollections.users, uid),
    {
      email,
      displayName: displayName.trim() || firebaseUser.displayName || email.split('@')[0] || 'Customer',
      role: 'customer' as const,
      authType: 'email' as const,
      authProvider: 'email' as const,
      plan: 'free' as const,
      language: 'en',
      isActive: true,
      isGuest: false,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const profile = await getUserProfile(uid);
  if (!profile) throw new Error('Account was linked but profile is missing.');
  return profile;
}

async function createEmailProfile(firebaseUser: FirebaseUser, displayName: string): Promise<AppUser> {
  const uid = firebaseUser.uid;
  const email = normalizeEmail(firebaseUser.email ?? '');
  const trial = buildTrialWindow(CUSTOMER_TRIAL_DAYS);

  const profileDoc = {
    email,
    displayName: displayName.trim() || email.split('@')[0] || 'Customer',
    role: 'customer' as const,
    authType: 'email' as const,
    authProvider: 'email' as const,
    plan: 'free' as const,
    trialStartedAt: trial.trialStartedAt,
    trialEndsAt: trial.trialEndsAt,
    language: 'en',
    isActive: true,
    isGuest: false,
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, firebaseCollections.users, uid), profileDoc);

  return {
    id: uid,
    email: profileDoc.email,
    displayName: profileDoc.displayName,
    role: profileDoc.role,
    authType: profileDoc.authType,
    authProvider: profileDoc.authProvider,
    plan: profileDoc.plan,
    trialStartedAt: trial.trialStartedAt,
    trialEndsAt: trial.trialEndsAt,
    language: profileDoc.language,
    isActive: true,
    isGuest: false,
    createdBy: uid,
    updatedBy: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function signIn(input: LoginInput): Promise<AppUser> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_PATTERN.test(email) || !input.password) {
    throw new Error('Enter a valid email and password.');
  }

  if (auth.currentUser?.isAnonymous) {
    await signOut(auth);
  }

  const credential = await signInWithEmailAndPassword(auth, email, input.password);
  let profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    await signOut(auth);
    throw new Error('Account profile is missing. Ask an admin to finish backend setup.');
  }

  if (profile.isActive === false) {
    await signOut(auth);
    throw new Error('This account is inactive. Contact an admin.');
  }

  if (isGuestLikeProfile(profile)) {
    profile = await completeEmailProfileConversion(
      credential.user,
      credential.user.displayName || profile.displayName || email.split('@')[0] || 'Customer',
    );
  }

  return profile;
}

export async function signInWithFirebaseCustomToken(customToken: string): Promise<AppUser> {
  if (!customToken?.trim()) {
    throw new Error('Missing Telegram session token.');
  }

  const credential = await signInWithCustomToken(auth, customToken.trim());
  const profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    await signOut(auth);
    throw new Error('Telegram account was verified but the user profile is missing.');
  }

  if (profile.isActive === false) {
    await signOut(auth);
    throw new Error('This account is inactive. Contact an admin.');
  }

  return profile;
}

export async function signUp(input: RegisterInput): Promise<AppUser> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();

  if (!displayName || !EMAIL_PATTERN.test(email) || input.password.length < 6) {
    throw new Error('Name, valid email, and 6+ character password are required.');
  }

  const anonymous = auth.currentUser?.isAnonymous ? auth.currentUser : null;
  const currentEmailUser =
    auth.currentUser && !auth.currentUser.isAnonymous && normalizeEmail(auth.currentUser.email ?? '') === email
      ? auth.currentUser
      : null;

  if (anonymous) {
    const emailCredential = EmailAuthProvider.credential(email, input.password);
    const linked = await linkWithCredential(anonymous, emailCredential);
    await updateProfile(linked.user, { displayName });

    const uid = linked.user.uid;
    const profileDoc = {
      email,
      displayName,
      role: 'customer' as const,
      authType: 'email' as const,
      authProvider: 'email' as const,
      plan: 'free' as const,
      language: 'en',
      isActive: true,
      isGuest: false,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, firebaseCollections.users, uid), profileDoc, { merge: true });
    const profile = await getUserProfile(uid);
    if (!profile) throw new Error('Account was linked but profile is missing.');
    return profile;
  }

  if (currentEmailUser) {
    await updateProfile(currentEmailUser, { displayName }).catch(() => undefined);
    const existingProfile = await getUserProfile(currentEmailUser.uid).catch(() => null);
    if (isGuestLikeProfile(existingProfile)) {
      return completeEmailProfileConversion(currentEmailUser, displayName);
    }
    if (existingProfile) return existingProfile;
    return createEmailProfile(currentEmailUser, displayName);
  }

  const credential = await createUserWithEmailAndPassword(auth, email, input.password);
  await updateProfile(credential.user, { displayName }).catch(() => undefined);
  return createEmailProfile(credential.user, displayName);
}

export interface CreateManagedUserInput {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  branch?: string;
  createdBy: string;
}

export async function signInAsAnonymousTrial(): Promise<AppUser> {
  const credential = await signInAnonymously(auth);
  const now = new Date();
  const trialEndsAt = addDays(now, GUEST_PREVIEW_TRIAL_DAYS);
  const uid = credential.user.uid;

  const profileDoc = {
    email: '',
    displayName: 'Guest User',
    role: 'customer' as const,
    authType: 'anonymous' as const,
    authProvider: 'anonymous' as const,
    plan: 'guest_trial' as const,
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    language: 'en',
    isActive: true,
    isGuest: true,
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, firebaseCollections.users, uid), profileDoc, { merge: true });

  return {
    id: uid,
    email: '',
    displayName: profileDoc.displayName,
    role: profileDoc.role,
    authType: profileDoc.authType,
    authProvider: profileDoc.authProvider,
    plan: profileDoc.plan,
    isGuest: true,
    trialStartedAt: profileDoc.trialStartedAt,
    trialEndsAt: profileDoc.trialEndsAt,
    language: profileDoc.language,
    isActive: true,
    createdBy: uid,
    updatedBy: uid,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function createManagedUser(input: CreateManagedUserInput): Promise<AppUser> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const role = normalizeRole(input.role);

  if (!input.createdBy) {
    throw new Error('Admin session is required to create users.');
  }
  if (!displayName || !EMAIL_PATTERN.test(email) || input.password.length < 6) {
    throw new Error('Name, valid email, and 6+ character password are required.');
  }
  if (role === 'guest') {
    throw new Error('Guest accounts are preview-only and cannot be created.');
  }

  const secondaryApp = initializeApp(firebaseApp.options, `managed-user-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, input.password);
    const now = new Date().toISOString();
    const profileDoc = {
      email,
      displayName,
      role,
      phone: input.phone?.trim() || '',
      branch: input.branch?.trim() || '',
      language: 'en',
      isActive: true,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, firebaseCollections.users, credential.user.uid), profileDoc);
    await signOut(secondaryAuth);

    return {
      id: credential.user.uid,
      email,
      displayName,
      role,
      phone: profileDoc.phone,
      branch: profileDoc.branch,
      language: 'en',
      isActive: true,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    } as AppUser;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export function observeAuthState(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signOutCurrentUser() {
  if (!auth) return;
  if (__DEV__) {
    console.debug('[auth/service] Firebase signOut request');
  }
  await signOut(auth);
  if (__DEV__) {
    console.debug('[auth/service] Firebase signOut complete');
  }
}
