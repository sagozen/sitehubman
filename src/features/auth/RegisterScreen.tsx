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

import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/src/components/AppText';
import { AvioLogo } from '@/src/components/AvioLogo';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { finalizeGuestAccountUpgrade } from '@/src/utils/guestAccountUpgrade';
import { isGuestUser } from '@/src/utils/authFlow';
import { HapticTap, Haptics } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

export function RegisterScreen() {
  const { user, isLoading, signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insets = useSafeAreaInsets();
  const { isDark } = usePreferences();

  useEffect(() => {
    if (!isLoading && user && !isGuestUser(user)) {
      getPostAuthDestination(user).then((dest) => router.replace(dest));
    }
  }, [user, isLoading]);

  const handleRegister = useCallback(async () => {
    Keyboard.dismiss();
    const cleanName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    if (!cleanEmail) {
      Alert.alert('Missing Email', 'Please enter a valid email address.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    HapticTap.medium();

    try {
      const newUser = await signUp({
        displayName: cleanName,
        email: cleanEmail,
        password,
      });

      await finalizeGuestAccountUpgrade(newUser);
      const destination = await getPostAuthDestination(newUser);
      Haptics.success();
      router.replace(destination);
    } catch (err) {
      Haptics.error();
      Alert.alert('Registration Failed', getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [displayName, email, password, signUp]);

  const bgColors = isDark
    ? (['#000000', '#07090E', '#111827'] as const)
    : (['#F0F4FF', '#E8EFFE', '#FFFFFF'] as const);

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subTextColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top + 20, 40), paddingBottom: Math.max(insets.bottom + 32, 48) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
              <AvioLogo size="md" theme={isDark ? 'dark' : 'light'} showTagline />
              <AppText style={[styles.title, { color: textColor }]}>Create Your Account</AppText>
              <AppText style={[styles.subtitle, { color: subTextColor }]}>
                Set up your contactless NFC digital profile and join the future of networking.
              </AppText>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.form}>
              <View style={styles.inputGroup}>
                <AppText style={[styles.label, { color: subTextColor }]}>Full Name</AppText>
                <View style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <Ionicons name="person-outline" size={18} color={subTextColor} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: textColor }]}
                    placeholder="e.g. Johnathan Vance"
                    placeholderTextColor={subTextColor}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText style={[styles.label, { color: subTextColor }]}>Email Address</AppText>
                <View style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
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
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText style={[styles.label, { color: subTextColor }]}>Password</AppText>
                <View style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
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
                    editable={!isSubmitting}
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

              {/* Submit */}
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: isDark ? '#FFFFFF' : '#000000' },
                  pressed && styles.btnPressed,
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleRegister}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
                ) : (
                  <AppText
                    style={[styles.submitBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}
                    weight="bold"
                  >
                    Create Account
                  </AppText>
                )}
              </Pressable>
            </Animated.View>

            {/* Back to sign in */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.footer}>
              <Pressable
                onPress={() => {
                  HapticTap.light();
                  router.push('/(auth)/login');
                }}
                hitSlop={10}
              >
                <AppText style={[styles.footerText, { color: subTextColor }]}>
                  Already have an account?{' '}
                  <AppText style={styles.footerLink}>Sign In</AppText>
                </AppText>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 14,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 320,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
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
  submitBtn: {
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
  submitBtnText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    color: '#0A84FF',
    fontWeight: '600',
  },
});
