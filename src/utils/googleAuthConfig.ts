import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function getGoogleWebClientId(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENTID)?.trim() ?? '';
}

export function getGoogleIosClientId(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENTID)?.trim() ?? '';
}

export function getGoogleAndroidClientId(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENTID)?.trim() ?? '';
}

function getWebRedirectUri(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:8081';
}

/** Redirect URI to whitelist for the OAuth client used on the current platform. */
export function getGoogleOAuthRedirectUri(): string {
  const owner = Constants.expoConfig?.owner ?? 'vct8888';
  const slug = Constants.expoConfig?.slug ?? 'bio-cloud-native';
  const scheme = Constants.expoConfig?.scheme ?? 'biocloud';

  if (Platform.OS === 'web') {
    return getWebRedirectUri();
  }

  if (isExpoGo()) {
    return `https://auth.expo.io/@${owner}/${slug}`;
  }

  return `${scheme}://oauthredirect`;
}

export function getGoogleOAuthSetupHint(): string {
  const redirect = getGoogleOAuthRedirectUri();
  const webClientId = getGoogleWebClientId();
  const owner = Constants.expoConfig?.owner ?? 'theanthean8888';
  const slug = Constants.expoConfig?.slug ?? 'bio-cloud-native';
  const redirects = [
    redirect,
    'http://localhost:8081',
    'https://sitehubman.vercel.app',
    `https://auth.expo.io/@${owner}/${slug}`,
  ].filter((uri, index, list) => list.indexOf(uri) === index);

  const platformNote =
    Platform.OS === 'web'
      ? '4. On web, redirect URI = your browser origin (e.g. http://localhost:8081).'
      : isExpoGo()
        ? '4. In Expo Go, use the Web client ID (not iOS/Android-only clients).'
        : '4. For dev/production builds, also set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / ANDROID.';

  return [
    '1. Firebase Console -> Authentication -> Sign-in method -> Enable Google.',
    '2. Copy that Web client ID into .env as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (must match the OAuth client you edit).',
    `3. Google Cloud -> Credentials -> open client ${webClientId || '(your Web client)'} -> Authorized redirect URIs -> add each:\n   ${redirects.join('\n   ')}`,
    platformNote,
    '5. redirect_uri_mismatch = URI missing on THAT client, or .env uses a different client ID than the one you edited.',
    '6. Restart Expo after editing .env: npx expo start -c',
  ].join('\n');
}
