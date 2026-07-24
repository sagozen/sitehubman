import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
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
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { finalizeGuestAccountUpgrade } from '@/src/utils/guestAccountUpgrade';
import { isGuestUser } from '@/src/utils/authFlow';
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn';
import { getGoogleOAuthSetupHint } from '@/src/utils/googleAuthConfig';
import {
  isAppleSignInAvailable,
  signInWithAppleTokens,
  signInWithGoogleIdToken,
} from '@/src/services/socialAuthService';
import { auth } from '@/src/services/firebaseClient';
import { HapticTap } from '@/src/utils/haptics';

type AuthStep = 'LANDING' | 'EMAIL' | 'PASSWORD' | 'CHECK_EMAIL';

export function LoginScreen() {
  const { user, isLoading, signIn, signInAsGuest, signUp } = useAuth();
  
  const [authStep, setAuthStep] = useState<AuthStep>('LANDING');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Custom Splash overlay state
  const [showSplash, setShowSplash] = useState(true);
  
  // Animation values for G, E, N, F, C characters
  const charAnims = useRef([
    new Animated.Value(0), // G
    new Animated.Value(0), // E
    new Animated.Value(0), // N
    new Animated.Value(0), // F
    new Animated.Value(0), // C
  ]).current;

  // Animation value for overlay fadeout
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const splashFallback = setTimeout(() => {
      setShowSplash(false);
    }, 1600);

    // Short brand beat only; the fallback above keeps first launch from feeling stuck.
    Animated.sequence([
      Animated.stagger(150, charAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        })
      )),
      Animated.delay(350),
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start(() => {
      clearTimeout(splashFallback);
      setShowSplash(false);
    });

    return () => clearTimeout(splashFallback);
  }, [charAnims, splashOpacity]);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const insets = useSafeAreaInsets();
  const { promptAsync, isConfigured, isReady } = useGoogleSignIn();

  // Redirect if already logged in and not a guest
  useEffect(() => {
    if (!isLoading && user && !isGuestUser(user)) {
      void getPostAuthDestination(user).then((dest) => router.replace(dest));
    }
  }, [isLoading, user]);

  // Check if Apple Sign-In is available
  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const busy = isSubmitting || isGuestLoading || isGoogleLoading || isAppleLoading || isLoading;

  // Handle standard email/password login or signup
  async function handleContinue() {
    Keyboard.dismiss();
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!normalizedEmail) {
      Alert.alert('Missing details', 'Please enter your email.');
      return;
    }

    if (authStep === 'EMAIL') {
      // Validate email format
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
            Alert.alert('Missing Name', 'Please enter your display name.');
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
        router.replace(destination);
      } catch (error) {
        Alert.alert(isSignUp ? 'Sign up failed' : 'Sign in failed', getAuthErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Handle passwordless request / password reset
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
      setAuthStep('CHECK_EMAIL');
    } catch (error) {
      Alert.alert('Failed to send link', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Guest Sign-In
  async function handleGuest() {
    if (busy) return;
    setIsGuestLoading(true);
    HapticTap.light();
    try {
      await signInAsGuest();
      router.replace('/');
    } catch (error) {
      Alert.alert('Guest sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsGuestLoading(false);
    }
  }

  // Handle Google Sign-In
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
    HapticTap.light();
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      if (result.type === 'error') {
        const msg = result.error?.message ?? 'Unable to open Google sign-in.';
        Alert.alert('Google sign-in failed', msg);
        return;
      }
      if (result.type !== 'success') {
        Alert.alert('Google sign-in failed', 'Sign-in did not complete. Try again.');
        return;
      }
      const idToken = result.params?.id_token;
      if (!idToken) {
        Alert.alert('Google sign-in failed', 'No ID token returned.');
        return;
      }
      const signedInUser = await signInWithGoogleIdToken(idToken);
      await finalizeGuestAccountUpgrade(signedInUser);
      router.replace(await getPostAuthDestination(signedInUser));
    } catch (error) {
      Alert.alert('Google sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  // Handle Apple Sign-In
  async function handleApplePress() {
    if (busy) return;

    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Apple Sign-In',
        'Apple Sign-In is only available on iOS devices.'
      );
      return;
    }

    if (!appleAvailable) {
      Alert.alert('Apple Sign-In unavailable', 'Sign in with Apple is not available on this device.');
      return;
    }

    setIsAppleLoading(true);
    HapticTap.light();
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

      const signedInUser = await signInWithAppleTokens(appleResult.identityToken, rawNonce);
      await finalizeGuestAccountUpgrade(signedInUser);
      router.replace(await getPostAuthDestination(signedInUser));
    } catch (error: unknown) {
      const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
      if (code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsAppleLoading(false);
    }
  }

  // Navigation back button
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
      {/* Background collage on landing page */}
      {authStep === 'LANDING' ? (
        <View style={StyleSheet.absoluteFillObject}>
          <Image
            source={require('@/assets/images/savee_background.png')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />
      )}

      {/* Header bar/Back button */}
      {authStep !== 'LANDING' && (
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { top: Math.max(insets.top, 20) }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainContent}>
            {authStep === 'LANDING' ? (
              <View style={styles.landingWrap}>
                {/* Cyberpunk Glitch Title GENFC */}
                <View style={styles.glitchLogoRow}>
                  <AppText style={styles.logoTitleText} weight="black">GE</AppText>
                  <View style={styles.glitchNWrap}>
                    <AppText style={[styles.logoTitleText, styles.glitchNCyan]} weight="black">N</AppText>
                    <AppText style={[styles.logoTitleText, styles.glitchNRed]} weight="black">N</AppText>
                    <AppText style={[styles.logoTitleText, styles.glitchNMain]} weight="black">N</AppText>
                  </View>
                  <AppText style={styles.logoTitleText} weight="black">FC</AppText>
                </View>

                {/* Clean guest link (no white box, no underline) */}
                <Pressable
                  style={({ pressed }) => [styles.guestTextLink, pressed && styles.btnPressed]}
                  onPress={handleGuest}
                  disabled={busy}
                >
                  {isGuestLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <AppText style={styles.guestTextLinkText} weight="semibold">
                      Preview as guest
                    </AppText>
                  )}
                </Pressable>
                
                {/* Social Login Icons Row */}
                <View style={styles.socialRow}>
                  {Platform.OS === 'ios' && (
                    <Pressable
                      style={({ pressed }) => [styles.circleBtn, pressed && styles.btnPressed]}
                      onPress={handleApplePress}
                      disabled={busy}
                    >
                      {isAppleLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                      )}
                    </Pressable>
                  )}

                  <Pressable
                    style={({ pressed }) => [styles.circleBtn, pressed && styles.btnPressed]}
                    onPress={handleGooglePress}
                    disabled={busy}
                  >
                    {isGoogleLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Ionicons name="logo-google" size={22} color="#FFFFFF" />
                    )}
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.circleBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      HapticTap.light();
                      setAuthStep('EMAIL');
                    }}
                    disabled={busy}
                  >
                    <Ionicons name="mail" size={22} color="#FFFFFF" />
                  </Pressable>
                </View>

                {/* Terms of Service & Privacy Policy */}
                <View style={styles.termsWrap}>
                  <AppText style={styles.termsText} tone="muted">
                    By continuing, you agree to our
                  </AppText>
                  <View style={styles.termsLinks}>
                    <Pressable onPress={() => router.push('/terms-of-service')}>
                      <AppText style={styles.linkText}>Terms of Service</AppText>
                    </Pressable>
                    <AppText style={styles.termsText} tone="muted"> and </AppText>
                    <Pressable onPress={() => router.push('/privacy-policy')}>
                      <AppText style={styles.linkText}>Privacy Policy</AppText>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : authStep === 'EMAIL' ? (
              <View style={styles.formWrap}>
                <AppText style={styles.logoTitleForm} weight="extrabold">GENFC</AppText>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.underlineInput}
                    placeholder="Email or Username"
                    placeholderTextColor="#555555"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                    textContentType="emailAddress"
                    autoComplete="email"
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.pillBtn, pressed && styles.btnPressed]}
                  onPress={handleContinue}
                  disabled={busy}
                >
                  <AppText style={styles.pillBtnText} weight="bold">Continue</AppText>
                </Pressable>

                {/* Guest access option */}
                <Pressable
                  style={({ pressed }) => [styles.guestLink, pressed && styles.btnPressed]}
                  onPress={handleGuest}
                  disabled={busy}
                >
                  <AppText style={styles.guestLinkText} weight="semibold">
                    {isGuestLoading ? 'Loading...' : 'Preview as guest'}
                  </AppText>
                </Pressable>
              </View>
            ) : authStep === 'PASSWORD' ? (
              <View style={styles.formWrap}>
                <AppText style={styles.logoTitleForm} weight="extrabold">GENFC</AppText>

                <View style={styles.inputContainer}>
                  {isSignUp && (
                    <TextInput
                      style={[styles.underlineInput, { marginBottom: 24 }]}
                      placeholder="Display Name"
                      placeholderTextColor="#555555"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      editable={!busy}
                      textContentType="name"
                      autoComplete="name"
                    />
                  )}
                  
                  <View style={styles.passwordInputWrap}>
                    <TextInput
                      style={[styles.underlineInput, { flex: 1 }]}
                      placeholder="Password"
                      placeholderTextColor="#555555"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!busy}
                      textContentType={isSignUp ? 'newPassword' : 'password'}
                      autoComplete={isSignUp ? 'password-new' : 'password'}
                    />
                    <Pressable
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#8E8E93"
                      />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.pillBtn, pressed && styles.btnPressed]}
                  onPress={handleContinue}
                  disabled={busy}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <AppText style={styles.pillBtnText} weight="bold">
                      {isSignUp ? 'Create Account' : 'Continue'}
                    </AppText>
                  )}
                </Pressable>

                {/* Support actions: Switch login/signup or send login reset link */}
                <View style={styles.authLinksWrap}>
                  {!isSignUp && (
                    <Pressable
                      style={styles.subLinkBtn}
                      onPress={handleSendMagicLink}
                      disabled={busy}
                    >
                      <AppText style={styles.subLinkText} weight="semibold">
                        Send login link to email
                      </AppText>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.subLinkBtn}
                    onPress={() => {
                      HapticTap.light();
                      setIsSignUp((v) => !v);
                    }}
                    disabled={busy}
                  >
                    <AppText style={styles.subLinkTextHighlight} weight="bold">
                      {isSignUp ? 'Already have an account? Sign in' : 'Create a new account instead'}
                    </AppText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.formWrap}>
                <AppText style={styles.logoTitleForm} weight="extrabold">GENFC</AppText>
                
                <View style={styles.checkEmailWrap}>
                  <AppText style={styles.checkEmailText} weight="medium">
                    Check your email for a login link.
                  </AppText>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.pillBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    HapticTap.light();
                    setAuthStep('EMAIL');
                  }}
                >
                  <AppText style={styles.pillBtnText} weight="bold">Back to Sign In</AppText>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Styled Brand Footer "GENFC curated by M GENFC" */}
      <View style={[styles.brandFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.brandFooterLeft}>
          <View style={styles.logoSquare}>
            <AppText style={styles.logoSquareLetter}>G</AppText>
          </View>
          <AppText style={styles.brandFooterText} weight="bold">GENFC</AppText>
        </View>
        
        <View style={styles.brandFooterRight}>
          <AppText style={styles.brandFooterSubText} weight="medium">curated by </AppText>
          <View style={[styles.logoSquare, { marginLeft: 4, marginRight: 6 }]}>
            <AppText style={styles.logoSquareLetter}>M</AppText>
          </View>
          <AppText style={styles.brandFooterBoldText} weight="extrabold">GENFC</AppText>
        </View>
      </View>

      {/* Cinematic Splash Overlay */}
      {showSplash && (
        <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]} pointerEvents="none">
          <View style={styles.splashTextContainer}>
            {['G', 'E', 'N', 'F', 'C'].map((char, index) => {
              const anim = charAnims[index];
              const scale = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.75, 1],
              });

              return (
                <Animated.View
                  key={index}
                  style={{
                    opacity: anim,
                    transform: [{ scale }],
                    marginHorizontal: 4,
                  }}
                >
                  <AppText style={styles.splashChar} weight="black">
                    {char}
                  </AppText>
                </Animated.View>
              );
            })}
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  landingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  glitchLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoTitleText: {
    fontSize: 52,
    lineHeight: 60,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  glitchNWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glitchNMain: {
    color: '#FFFFFF',
  },
  glitchNCyan: {
    position: 'absolute',
    left: -2,
    top: 1,
    color: '#00F0FF',
    opacity: 0.8,
  },
  glitchNRed: {
    position: 'absolute',
    left: 2,
    top: -1,
    color: '#FF0055',
    opacity: 0.8,
  },
  guestTextLink: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  guestTextLinkText: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  valuePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 26,
  },
  valuePill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePillText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  logoTitleForm: {
    fontSize: 54,
    lineHeight: 64,
    color: '#FFFFFF',
    letterSpacing: 0,
    marginBottom: 48,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
  },
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  termsWrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  termsLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  formWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 36,
  },
  underlineInput: {
    width: '100%',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 10,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  eyeBtn: {
    padding: 10,
  },
  pillBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pillBtnText: {
    color: '#000000',
    fontSize: 16,
  },
  guestLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  guestLinkText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  authLinksWrap: {
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    gap: 12,
  },
  subLinkBtn: {
    paddingVertical: 4,
  },
  subLinkText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  subLinkTextHighlight: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  checkEmailWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 44,
  },
  checkEmailText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  brandFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#222222',
  },
  brandFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquare: {
    width: 22,
    height: 22,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoSquareLetter: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  brandFooterText: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0,
  },
  brandFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  brandFooterSubText: {
    color: '#8E8E93',
    fontSize: 13,
  },
  brandFooterBoldText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  splashTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashChar: {
    fontSize: 48,
    lineHeight: 58,
    color: '#FFFFFF',
    letterSpacing: 0,
  },
});
