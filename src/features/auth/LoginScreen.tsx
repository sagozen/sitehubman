import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

type AuthStep = 'LANDING' | 'EMAIL' | 'PASSWORD' | 'CHECK_EMAIL';

export function LoginScreen() {
  const { isLoading, signIn, signInAsGuest, signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [authStep, setAuthStep] = useState<AuthStep>('LANDING');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => setShowSplash(false));
    }, 900);

    return () => clearTimeout(splashTimer);
  }, [splashOpacity]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

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

  // Handle email/password sign-in or sign-up
  async function handleContinue() {
    if (busy) return;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Missing Email', 'Please enter your work or personal email.');
      return;
    }

    if (authStep === 'EMAIL') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(normalizedEmail)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
      HapticTap.light();
      setAuthStep('PASSWORD');
      return;
    }

    if (authStep === 'PASSWORD') {
      if (!password || password.length < 6) {
        Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
        return;
      }

      setIsSubmitting(true);
      HapticTap.medium();

      try {
        let signedInUser;
        if (isSignUp) {
          if (!displayName.trim()) {
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
        Alert.alert(isSignUp ? 'Sign up failed' : 'Sign in failed', getAuthErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Handle password reset
  async function handleSendMagicLink() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Missing Email', 'Please enter your email.');
      return;
    }

    setIsSubmitting(true);
    HapticTap.light();

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      Haptics.success();
      setAuthStep('CHECK_EMAIL');
    } catch (error) {
      Haptics.error();
      Alert.alert('Failed to send reset link', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Guest Preview
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
      Alert.alert('Guest sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsGuestLoading(false);
    }
  }

  // Handle Google Sign-In
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
      Alert.alert('Google Sign-In Failed', getAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  // Handle Apple Sign-In
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
        Alert.alert('Apple Sign-In Failed', getAuthErrorMessage(error));
      }
    } finally {
      setIsAppleLoading(false);
    }
  }

  function handleBack() {
    HapticTap.light();
    if (authStep === 'EMAIL') {
      setAuthStep('LANDING');
    } else if (authStep === 'PASSWORD') {
      setAuthStep('EMAIL');
    } else if (authStep === 'CHECK_EMAIL') {
      setAuthStep('PASSWORD');
    }
  }

  return (
    <View style={styles.container}>
      {/* Back button */}
      {authStep !== 'LANDING' && (
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { top: Math.max(insets.top, 16) }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 20, 40) }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainContent}>
            {authStep === 'LANDING' ? (
              <View style={styles.landingWrap}>
                {/* 4K Vector AVIO Brand Emblem */}
                <View style={styles.logoWrap}>
                  <AvioLogo size="md" theme="dark" showTagline />
                </View>

                <AppText style={styles.executiveSub}>
                  Next-generation contactless identity & NFC hardware for modern professionals.
                </AppText>

                {/* Primary Auth Actions */}
                <View style={styles.actionBlock}>
                  {/* Apple Sign-In */}
                  {Platform.OS === 'ios' && (
                    <Pressable
                      style={({ pressed }) => [styles.appleBtn, pressed && { opacity: 0.85 }]}
                      onPress={handleApplePress}
                      disabled={busy}
                    >
                      {isAppleLoading ? (
                        <ActivityIndicator color="#000000" size="small" />
                      ) : (
                        <>
                          <Ionicons name="logo-apple" size={20} color="#000000" />
                          <AppText style={styles.appleBtnText}>Continue with Apple</AppText>
                        </>
                      )}
                    </Pressable>
                  )}

                  {/* Google Sign-In */}
                  <Pressable
                    style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }]}
                    onPress={handleGooglePress}
                    disabled={busy}
                  >
                    {isGoogleLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                        <AppText style={styles.googleBtnText}>Continue with Google</AppText>
                      </>
                    )}
                  </Pressable>

                  {/* Email Sign-In */}
                  <Pressable
                    style={({ pressed }) => [styles.emailBtn, pressed && { opacity: 0.85 }]}
                    onPress={() => {
                      HapticTap.light();
                      setAuthStep('EMAIL');
                    }}
                    disabled={busy}
                  >
                    <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                    <AppText style={styles.emailBtnText}>Continue with Email</AppText>
                  </Pressable>

                  {/* Guest Explorer */}
                  <Pressable
                    style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.7 }]}
                    onPress={handleGuest}
                    disabled={busy}
                  >
                    {isGuestLoading ? (
                      <ActivityIndicator color="rgba(255,255,255,0.6)" size="small" />
                    ) : (
                      <AppText style={styles.guestBtnText}>Explore AVIO Studio as Guest →</AppText>
                    )}
                  </Pressable>
                </View>

                {/* Terms & Privacy */}
                <View style={styles.termsWrap}>
                  <AppText style={styles.termsText}>
                    By continuing, you agree to AVIO's{' '}
                    <AppText
                      style={styles.termsLink}
                      onPress={() => router.push('/terms-of-service' as any)}
                    >
                      Terms
                    </AppText>{' '}
                    and{' '}
                    <AppText
                      style={styles.termsLink}
                      onPress={() => router.push('/privacy-policy' as any)}
                    >
                      Privacy Policy
                    </AppText>.
                  </AppText>
                </View>
              </View>
            ) : authStep === 'EMAIL' ? (
              <View style={styles.formWrap}>
                <View style={styles.formLogoWrap}>
                  <AvioLogo size="sm" theme="dark" showTagline={false} />
                </View>

                <AppText style={styles.formTitle}>Enter your email</AppText>
                <AppText style={styles.formSub}>We'll check if you have an active AVIO account.</AppText>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Work or personal email"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.primaryPillBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleContinue}
                  disabled={busy}
                >
                  <AppText style={styles.primaryPillBtnText}>Continue</AppText>
                </Pressable>
              </View>
            ) : authStep === 'PASSWORD' ? (
              <View style={styles.formWrap}>
                <View style={styles.formLogoWrap}>
                  <AvioLogo size="sm" theme="dark" showTagline={false} />
                </View>

                <AppText style={styles.formTitle}>
                  {isSignUp ? 'Create your profile' : 'Enter your password'}
                </AppText>
                <AppText style={styles.formSub}>{email}</AppText>

                <View style={styles.inputStack}>
                  {isSignUp && (
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name (e.g. Johnathan Vance)"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      editable={!busy}
                    />
                  )}

                  <View style={styles.passwordInputWrap}>
                    <TextInput
                      style={[styles.input, { flex: 1, borderWidth: 0 }]}
                      placeholder="Password (min 6 characters)"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!busy}
                    />
                    <Pressable
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="rgba(255,255,255,0.5)"
                      />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.primaryPillBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleContinue}
                  disabled={busy}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <AppText style={styles.primaryPillBtnText}>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </AppText>
                  )}
                </Pressable>

                <View style={styles.switchAuthWrap}>
                  {!isSignUp && (
                    <Pressable onPress={handleSendMagicLink} disabled={busy}>
                      <AppText style={styles.switchAuthText}>Forgot password? Reset here</AppText>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => {
                      HapticTap.light();
                      setIsSignUp((v) => !v);
                    }}
                    disabled={busy}
                    style={{ marginTop: 12 }}
                  >
                    <AppText style={styles.switchAuthHighlight}>
                      {isSignUp
                        ? 'Already have an AVIO account? Sign In'
                        : "Don't have an account? Sign Up"}
                    </AppText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.formWrap}>
                <View style={styles.formLogoWrap}>
                  <AvioLogo size="sm" theme="dark" showTagline={false} />
                </View>

                <View style={styles.emailSentIcon}>
                  <Ionicons name="mail-unread-outline" size={48} color="#0066FF" />
                </View>

                <AppText style={styles.formTitle}>Check your inbox</AppText>
                <AppText style={styles.formSub}>
                  We sent password reset instructions to {email}.
                </AppText>

                <Pressable
                  style={({ pressed }) => [styles.primaryPillBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    HapticTap.light();
                    setAuthStep('EMAIL');
                  }}
                >
                  <AppText style={styles.primaryPillBtnText}>Back to Sign In</AppText>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Splash Transition Overlay */}
      {showSplash && (
        <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]} pointerEvents="none">
          <AvioLogo size="md" theme="dark" showTagline />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainContent: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  landingWrap: {
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: 16,
  },
  executiveSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 36,
  },
  actionBlock: {
    width: '100%',
    gap: 12,
  },
  appleBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  googleBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emailBtn: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emailBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  guestBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestBtnText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  termsWrap: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    color: 'rgba(255,255,255,0.8)',
    textDecorationLine: 'underline',
  },
  formWrap: {
    alignItems: 'center',
  },
  formLogoWrap: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  formSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputStack: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
  },
  passwordInputWrap: {
    width: '100%',
    height: 52,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  eyeBtn: {
    padding: 6,
  },
  primaryPillBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  switchAuthWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  switchAuthHighlight: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  emailSentIcon: {
    marginBottom: 16,
  },
});
