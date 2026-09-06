import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { sendPasswordResetEmail } from 'firebase/auth';

import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/src/components/AppText';
import { AvioLogo } from '@/src/components/AvioLogo';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { finalizeGuestAccountUpgrade } from '@/src/utils/guestAccountUpgrade';
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn';
import { getGoogleOAuthSetupHint } from '@/src/utils/googleAuthConfig';
import {
  isAppleSignInAvailable,
  signInWithAppleTokens,
  signInWithGoogleIdToken,
} from '@/src/services/socialAuthService';
import { auth } from '@/src/services/firebaseClient';
import { Haptics, HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

export function LoginScreen() {
  const { isLoading, signIn, signInAsGuest, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const { isDark } = usePreferences();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const shakeOffset = useSharedValue(0);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const { isConfigured, isReady, promptAsync } = useGoogleSignIn();

  const busy =
    isLoading ||
    isSubmitting ||
    isGuestLoading ||
    isGoogleLoading ||
    isAppleLoading;

  const triggerErrorShake = useCallback(() => {
    shakeOffset.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeOffset]);

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  async function handleSubmit() {
    if (busy) return;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      triggerErrorShake();
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      triggerErrorShake();
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      triggerErrorShake();
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    HapticTap.medium();

    try {
      let signedInUser;
      if (isSignUp) {
        if (!displayName.trim()) {
          triggerErrorShake();
          Alert.alert('Missing Name', 'Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        signedInUser = await signUp({
          displayName: displayName.trim(),
          email: normalizedEmail,
          password,
        });
      } else {
        signedInUser = await signIn({ email: normalizedEmail, password });
      }

      await finalizeGuestAccountUpgrade(signedInUser);
      const destination = await getPostAuthDestination(signedInUser);
      Haptics.success();
      router.replace(destination);
    } catch (error) {
      Haptics.error();
      triggerErrorShake();
      Alert.alert(isSignUp ? 'Sign up failed' : 'Sign in failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendMagicLink() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      triggerErrorShake();
      Alert.alert('Missing Email', 'Please enter your email address first.');
      return;
    }

    setIsSubmitting(true);
    HapticTap.light();

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      Haptics.success();
      setForgotSent(true);
      Alert.alert('Reset Link Sent', `Password reset instructions have been sent to ${normalizedEmail}`);
    } catch (error) {
      Haptics.error();
      triggerErrorShake();
      Alert.alert('Reset Failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuest() {
    if (busy) return;
    setIsGuestLoading(true);
    HapticTap.light();
    try {
      await signInAsGuest();
      Haptics.success();
      router.replace('/');
    } catch (error) {
      Haptics.error();
      triggerErrorShake();
      Alert.alert('Guest sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsGuestLoading(false);
    }
  }

  async function handleGooglePress() {
    if (busy) return;
    if (!isConfigured) {
      Alert.alert('Google Sign-In', getGoogleOAuthSetupHint());
      return;
    }
    if (!isReady) {
      Alert.alert('Google Sign-In', 'Initializing, please try again.');
      return;
    }

    try {
      setIsGoogleLoading(true);
      HapticTap.medium();
      const response = await promptAsync();
      if (response?.type === 'success') {
        const idToken = response.params.id_token;
        if (idToken) {
          const signedInUser = await signInWithGoogleIdToken(idToken);
          await finalizeGuestAccountUpgrade(signedInUser);
          const destination = await getPostAuthDestination(signedInUser);
          Haptics.success();
          router.replace(destination);
        }
      }
    } catch (error) {
      Haptics.error();
      triggerErrorShake();
      Alert.alert('Google Sign-In Failed', getAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleApplePress() {
    if (busy) return;
    try {
      setIsAppleLoading(true);
      HapticTap.medium();

      const AppleAuth = await import('expo-apple-authentication');
      const rawNonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const appleResult = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (appleResult.identityToken) {
        const signedInUser = await signInWithAppleTokens(appleResult.identityToken, rawNonce);
        await finalizeGuestAccountUpgrade(signedInUser);
        const destination = await getPostAuthDestination(signedInUser);
        Haptics.success();
        router.replace(destination);
      }
    } catch (error: any) {
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        Haptics.error();
        triggerErrorShake();
        Alert.alert('Apple Sign-In Failed', getAuthErrorMessage(error));
      }
    } finally {
      setIsAppleLoading(false);
    }
  }

  const bgColors = isDark
    ? (['#000000', '#07090E', '#0D1017'] as const)
    : (['#F4F7FB', '#FAFCFF', '#FFFFFF'] as const);

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subTextColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      {/* Background glow orbs (strictly pointerEvents="none" on all platforms) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View
          style={[
            styles.glowOrb,
            {
              top: '15%',
              left: '10%',
              backgroundColor: isDark ? 'rgba(10, 132, 255, 0.12)' : 'rgba(10, 132, 255, 0.08)',
            },
          ]}
        />
        <View
          style={[
            styles.glowOrb,
            {
              bottom: '20%',
              right: '10%',
              backgroundColor: isDark ? 'rgba(88, 86, 214, 0.12)' : 'rgba(88, 86, 214, 0.08)',
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top + 24, 44), paddingBottom: Math.max(insets.bottom + 32, 48) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.mainContent, animatedShakeStyle]}>
            {/* Brand Logo & Header */}
            <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.logoWrap}>
              <AvioLogo size="md" theme={isDark ? 'dark' : 'light'} showTagline />
              <AppText style={[styles.executiveSub, { color: subTextColor }]}>
                Contactless smart identity & NFC hardware for modern creators and teams.
              </AppText>
            </Animated.View>

            {/* Mode Switcher Tabs (Sign In / Create Account) */}
            <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.tabSwitcher}>
              <Pressable
                style={[
                  styles.tabButton,
                  !isSignUp && [
                    styles.tabButtonActive,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#FFFFFF' },
                  ],
                ]}
                onPress={() => {
                  HapticTap.light();
                  setIsSignUp(false);
                }}
              >
                <AppText
                  style={[
                    styles.tabButtonText,
                    { color: !isSignUp ? textColor : subTextColor },
                  ]}
                  weight={!isSignUp ? 'bold' : 'medium'}
                >
                  Sign In
                </AppText>
              </Pressable>
              <Pressable
                style={[
                  styles.tabButton,
                  isSignUp && [
                    styles.tabButtonActive,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#FFFFFF' },
                  ],
                ]}
                onPress={() => {
                  HapticTap.light();
                  setIsSignUp(true);
                }}
              >
                <AppText
                  style={[
                    styles.tabButtonText,
                    { color: isSignUp ? textColor : subTextColor },
                  ]}
                  weight={isSignUp ? 'bold' : 'medium'}
                >
                  Create Account
                </AppText>
              </Pressable>
            </Animated.View>

            {/* Input Fields */}
            <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.formStack}>
              {isSignUp && (
                <View style={styles.inputGroup}>
                  <AppText style={[styles.inputLabel, { color: subTextColor }]}>Full Name</AppText>
                  <View
                    style={[
                      styles.inputBox,
                      { backgroundColor: inputBg, borderColor: inputBorder },
                    ]}
                  >
                    <Ionicons name="person-outline" size={18} color={subTextColor} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: textColor }]}
                      placeholder="e.g. Johnathan Vance"
                      placeholderTextColor={subTextColor}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      editable={!busy}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <AppText style={[styles.inputLabel, { color: subTextColor }]}>Email Address</AppText>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Ionicons name="mail-outline" size={18} color={subTextColor} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: textColor }]}
                    placeholder="name@company.com"
                    placeholderTextColor={subTextColor}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <AppText style={[styles.inputLabel, { color: subTextColor }]}>Password</AppText>
                  {!isSignUp && (
                    <Pressable onPress={handleSendMagicLink} disabled={busy} hitSlop={8}>
                      <AppText style={styles.forgotLink}>Forgot?</AppText>
                    </Pressable>
                  )}
                </View>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={18} color={subTextColor} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: textColor }]}
                    placeholder="Min 6 characters"
                    placeholderTextColor={subTextColor}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.eyeBtn}
                    hitSlop={10}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={subTextColor}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.primarySubmitBtn,
                  { backgroundColor: isDark ? '#FFFFFF' : '#000000' },
                  pressed && styles.btnPressed,
                  busy && { opacity: 0.6 },
                ]}
                onPress={handleSubmit}
                disabled={busy}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
                ) : (
                  <AppText
                    style={[styles.primarySubmitBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}
                    weight="bold"
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </AppText>
                )}
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: inputBorder }]} />
              <AppText style={[styles.dividerText, { color: subTextColor }]}>or continue with</AppText>
              <View style={[styles.dividerLine, { backgroundColor: inputBorder }]} />
            </View>

            {/* Social Auth & Guest Row */}
            <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.socialStack}>
              {Platform.OS === 'ios' && (
                <Pressable
                  style={({ pressed }) => [
                    styles.socialBtn,
                    { backgroundColor: inputBg, borderColor: inputBorder },
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleApplePress}
                  disabled={busy}
                >
                  {isAppleLoading ? (
                    <ActivityIndicator color={textColor} size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={18} color={textColor} />
                      <AppText style={[styles.socialBtnText, { color: textColor }]}>Apple</AppText>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  { backgroundColor: inputBg, borderColor: inputBorder },
                  pressed && styles.btnPressed,
                ]}
                onPress={handleGooglePress}
                disabled={busy}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color={textColor} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color={textColor} />
                    <AppText style={[styles.socialBtnText, { color: textColor }]}>Google</AppText>
                  </>
                )}
              </Pressable>

              {/* Guest One-Click Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  {
                    backgroundColor: isDark ? 'rgba(10, 132, 255, 0.12)' : 'rgba(0, 122, 255, 0.08)',
                    borderColor: isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.2)',
                  },
                  pressed && styles.btnPressed,
                ]}
                onPress={handleGuest}
                disabled={busy}
              >
                {isGuestLoading ? (
                  <ActivityIndicator color="#0A84FF" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#0A84FF" />
                    <AppText style={[styles.socialBtnText, { color: '#0A84FF', fontWeight: '700' }]}>
                      Guest Mode
                    </AppText>
                  </>
                )}
              </Pressable>
            </Animated.View>

            {/* Terms Footer */}
            <View style={styles.termsWrap}>
              <AppText style={[styles.termsText, { color: subTextColor }]}>
                By continuing, you agree to AVIO's{' '}
                <AppText
                  style={[styles.termsLink, { color: textColor }]}
                  onPress={() => router.push('/terms-of-service' as any)}
                >
                  Terms
                </AppText>{' '}
                and{' '}
                <AppText
                  style={[styles.termsLink, { color: textColor }]}
                  onPress={() => router.push('/privacy-policy' as any)}
                >
                  Privacy Policy
                </AppText>.
              </AppText>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mainContent: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  executiveSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    maxWidth: 320,
  },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
  },

  formStack: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginLeft: 2,
  },
  forgotLink: {
    fontSize: 12,
    color: '#0A84FF',
    fontWeight: '600',
  },
  inputBox: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  eyeBtn: {
    padding: 6,
  },

  primarySubmitBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  primarySubmitBtnText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },

  socialStack: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  termsWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});
