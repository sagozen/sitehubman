import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import {
  AuthFooterLink,
  AuthFormGroup,
  AuthHeader,
  AuthPrimaryButton,
  AuthScreenShell,
  AuthTextField,
} from '@/src/features/auth/components/authUi';
import { SocialAuthSection } from '@/src/features/auth/SocialAuthSection';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { AppUser } from '@/src/types/models';
import { finalizeGuestAccountUpgrade } from '@/src/utils/guestAccountUpgrade';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { isGuestUser } from '@/src/utils/authFlow';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen() {
  const { user, isLoading, signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user && !isGuestUser(user)) {
      void getPostAuthDestination(user).then((dest) => router.replace(dest));
    }
  }, [isLoading, user]);

  async function handleSocialSuccess(signedInUser: AppUser) {
    await finalizeGuestAccountUpgrade(signedInUser);
    router.replace(await getPostAuthDestination(signedInUser));
  }

  async function handleRegister() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!displayName.trim() || !EMAIL_PATTERN.test(normalizedEmail) || password.length < 6) {
      Alert.alert('Missing details', 'Name, valid email, and 6+ character password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const registeredUser = await signUp({ displayName, email: normalizedEmail, password });
      await finalizeGuestAccountUpgrade(registeredUser);
      router.replace(await getPostAuthDestination(registeredUser));
    } catch (error) {
      Alert.alert('Sign up failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = isSubmitting || isLoading;

  return (
    <AuthScreenShell>
      <AuthHeader
        title="Create Account"
        subtitle="Create a customer account to manage your card profile."
      />

      <SocialAuthSection disabled={busy} onSuccess={handleSocialSuccess} />

      <AuthFormGroup>
        <AuthTextField
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          editable={!busy}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
        />
        <AuthTextField
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          textContentType="emailAddress"
          autoComplete="email"
        />
        <AuthTextField
          value={password}
          onChangeText={setPassword}
          placeholder="Password (6+ characters)"
          secureTextEntry
          editable={!busy}
          isLast
          textContentType="newPassword"
          autoComplete="password-new"
        />
      </AuthFormGroup>

      <AuthPrimaryButton
        label={isSubmitting ? 'Creating...' : 'Create Account'}
        onPress={handleRegister}
        loading={isSubmitting}
        disabled={busy}
      />

      <AuthFooterLink
        prompt="Already have an account?"
        action="Sign in"
        onPress={() => router.replace('/auth/login')}
        disabled={busy}
      />
    </AuthScreenShell>
  );
}
