import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import {
  app as firebaseAppMaybe,
  auth as authMaybe,
  db as dbMaybe,
  firebaseInitError,
  storage as storageMaybe,
} from '@/src/services/firebase/firebase';

/** Typed exports for existing call sites; runtime no-ops fail when Firebase was not baked into the APK. */
export const firebaseApp = firebaseAppMaybe as FirebaseApp;
export const auth = authMaybe as Auth;
export const db = dbMaybe as Firestore;
export const storage = storageMaybe as FirebaseStorage;
export { firebaseInitError };
