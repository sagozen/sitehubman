import { useCallback, useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SocialAuthSection } from '@/src/features/auth/SocialAuthSection';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { loadGuestCloudCard } from '@/src/services/guestCardDraftService';
import type { AppUser } from '@/src/types/models';
import { finalizeGuestAccountUpgrade } from '@/src/utils/guestAccountUpgrade';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { isGuestUser } from '@/src/utils/authFlow';
import { HapticTap } from '@/src/utils/haptics';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMode = 'signup' | 'signin';

export type AuthSignupSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  cardId?: string;
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
    Keyboard.dismiss();

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
      <View style={viewStyles.root}>
        <View style={viewStyles.backdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={viewStyles.keyboard}
        >
          <View style={[viewStyles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              style={({ pressed }) => [viewStyles.closeBtn, pressed && viewStyles.closeBtnPressed]}
              disabled={busy}
            >
              <AppIcon name="X" size={22} color="#FFFFFF" />
            </Pressable>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={viewStyles.scrollContent}
            >
              <View style={viewStyles.hero}>
                <AppText style={textStyles.logoTitle} weight="extrabold">
                  GENNFC
                </AppText>
                <AppText style={textStyles.heroTitle} weight="bold">
                  {title}
                </AppText>
                <AppText style={textStyles.heroSub}>{subtitle}</AppText>
              </View>

              <View style={viewStyles.card}>
                <SocialAuthSection disabled={busy} onSuccess={handleSocialSuccess} variant="login" />

                {mode === 'signup' ? (
                  <Field
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

                <Field
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

                <Field
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
                        color="#8E8E93"
                      />
                    </Pressable>
                  }
                />

                {error ? <AppText style={textStyles.errorText}>{error}</AppText> : null}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (!busy) HapticTap.light();
                    void handleSubmit();
                  }}
                  disabled={busy}
                  style={({ pressed }) => [
                    viewStyles.primaryBtn,
                    pressed && !busy && viewStyles.primaryBtnPressed,
                    busy && viewStyles.primaryBtnDisabled,
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <AppText style={textStyles.primaryBtnText} weight="bold">
                      {primaryLabel}
                    </AppText>
                  )}
                </Pressable>

                <View style={viewStyles.footerRow}>
                  <AppText style={textStyles.footerPrompt}>
                    {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                  </AppText>
                  <Pressable
                    onPress={() => {
                      HapticTap.light();
                      setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
                      setError(null);
                    }}
                    disabled={busy}
                    hitSlop={8}
                  >
                    <AppText style={textStyles.footerAction} weight="bold">
                      {mode === 'signup' ? 'Sign in' : 'Create account'}
                    </AppText>
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleClose}
                  disabled={busy}
                  style={({ pressed }) => [viewStyles.secondaryBtn, pressed && !busy && viewStyles.secondaryBtnPressed]}
                >
                  <AppText style={textStyles.secondaryBtnText} weight="bold">
                    Continue exploring
                  </AppText>
                </Pressable>

                <View style={viewStyles.trust}>
                  <AppText style={textStyles.trustT}>Trusted by professionals worldwide</AppText>
                  <AppText style={textStyles.trustSub}>Secure end-to-end encryption - NFC + QR compatible</AppText>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  trailing,
  ...rest
}: ComponentProps<typeof TextInput> & { label: string; trailing?: ReactNode }) {
  return (
    <View style={viewStyles.field}>
      <AppText style={textStyles.fieldLabel}>{label}</AppText>
      <View style={viewStyles.fieldRow}>
        <TextInput style={textStyles.fieldInput} placeholderTextColor="#555555" {...rest} />
        {trailing ? <View style={viewStyles.fieldTrailing}>{trailing}</View> : null}
      </View>
    </View>
  );
}

const viewStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
  },
  keyboard: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 28,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  closeBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 44,
    paddingBottom: 16,
    gap: 22,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  card: {
    width: '100%',
    gap: 14,
  },
  field: {
    gap: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 15,
    minHeight: 56,
  },
  fieldTrailing: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  primaryBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  secondaryBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 8,
  },
  secondaryBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  trust: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
  },
});

const textStyles = StyleSheet.create({
  logoTitle: {
    fontSize: 58,
    lineHeight: 70,
    color: '#FFFFFF',
    letterSpacing: -2,
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 340,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0,
    marginLeft: 2,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    paddingVertical: Platform.OS === 'ios' ? 15 : 11,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
  },
  footerPrompt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  footerAction: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trustT: {
    fontSize: 12,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.3,
  },
  trustSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
  },
});
