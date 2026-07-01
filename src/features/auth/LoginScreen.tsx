import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  AuthFooterLink,
  AuthFormGroup,
  AuthHeader,
  AuthLoginCard,
  AuthPrimaryButton,
  AuthScreenShell,
  AuthTextButton,
  AuthTextField,
  AuthTrustFooter,
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
  const { user, isLoading, signIn, signInAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

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
      router.replace('/');
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
    <AuthScreenShell>
      <AuthLoginCard>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <Image source={require('@/assets/images/3d_create_card_v2.png')} style={styles.illustration} resizeMode="contain" />
        </View>

        {/* Header */}
        <AuthHeader
          title="Welcome back"
          subtitle="Sign in to your account to continue"
        />

        {/* Social sign-in */}
        <SocialAuthSection disabled={busy} onSuccess={handleSocialSuccess} />

        {/* Or use email divider */}
        <View style={styles.emailHead}>
          <AppText style={styles.emailTitle}>Or use email</AppText>
        </View>

        {/* Email and password fields */}
        <AuthFormGroup>
          <AuthTextField
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
          <AuthTextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            editable={!busy}
            textContentType="password"
            autoComplete="password"
            isLast
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
        </AuthFormGroup>

        {/* Sign in button */}
        <AuthPrimaryButton
          label={isSubmitting ? 'Signing in...' : 'Sign in'}
          onPress={handleLogin}
          loading={isSubmitting}
          disabled={busy}
          variant="login"
        />

        {/* Guest button */}
        <AuthTextButton
          label={isGuestLoading ? 'Loading...' : 'Preview as guest'}
          onPress={handleGuest}
          disabled={busy}
          loading={isGuestLoading}
          variant="login"
        />

        {/* Footer link to register */}
        <AuthFooterLink
          prompt="Don't have an account?"
          action="Create account"
          onPress={() => router.push('/(auth)/register')}
          disabled={busy}
          variant="login"
        />

        {/* Trust footer */}
        <AuthTrustFooter />
      </AuthLoginCard>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  illustrationWrap: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  illustration: {
    width: 100,
    height: 100,
  },
  emailHead: {
    marginTop: -2,
  },
  emailTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
  },
  eyeBtn: {
    padding: 4,
  },
});