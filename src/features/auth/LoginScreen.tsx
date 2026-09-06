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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { sendPasswordResetEmail } from 'firebase/auth';

import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolateColor
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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

const SPRING_SNAPPY = { damping: 16, stiffness: 340, mass: 0.7 };

type AuthStep = 'LANDING' | 'EMAIL' | 'PASSWORD' | 'CHECK_EMAIL';

function AnimatedPressable({ onPress, children, style, disabled }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) {
          scale.value = withSpring(0.95, SPRING_SNAPPY);
          HapticTap.selection();
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_SNAPPY);
      }}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function GlassInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  editable,
  isDark
}: any) {
  const [isFocused, setIsFocused] = useState(false);
  const focusVal = useSharedValue(0);

  useEffect(() => {
    focusVal.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
  }, [isFocused]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusVal.value,
      [0, 1],
      [isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', '#0A84FF']
    );
    return { borderColor };
  });

  return (
    <Animated.View style={[styles.glassInputContainer, animatedBorderStyle]}>
      <BlurView
        intensity={isDark ? 20 : 40}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <TextInput
        style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </Animated.View>
  );
}

function OrbBackground({ isDark }: { isDark: boolean }) {
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);

  useEffect(() => {
    orb1X.value = withRepeat(withSequence(withTiming(100, { duration: 5000 }), withTiming(0, { duration: 5000 })), -1, true);
    orb1Y.value = withRepeat(withSequence(withTiming(50, { duration: 4000 }), withTiming(-50, { duration: 4000 })), -1, true);
    orb2X.value = withRepeat(withSequence(withTiming(-100, { duration: 6000 }), withTiming(0, { duration: 6000 })), -1, true);
    orb2Y.value = withRepeat(withSequence(withTiming(-50, { duration: 5500 }), withTiming(50, { duration: 5500 })), -1, true);
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));

  const orbColor = isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(10, 132, 255, 0.1)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.orb, { top: '20%', left: '10%', backgroundColor: orbColor }, orb1Style]} />
      <Animated.View style={[styles.orb, { bottom: '20%', right: '10%', backgroundColor: orbColor }, orb2Style]} />
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
    </View>
  );
}

