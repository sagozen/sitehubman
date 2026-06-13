import { useEffect, useState, useCallback, type ComponentType } from 'react';
import { BrandImage } from '@/src/components/BrandImage';
import {
  Alert,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { AppleAuthenticationButtonProps } from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { authBrandAssets, SOCIAL_ICON_SIZE } from '@/src/constants/brandAssets';
import { AuthOrDivider } from '@/src/features/auth/components/authUi';
import { authLoginTheme } from '@/src/features/auth/constants/authTheme';
import { iosDesign, iosPalette } from '@/src/design-system/ios';
import { theme } from '@/src/constants/theme';
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn';
import { getAuthErrorMessage } from '@/src/services/authService';
import {
  isAppleSignInAvailable,
  signInWithAppleTokens,
  signInWithGoogleIdToken,
} from '@/src/services/socialAuthService';
import { signInWithTelegram } from '@/src/services/telegramAuthService';
import { getTelegramDomainMismatchHint, isTelegramLoginConfigured } from '@/src/utils/telegramAuthConfig';
import { getGoogleOAuthSetupHint } from '@/src/utils/googleAuthConfig';
import { AppUser } from '@/src/types/models';

interface SocialAuthSectionProps {
  disabled?: boolean;
  onSuccess: (user: AppUser) => void;
  variant?: 'default' | 'login';
}

const SOCIAL_BTN_HEIGHT = iosDesign.controlHeight.primary;

function SocialBrandIcon({ source, size = SOCIAL_ICON_SIZE }: { source: ImageSourcePropType; size?: number }) {
  return (
    <BrandImage
      source={source}
      style={{ width: size, height: size }}
      contentFit="contain"
      recyclingKey={typeof source === 'number' ? `brand-${source}` : 'brand-social'}
    />
  );
}

export function SocialAuthSection({
  disabled = false,
  onSuccess,
  variant = 'default',
}: SocialAuthSectionProps) {
  const isLogin = variant === 'login';
  const { promptAsync, isConfigured, isReady, redirectUri } = useGoogleSignIn();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const busy = disabled || isGoogleLoading || isTelegramLoading || isAppleLoading;

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const completeGoogleSignIn = useCallback(
    async (idToken: string) => {
      const user = await signInWithGoogleIdToken(idToken);
      onSuccess(user);
    },
    [onSuccess]
  );

  async function handleGooglePress() {
    if (busy) return;
    if (!isConfigured) {
      Alert.alert('Google sign-in not configured', getGoogleOAuthSetupHint());
      return;
    }
    if (!isReady) {
      Alert.alert('Google sign-in', 'Still initializing. Try again in a moment.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      if (result.type === 'error') {
        const msg = result.error?.message ?? 'Unable to open Google sign-in.';
        Alert.alert(
          'Google sign-in failed',
          `${msg}\n\nIf you see redirect_uri_mismatch, add this redirect URI to your Web OAuth client:\n${redirectUri}`
        );
        return;
      }
      if (result.type !== 'success') {
        Alert.alert('Google sign-in failed', 'Sign-in did not complete. Try again.');
        return;
      }
      const idToken = result.params?.id_token;
      if (!idToken) {
        Alert.alert(
          'Google sign-in failed',
          `No ID token returned. Use the Firebase Web client ID in .env and add redirect URI:\n${redirectUri}`
        );
        return;
      }
      await completeGoogleSignIn(idToken);
    } catch (error) {
      Alert.alert('Google sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleApplePress() {
    if (busy) return;

    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Apple Sign-In',
        'Apple Sign-In is only available on iOS devices. Use email/password or Google on this platform.'
      );
      return;
    }

    if (!appleAvailable) {
      Alert.alert('Apple Sign-In unavailable', 'Sign in with Apple is not available on this device.');
      return;
    }

    setIsAppleLoading(true);
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const appleResult = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleResult.identityToken) {
        throw new Error('Apple sign-in did not return an identity token.');
      }

      const user = await signInWithAppleTokens(appleResult.identityToken, rawNonce);
      onSuccess(user);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsAppleLoading(false);
    }
  }

  async function handleTelegramPress() {
    if (busy) return;

    const domainHint = getTelegramDomainMismatchHint();
    if (domainHint) {
      Alert.alert('Use production site for Telegram', domainHint);
      return;
    }

    setIsTelegramLoading(true);
    try {
      const user = await signInWithTelegram();
      onSuccess(user);
    } catch (error) {
      Alert.alert('Telegram sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsTelegramLoading(false);
    }
  }

  const showApple = Platform.OS === 'ios' && appleAvailable;

  return (
    <View style={styles.wrap}>
      {showApple ? (
        <AppleSignInButton onPress={handleApplePress} disabled={busy && !isAppleLoading} loading={isAppleLoading} />
      ) : null}

      {isTelegramLoginConfigured() ? (
        <Pressable
          accessibilityRole="button"
          onPress={handleTelegramPress}
          disabled={busy && !isTelegramLoading}
          style={({ pressed }) => [
            styles.telegramBtn,
            isLogin && styles.telegramBtnLogin,
            (busy && !isTelegramLoading) && styles.disabled,
            pressed && !(busy && !isTelegramLoading) && styles.pressed,
          ]}
        >
          <SocialBrandIcon source={authBrandAssets.telegram} />
          <AppText
            style={[styles.telegramLabel, isLogin && styles.telegramLabelLogin]}
            weight="semibold"
          >
            {isTelegramLoading ? 'Connecting...' : 'Continue with Telegram'}
          </AppText>
        </Pressable>
      ) : null}

      {isConfigured ? (
      <Pressable
        accessibilityRole="button"
        onPress={handleGooglePress}
        disabled={busy && !isGoogleLoading}
        style={({ pressed }) => [
          styles.googleBtn,
          isLogin && styles.googleBtnLogin,
          (busy && !isGoogleLoading) && styles.disabled,
          pressed && !(busy && !isGoogleLoading) && styles.pressed,
        ]}
      >
        <SocialBrandIcon source={authBrandAssets.google} />
        <AppText
          style={[styles.googleLabel, isLogin && styles.googleLabelLogin]}
          weight="semibold"
        >
          {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
        </AppText>
      </Pressable>
      ) : null}

      <AuthOrDivider />
    </View>
  );
}

interface AppleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function AppleSignInButton({ onPress, disabled, loading }: AppleSignInButtonProps) {
  const [AppleButton, setAppleButton] = useState<ComponentType<AppleAuthenticationButtonProps> | null>(null);
  const [appleEnums, setAppleEnums] = useState<{
    buttonStyle: AppleAuthenticationButtonProps['buttonStyle'];
    buttonType: AppleAuthenticationButtonProps['buttonType'];
  } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void import('expo-apple-authentication').then((mod) => {
      setAppleButton(() => mod.AppleAuthenticationButton);
      setAppleEnums({
        buttonStyle: mod.AppleAuthenticationButtonStyle.BLACK,
        buttonType: mod.AppleAuthenticationButtonType.SIGN_IN,
      });
    });
  }, []);

  if (AppleButton && appleEnums && !loading && !disabled) {
    return (
      <AppleButton
        onPress={onPress}
        buttonStyle={appleEnums.buttonStyle}
        buttonType={appleEnums.buttonType}
        cornerRadius={iosDesign.radius.lg}
        style={styles.appleNative}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.appleFallback, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <AppIcon name="ShieldCheck" size={theme.iconSize.sm} color="#FFFFFF" />
      <AppText style={styles.appleFallbackText} weight="semibold">
        {loading ? 'Connecting...' : 'Continue with Apple'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: iosDesign.spacing.sm,
  },
  appleNative: {
    width: '100%',
    height: SOCIAL_BTN_HEIGHT,
  },
  appleFallback: {
    minHeight: SOCIAL_BTN_HEIGHT,
    borderRadius: iosDesign.radius.lg,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: iosDesign.spacing.md,
  },
  appleFallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  googleBtn: {
    minHeight: SOCIAL_BTN_HEIGHT,
    borderRadius: iosDesign.radius.lg,
    backgroundColor: iosPalette.light.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: iosDesign.spacing.md,
    ...theme.shadows.control,
    shadowOpacity: 0.04,
  },
  googleBtnLogin: {
    minHeight: SOCIAL_BTN_HEIGHT,
    borderRadius: iosDesign.radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authLoginTheme.googleBorder,
    shadowOpacity: 0.03,
  },
  googleLabelLogin: {
    color: authLoginTheme.titleNavy,
  },
  telegramBtn: {
    minHeight: SOCIAL_BTN_HEIGHT,
    borderRadius: iosDesign.radius.lg,
    backgroundColor: '#229ED9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: iosDesign.spacing.md,
    ...theme.shadows.control,
    shadowOpacity: 0.08,
  },
  telegramBtnLogin: {
    minHeight: SOCIAL_BTN_HEIGHT,
    borderRadius: iosDesign.radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authLoginTheme.googleBorder,
    shadowOpacity: 0.03,
  },
  telegramLabelLogin: {
    color: authLoginTheme.titleNavy,
  },
  telegramLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  googleLabel: {
    fontSize: 16,
    color: iosPalette.light.textPrimary,
  },
  hint: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: iosDesign.animation.softPressScale }],
  },
  disabled: {
    opacity: 0.5,
  },
});
