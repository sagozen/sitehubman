import Constants from 'expo-constants';

interface FirebaseEnvValue {
  name: string;
  value: string | undefined;
}

const FIREBASE_PUBLIC_ENV: Record<string, string | undefined> = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function readPublicEnv(name: string): string | undefined {
  const fromProcess = FIREBASE_PUBLIC_ENV[name];
  if (hasValue(fromProcess)) return fromProcess!.trim();

  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  const fromExtra = extra?.[name];
  if (hasValue(fromExtra)) return fromExtra!.trim();

  return undefined;
}

export function getFirebaseConfig() {
  const env: Record<string, FirebaseEnvValue> = {
    apiKey: {
      name: 'EXPO_PUBLIC_FIREBASE_API_KEY',
      value: readPublicEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    },
    authDomain: {
      name: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      value: readPublicEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    },
    projectId: {
      name: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      value: readPublicEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    },
    storageBucket: {
      name: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      value: readPublicEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    },
    messagingSenderId: {
      name: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      value: readPublicEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    },
    appId: {
      name: 'EXPO_PUBLIC_FIREBASE_APP_ID',
      value: readPublicEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
    },
  };

  const config = {
    apiKey: env.apiKey.value!,
    authDomain: env.authDomain.value!,
    projectId: env.projectId.value!,
    storageBucket: env.storageBucket.value!,
    messagingSenderId: env.messagingSenderId.value!,
    appId: env.appId.value!,
  };

  const missing = Object.values(env)
    .filter(({ value }) => !hasValue(value))
    .map(({ name }) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env vars: ${missing.join(', ')}. Add them in Expo dashboard (preview) and rebuild the APK.`
    );
  }

  return config;
}

export function isFirebaseConfigured(): boolean {
  return [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ].every((name) => hasValue(readPublicEnv(name)));
}

export function getFirebaseConfigError(): string | null {
  if (isFirebaseConfigured()) return null;
  return 'Firebase is not configured in this APK. Ask admin to set EXPO_PUBLIC_* vars on Expo and rebuild.';
}
