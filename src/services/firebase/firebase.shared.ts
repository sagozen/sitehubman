import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { getFirebaseConfig, getFirebaseConfigError, isFirebaseConfigured } from '@/src/services/firebase/firebaseConfig';
import { initFirebaseAppCheck } from '@/src/services/firebase/firebase.appCheck';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export const firebaseInitError = (() => {
  if (!isFirebaseConfigured()) {
    return getFirebaseConfigError();
  }
  try {
    const firebaseConfig = getFirebaseConfig();
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    initFirebaseAppCheck(app);
    try {
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      db = getFirestore(app);
    }
    storage = getStorage(app);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Firebase failed to initialize.';
  }
})();

export { app, db, storage };
export default app;
