import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import { isGoogleSignInConfigured } from '@/src/services/socialAuthService';
import {
  getGoogleAndroidClientId,
  getGoogleIosClientId,
  getGoogleOAuthRedirectUri,
  getGoogleWebClientId,
  isExpoGo,
} from '@/src/utils/googleAuthConfig';

WebBrowser.maybeCompleteAuthSession();

const DISABLED_GOOGLE_CLIENT_ID = 'google-sign-in-disabled.apps.googleusercontent.com';

export function useGoogleSignIn() {
  const webClientId = getGoogleWebClientId();
  const iosClientId = getGoogleIosClientId();
  const androidClientId = getGoogleAndroidClientId();
  const redirectUri = getGoogleOAuthRedirectUri();

  // Expo Go must use the Web OAuth client + auth.expo.io redirect (see googleAuthConfig).
  const effectiveWebClientId = webClientId || DISABLED_GOOGLE_CLIENT_ID;
  const effectiveIosClientId =
    (isExpoGo() ? webClientId : iosClientId || webClientId) || DISABLED_GOOGLE_CLIENT_ID;
  const effectiveAndroidClientId =
    (isExpoGo() ? webClientId : androidClientId || webClientId) || DISABLED_GOOGLE_CLIENT_ID;
  const platformClientId =
    Platform.OS === 'ios'
      ? effectiveIosClientId
      : Platform.OS === 'android'
        ? effectiveAndroidClientId
        : effectiveWebClientId;

  const [request, , promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: platformClientId,
      webClientId: effectiveWebClientId,
      iosClientId: effectiveIosClientId,
      androidClientId: effectiveAndroidClientId,
      redirectUri,
    },
    { scheme: 'biocloud', path: 'oauthredirect' }
  );

  return {
    promptAsync,
    isConfigured: isGoogleSignInConfigured(),
    isReady: Boolean(request && isGoogleSignInConfigured()),
    redirectUri,
  };
}
