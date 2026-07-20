import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';

let appCheckInstance: AppCheck | null = null;
let initAttempted = false;

function readPublicEnv(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;

  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  const fromExtra = extra?.[name]?.trim();
  return fromExtra || undefined;
}

export function isAppCheckEnforced(): boolean {
  return readPublicEnv('EXPO_PUBLIC_APP_CHECK_ENFORCED') === 'true';
}

/**
 * Firebase App Check (web today; native needs Play Integrity / DeviceCheck via a dev build).
 *
 * Web: EXPO_PUBLIC_RECAPTCHA_SITE_KEY
 * Debug: EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN (register token in Firebase console → App Check)
 * Functions: APP_CHECK_ENFORCED=true once clients send tokens
 */
export function initFirebaseAppCheck(app: FirebaseApp): AppCheck | null {
  if (initAttempted) return appCheckInstance;
  initAttempted = true;

  if (Platform.OS !== 'web') {
    if (__DEV__ && isAppCheckEnforced()) {
      console.warn(
        '[appCheck] Native App Check needs a dev/prod build with Play Integrity or DeviceCheck. ' +
          'Firestore rules still protect data; enable Functions enforcement after native attestation.'
      );
    }
    return null;
  }

  const recaptchaSiteKey = readPublicEnv('EXPO_PUBLIC_RECAPTCHA_SITE_KEY');
  const debugToken = readPublicEnv('EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN');

  if (!recaptchaSiteKey) {
    if (__DEV__ && isAppCheckEnforced()) {
      console.warn('[appCheck] Set EXPO_PUBLIC_RECAPTCHA_SITE_KEY for web App Check.');
    }
    return null;
  }

  try {
    if (debugToken) {
      (globalThis as typeof globalThis & {
        FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
      }).FIREBASE_APPCHECK_DEBUG_TOKEN =
        debugToken === 'true' ? true : debugToken;
    }

    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('[appCheck] init failed', error);
  }

  return appCheckInstance;
}

export function isFirebaseAppCheckActive(): boolean {
  return appCheckInstance !== null;
}
