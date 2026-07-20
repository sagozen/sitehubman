import { useEffect, useState } from 'react';
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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { finalizeGuestAccountUpgrade } from '@/src/utils/guestAccountUpgrade';
import { isGuestUser } from '@/src/utils/authFlow';
import { HapticTap } from '@/src/utils/haptics';

export function RegisterScreen() {
  const { user, isLoading, signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insets = useSafeAreaInsets();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user && !isGuestUser(user)) {
      void getPostAuthDestination(user).then((dest) => router.replace(dest));
    }
  }, [isLoading, user]);

  const busy = isSubmitting || isLoading;

  async function handleRegister() {
    Keyboard.dismiss();
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!displayName.trim() || !normalizedEmail || password.length < 6) {
      Alert.alert('Missing details', 'Name, valid email, and 6+ character password are required.');
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
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
      Alert.alert('Sign up failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFillObject}>
        <Image
          source={require('@/assets/images/savee_background.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />
      </View>

      {/* Header bar/Back button */}
      <Pressable
        onPress={() => {
          HapticTap.light();
          router.replace('/(auth)/login');
        }}
        style={[styles.backBtn, { top: Math.max(insets.top, 20) }]}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainContent}>
            <View style={styles.formWrap}>
              <AppText style={styles.logoTitleForm} weight="extrabold">GENNFC</AppText>
              
              <AppText style={styles.subtitleText} weight="medium">
                Save your card, profile, orders, and customer moments to the cloud.
              </AppText>

              <View style={styles.benefitGrid}>
                {['Sync drafts', 'Track orders', 'Share profile'].map((label) => (
                  <View key={label} style={styles.benefitPill}>
                    <AppText style={styles.benefitPillText} weight="bold">{label}</AppText>
                  </View>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.underlineInput, { marginBottom: 20 }]}
                  placeholder="Display Name"
                  placeholderTextColor="#555555"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  editable={!busy}
                  textContentType="name"
                  autoComplete="name"
                />

                <TextInput
                  style={[styles.underlineInput, { marginBottom: 20 }]}
                  placeholder="Email"
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

                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={[styles.underlineInput, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor="#555555"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!busy}
                    textContentType="newPassword"
                    autoComplete="password-new"
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
                onPress={handleRegister}
                disabled={busy}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <AppText style={styles.pillBtnText} weight="bold">Create Account</AppText>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.subLinkBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  HapticTap.light();
                  router.replace('/(auth)/login');
                }}
                disabled={busy}
              >
                <AppText style={styles.subLinkText} weight="semibold">
                  Already have an account? Sign in
                </AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Styled Brand Footer "GENNFC curated by M GENNFC" */}
      <View style={[styles.brandFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.brandFooterLeft}>
          <View style={styles.logoSquare}>
            <AppText style={styles.logoSquareLetter}>G</AppText>
          </View>
          <AppText style={styles.brandFooterText} weight="bold">GENNFC</AppText>
        </View>
        
        <View style={styles.brandFooterRight}>
          <AppText style={styles.brandFooterSubText} weight="medium">curated by </AppText>
          <View style={[styles.logoSquare, { marginLeft: 4, marginRight: 6 }]}>
            <AppText style={styles.logoSquareLetter}>M</AppText>
          </View>
          <AppText style={styles.brandFooterBoldText} weight="extrabold">GENNFC</AppText>
        </View>
      </View>
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
  logoTitleForm: {
    fontSize: 54,
    lineHeight: 64,
    color: '#FFFFFF',
    letterSpacing: 0,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#8E8E93',
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
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitPillText: {
    color: '#FFFFFF',
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
  subLinkBtn: {
    paddingVertical: 8,
  },
  subLinkText: {
    color: '#8E8E93',
    fontSize: 14,
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
});
