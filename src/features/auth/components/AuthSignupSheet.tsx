import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { BrandLogoCircle } from '@/src/components/BrandLogoCircle';
import { PhotoBanner } from '@/src/components/PhotoBanner';
import { productPhotoIds } from '@/src/constants/productPhotoCatalog';
import { SocialAuthSection } from '@/src/features/auth/SocialAuthSection';
import {
  AuthFooterLink,
  AuthIconTextField,
  AuthLoginCard,
  AuthPrimaryButton,
  AuthTextButton,
  AuthTrustFooter,
} from '@/src/features/auth/components/authUi';
import { authLoginTheme } from '@/src/features/auth/constants/authTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { loadGuestCloudCard } from '@/src/services/guestCardDraftService';
import type { AppUser } from '@/src/types/models';
import { finalizeGuestAccountUpgrade } from '@/src/utils/guestAccountUpgrade';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { isGuestUser } from '@/src/utils/authFlow';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMode = 'signup' | 'signin';

export type AuthSignupSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  cardId?: string;
  /** Runs after auth + guest attach. When omitted, navigates via getPostAuthDestination. */
  onSuccess?: (user: AppUser) => void | Promise<void>;
};

export function AuthSignupSheet({
  visible,
  onClose,
  title = 'Save your NFC identity',
  subtitle = 'Create a free account to edit, sync, and order cards - without leaving this screen.',
  cardId,
  onSuccess,
}: AuthSignupSheetProps) {
  const insets = useSafeAreaInsets();
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateEmail = useCallback(async () => {
    if (!visible || !cardId) return;
    const card = await loadGuestCloudCard(cardId);
    if (card?.profile.email?.trim() && !email) {
      setEmail(card.profile.email.trim().toLowerCase());
    }
    if (card?.profile.fullName?.trim() && !displayName) {
      setDisplayName(card.profile.fullName.trim());
    }
  }, [cardId, displayName, email, visible]);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    void hydrateEmail();
  }, [visible, hydrateEmail]);

  async function finishAuth(account: AppUser) {
    await finalizeGuestAccountUpgrade(account, cardId);
    onClose();
    if (onSuccess) {
      await onSuccess(account);
      return;
    }
    router.replace(await getPostAuthDestination(account));
  }

  async function handleSubmit() {
    if (busy) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail) || password.length < 6) {
      setError('Enter a valid email and password (6+ characters).');
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      setError('Enter your name.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (user && !isGuestUser(user)) {
        await finishAuth(user);
        return;
      }

      const account =
        mode === 'signin'
          ? await signIn({ email: normalizedEmail, password })
          : await signUp({
              displayName: displayName.trim() || normalizedEmail.split('@')[0] || 'Customer',
              email: normalizedEmail,
              password,
            });
      await finishAuth(account);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSocialSuccess(account: AppUser) {
    setBusy(true);
    setError(null);
    try {
      await finishAuth(account);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) return;
    onClose();
  }

  const primaryLabel =
    busy
      ? mode === 'signin'
        ? 'Signing in...'
        : 'Creating account...'
      : user && !isGuestUser(user)
        ? 'Continue'
        : mode === 'signin'
          ? 'Sign In'
          : 'Create Account';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <LinearGradient
              colors={authLoginTheme.gradient}
              locations={authLoginTheme.gradientLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheetGradient}
            />
            <View style={styles.handle} />
            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn} disabled={busy}>
              <AppIcon name="X" size={22} color={authLoginTheme.subtitle} />
            </Pressable>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <PhotoBanner
                productPhotoId={productPhotoIds.customerAccount}
                cacheKey="customer-signup-hero"
                variant="compact"
                style={styles.signupPhoto}
              >
                <AppText style={styles.signupPhotoTitle}>Keep your NFC cards & orders</AppText>
                <AppText style={styles.signupPhotoSub}>Sync drafts, production status, and live tap links across devices.</AppText>
              </PhotoBanner>

              <AuthLoginCard>
                <View style={styles.sheetHeader}>
                  <BrandLogoCircle size={64} shell />
                  <AppText style={styles.sheetTitle} weight="bold">
                    {title}
                  </AppText>
                  <AppText style={styles.sheetSubtitle}>{subtitle}</AppText>
                </View>

                <SocialAuthSection disabled={busy} onSuccess={handleSocialSuccess} variant="login" />

                {mode === 'signup' ? (
                  <AuthIconTextField
                    fieldIcon="user"
                    label="Display name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your name"
                    autoCapitalize="words"
                    editable={!busy}
                    textContentType="name"
                    autoComplete="name"
                  />
                ) : null}

                <View style={styles.fields}>
                  <AuthIconTextField
                    fieldIcon="email"
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                    textContentType="emailAddress"
                    autoComplete="email"
                  />
                  <AuthIconTextField
                    fieldIcon="password"
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder={mode === 'signup' ? '6+ characters' : 'Enter password'}
                    secureTextEntry={!showPassword}
                    editable={!busy}
                    textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                    autoComplete={mode === 'signup' ? 'password-new' : 'password'}
                    trailing={
                      <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                        <AppIcon
                          name={showPassword ? 'EyeOff' : 'Eye'}
                          size={20}
                          color={authLoginTheme.subtitle}
                        />
                      </Pressable>
                    }
                  />
                </View>

                {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

                <AuthPrimaryButton
                  label={primaryLabel}
                  onPress={() => void handleSubmit()}
                  loading={busy}
                  disabled={busy}
                  variant="login"
                />

                <AuthFooterLink
                  prompt={mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                  action={mode === 'signup' ? 'Sign in' : 'Create account'}
                  onPress={() => {
                    setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
                    setError(null);
                  }}
                  disabled={busy}
                  variant="login"
                />

                <AuthTextButton
                  label="Continue exploring"
                  onPress={handleClose}
                  disabled={busy}
                  variant="login"
                />

                <AuthTrustFooter />
              </AuthLoginCard>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  keyboard: {
    maxHeight: '92%',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  sheetGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    marginBottom: 4,
    zIndex: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: authLoginTheme.cardStroke,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  signupPhoto: { marginBottom: 12 },
  signupPhotoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  signupPhotoSub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
  },
  sheetHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 20,
    lineHeight: 26,
    color: authLoginTheme.titleNavy,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: authLoginTheme.subtitle,
    textAlign: 'center',
    maxWidth: 320,
  },
  fields: {
    gap: 0,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
  },
});
