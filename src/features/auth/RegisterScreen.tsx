import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
import { isGuestUser } from '@/src/utils/authFlow';
import { HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

const SPRING_SNAPPY = { damping: 16, stiffness: 340, mass: 0.7 };

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
  isDark,
  textContentType,
  autoComplete
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
        textContentType={textContentType}
        autoComplete={autoComplete}
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

export function RegisterScreen() {
  const { user, isLoading, signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDark } = usePreferences();

  const insets = useSafeAreaInsets();
  const shakeOffset = useSharedValue(0);

  useEffect(() => {
    if (!isLoading && user && !isGuestUser(user)) {
      void getPostAuthDestination(user).then((dest) => router.replace(dest));
    }
  }, [isLoading, user]);

  useEffect(() => {
    void (async () => {
      try {
        const [name, mail] = await AsyncStorage.multiGet([
          '@avio_onboarding_name',
          '@avio_onboarding_email',
        ]);
        const nameVal = name[1]?.trim();
        const mailVal = mail[1]?.trim();
        if (nameVal) setDisplayName(nameVal);
        if (mailVal) setEmail(mailVal);
      } catch {
      }
    })();
  }, []);

  const busy = isSubmitting || isLoading;

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

  async function handleRegister() {
    Keyboard.dismiss();
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!displayName.trim() || !normalizedEmail || password.length < 6) {
      triggerErrorShake();
      Alert.alert('Missing details', 'Name, valid email, and 6+ character password are required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      triggerErrorShake();
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    HapticTap.medium();

    try {
      const registeredUser = await signUp({
        displayName: displayName.trim(),
        email: normalizedEmail,
        password,
      });
      await finalizeGuestAccountUpgrade(registeredUser);
      router.replace(await getPostAuthDestination(registeredUser));
    } catch (error) {
      triggerErrorShake();
      Alert.alert('Sign up failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
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

      <AnimatedPressable
        onPress={() => {
          HapticTap.light();
          router.replace('/(auth)/login');
        }}
        style={[styles.backBtn, { top: Math.max(insets.top, 20), backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
      >
        <Ionicons name="chevron-back" size={26} color={textColor} />
      </AnimatedPressable>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.mainContent, animatedShakeStyle]}>
            <View style={styles.formWrap}>
              <Animated.View entering={FadeInDown.delay(0).springify()} style={{ marginBottom: 16 }}>
                <AvioLogo size="md" theme={isDark ? "dark" : "light"} showTagline />
              </Animated.View>
              
              <Animated.View entering={FadeInDown.delay(60).springify()}>
                <AppText style={[styles.subtitleText, { color: subTextColor }]} weight="medium">
                  Save your card, profile, orders, and customer moments to the cloud.
                </AppText>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.benefitGrid}>
                {['Sync drafts', 'Track orders', 'Share profile'].map((label) => (
                  <View key={label} style={[styles.benefitPill, { borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                    <AppText style={[styles.benefitPillText, { color: textColor }]} weight="bold">{label}</AppText>
                  </View>
                ))}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.inputContainer}>
                <View style={{ marginBottom: 20 }}>
                  <GlassInput
                    placeholder="Display Name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                    editable={!busy}
                    textContentType="name"
                    autoComplete="name"
                    isDark={isDark}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <GlassInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                    textContentType="emailAddress"
                    autoComplete="email"
                    isDark={isDark}
                  />
                </View>

                <GlassInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!busy}
                  textContentType="newPassword"
                  autoComplete="password-new"
                  isDark={isDark}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(240).springify()} style={{ width: '100%' }}>
                <AnimatedPressable onPress={handleRegister} disabled={busy}>
                  <View style={[styles.pillBtn, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
                    {isSubmitting ? (
                      <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
                    ) : (
                      <AppText style={[styles.pillBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]} weight="bold">Create Account</AppText>
                    )}
                  </View>
                </AnimatedPressable>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <Pressable
                  style={({ pressed }) => [styles.subLinkBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => {
                    HapticTap.light();
                    router.replace('/(auth)/login');
                  }}
                  disabled={busy}
                >
                  <AppText style={[styles.subLinkText, { color: subTextColor }]} weight="semibold">
                    Already have an account? Sign in
                  </AppText>
                </Pressable>
              </Animated.View>
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
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
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
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 360,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  benefitPill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitPillText: {
    fontSize: 11,
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
  pillBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pillBtnText: {
    fontSize: 16,
  },
  subLinkBtn: {
    paddingVertical: 8,
  },
  subLinkText: {
    fontSize: 14,
  },
});