export function LoginScreen() {
  const { isLoading, signIn, signInAsGuest, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const { isDark } = usePreferences();

  const [authStep, setAuthStep] = useState<AuthStep>('LANDING');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

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
  }, []);

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  async function handleContinue() {
    if (busy) return;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      triggerErrorShake();
      Alert.alert('Missing Email', 'Please enter your work or personal email.');
      return;
    }

    if (authStep === 'EMAIL') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(normalizedEmail)) {
        triggerErrorShake();
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
      HapticTap.light();
      setAuthStep('PASSWORD');
      return;
    }

    if (authStep === 'PASSWORD') {
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
  }

  async function handleSendMagicLink() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      triggerErrorShake();
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
      triggerErrorShake();
      Alert.alert('Failed to send reset link', getAuthErrorMessage(error));
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

  const bgColors = isDark
    ? ['#000000', '#07090E', '#111827'] as const
    : ['#F0F4FF', '#E8EFFE', '#FFFFFF'] as const;

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subTextColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <OrbBackground isDark={isDark} />

      {authStep !== 'LANDING' && (
        <AnimatedPressable
          onPress={handleBack}
          style={[styles.backBtn, { top: Math.max(insets.top, 16), backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </AnimatedPressable>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 20, 40) }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.mainContent, animatedShakeStyle]}>
            {authStep === 'LANDING' ? (
              <View style={styles.landingWrap}>
                <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.logoWrap}>
                  <AvioLogo size="md" theme={isDark ? "dark" : "light"} showTagline />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(60).springify()}>
                  <AppText style={[styles.executiveSub, { color: subTextColor }]}>
                    Next-generation contactless identity & NFC hardware for modern professionals.
                  </AppText>
                </Animated.View>

                <View style={styles.actionBlock}>
                  {Platform.OS === 'ios' && (
                    <Animated.View entering={FadeInDown.delay(120).springify()}>
                      <AnimatedPressable onPress={handleApplePress} disabled={busy}>
                        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.glassBtn}>
                          {isAppleLoading ? (
                            <ActivityIndicator color={textColor} size="small" />
                          ) : (
                            <>
                              <Ionicons name="logo-apple" size={20} color={textColor} />
                              <AppText style={[styles.glassBtnText, { color: textColor }]}>Continue with Apple</AppText>
                            </>
                          )}
                        </BlurView>
                      </AnimatedPressable>
                    </Animated.View>
                  )}

                  <Animated.View entering={FadeInDown.delay(180).springify()}>
                    <AnimatedPressable onPress={handleGooglePress} disabled={busy}>
                      <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.glassBtn}>
                        {isGoogleLoading ? (
                          <ActivityIndicator color={textColor} size="small" />
                        ) : (
                          <>
                            <Ionicons name="logo-google" size={18} color={textColor} />
                            <AppText style={[styles.glassBtnText, { color: textColor }]}>Continue with Google</AppText>
                          </>
                        )}
                      </BlurView>
                    </AnimatedPressable>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(240).springify()}>
                    <AnimatedPressable onPress={() => { HapticTap.light(); setAuthStep('EMAIL'); }} disabled={busy}>
                      <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.glassBtn}>
                        <Ionicons name="mail-outline" size={18} color={textColor} />
                        <AppText style={[styles.glassBtnText, { color: textColor }]}>Continue with Email</AppText>
                      </BlurView>
                    </AnimatedPressable>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Pressable
                      style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.7 }]}
                      onPress={handleGuest}
                      disabled={busy}
                    >
                      {isGuestLoading ? (
                        <ActivityIndicator color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"} size="small" />
                      ) : (
                        <AppText style={styles.guestBtnText}>Explore AVIO Studio as Guest →</AppText>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.termsWrap}>
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
                </Animated.View>
              </View>
            ) : authStep === 'EMAIL' ? (
              <View style={styles.formWrap}>
                <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.formLogoWrap}>
                  <AvioLogo size="sm" theme={isDark ? "dark" : "light"} showTagline={false} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(60).springify()}>
                  <AppText style={[styles.formTitle, { color: textColor }]}>Enter your email</AppText>
                  <AppText style={[styles.formSub, { color: subTextColor }]}>We'll check if you have an active AVIO account.</AppText>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.inputContainer}>
                  <GlassInput
                    placeholder="Work or personal email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                    isDark={isDark}
                  />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(180).springify()} style={{ width: '100%' }}>
                  <AnimatedPressable onPress={handleContinue} disabled={busy}>
                    <View style={[styles.primaryPillBtn, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
                      <AppText style={[styles.primaryPillBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Continue</AppText>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              </View>
            ) : authStep === 'PASSWORD' ? (
              <View style={styles.formWrap}>
                <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.formLogoWrap}>
                  <AvioLogo size="sm" theme={isDark ? "dark" : "light"} showTagline={false} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(60).springify()}>
                  <AppText style={[styles.formTitle, { color: textColor }]}>
                    {isSignUp ? 'Create your profile' : 'Enter your password'}
                  </AppText>
                  <AppText style={[styles.formSub, { color: subTextColor }]}>{email}</AppText>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.inputStack}>
                  {isSignUp && (
                    <GlassInput
                      placeholder="Full Name (e.g. Johnathan Vance)"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      editable={!busy}
                      isDark={isDark}
                    />
                  )}

                  <GlassInput
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!busy}
                    isDark={isDark}
                  />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(180).springify()} style={{ width: '100%' }}>
                  <AnimatedPressable onPress={handleContinue} disabled={busy}>
                    <View style={[styles.primaryPillBtn, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
                      {isSubmitting ? (
                        <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
                      ) : (
                        <AppText style={[styles.primaryPillBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                          {isSignUp ? 'Create Account' : 'Sign In'}
                        </AppText>
                      )}
                    </View>
                  </AnimatedPressable>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.switchAuthWrap}>
                  {!isSignUp && (
                    <Pressable onPress={handleSendMagicLink} disabled={busy}>
                      <AppText style={[styles.switchAuthText, { color: subTextColor }]}>Forgot password? Reset here</AppText>
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
                </Animated.View>
              </View>
            ) : (
              <View style={styles.formWrap}>
                <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.formLogoWrap}>
                  <AvioLogo size="sm" theme={isDark ? "dark" : "light"} showTagline={false} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.emailSentIcon}>
                  <Ionicons name="mail-unread-outline" size={48} color="#0A84FF" />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(120).springify()}>
                  <AppText style={[styles.formTitle, { color: textColor }]}>Check your inbox</AppText>
                  <AppText style={[styles.formSub, { color: subTextColor }]}>
                    We sent password reset instructions to {email}.
                  </AppText>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(180).springify()} style={{ width: '100%' }}>
                  <AnimatedPressable
                    onPress={() => {
                      HapticTap.light();
                      setAuthStep('EMAIL');
                    }}
                  >
                    <View style={[styles.primaryPillBtn, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
                      <AppText style={[styles.primaryPillBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Back to Sign In</AppText>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              </View>
            )}
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
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 36,
  },
  actionBlock: {
    width: '100%',
    gap: 12,
  },
  glassBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  guestBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestBtnText: {
    color: '#0A84FF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsWrap: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
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
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  formSub: {
    fontSize: 13,
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
  glassInputContainer: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  primaryPillBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  switchAuthWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 13,
  },
  switchAuthHighlight: {
    fontSize: 13,
    color: '#0A84FF',
    fontWeight: '600',
  },
  emailSentIcon: {
    marginBottom: 16,
  },
});
