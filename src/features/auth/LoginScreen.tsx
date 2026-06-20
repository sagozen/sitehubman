import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  AuthFooterLink,
  AuthIconTextField,
  AuthLoginCard,
  AuthLoginShell,
  AuthPrimaryButton,
  AuthTextButton,
  AuthTrustFooter,
  AuthWelcomeHeader,
} from '@/src/features/auth/components/authUi';
import { SocialAuthSection } from '@/src/features/auth/SocialAuthSection';
import { authLoginTheme } from '@/src/features/auth/constants/authTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { AppUser } from '@/src/types/models';
import { finalizeGuestAccountUpgrade } from '@/src/utils/guestAccountUpgrade';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { isGuestUser } from '@/src/utils/authFlow';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { user, isLoading, signIn, signInAsGuest } = useAuth();

  useEffect(() => {
    if (!isLoading && user && !isGuestUser(user)) {
      void getPostAuthDestination(user).then((dest) => router.replace(dest));
    }
  }, [isLoading, user]);

  const busy = isSubmitting || isGuestLoading || isLoading;

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const signedInUser = await signIn({ email: normalizedEmail, password });
      await finalizeGuestAccountUpgrade(signedInUser);
      router.replace(await getPostAuthDestination(signedInUser));
    } catch (error) {
      Alert.alert('Sign in failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuest() {
    setIsGuestLoading(true);
    try {
      await signInAsGuest();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Guest sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsGuestLoading(false);
    }
  }

  async function handleSocialSuccess(signedInUser: AppUser) {
    await finalizeGuestAccountUpgrade(signedInUser);
    router.replace(await getPostAuthDestination(signedInUser));
  }

  return (
    <AuthLoginShell>
      <AuthLoginCard>
        <AuthWelcomeHeader />

        <SocialAuthSection disabled={busy} onSuccess={handleSocialSuccess} variant="login" />

        <View style={styles.emailHead}>
          <AppText style={styles.emailTitle}>Or use email</AppText>
        </View>

        <View style={styles.fields}>
          <AuthIconTextField
            fieldIcon="email"
            label="Email"
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
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            editable={!busy}
            textContentType="password"
            autoComplete="password"
            trailing={
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                <AppIcon
                  name={showPassword ? 'EyeOff' : 'Eye'}
                  size={20}
                  color={authLoginTheme.subtitle}
                />
              </Pressable>
            }
          />
        </View>

        <AuthPrimaryButton
          label={isSubmitting ? 'Signing in...' : 'Sign in'}
          onPress={handleLogin}
          loading={isSubmitting}
          disabled={busy}
          variant="login"
        />

        <AuthTextButton
          label={isGuestLoading ? 'Loading...' : 'Preview as guest'}
          onPress={handleGuest}
          disabled={busy}
          loading={isGuestLoading}
          variant="login"
        />

        <AuthFooterLink
          prompt="Don't have an account?"
          action="Create account"
          onPress={() => router.push('/auth/register')}
          disabled={busy}
          variant="login"
        />

        <AuthTrustFooter />
      </AuthLoginCard>
    </AuthLoginShell>
  );
}

const styles = StyleSheet.create({
  emailHead: {
    marginTop: -2,
  },
  emailTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
  },
  fields: {
    gap: 12,
  },
  eyeBtn: {
    padding: 4,
  },
});
