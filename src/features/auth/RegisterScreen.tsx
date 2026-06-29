import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View, Image } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import {
  AuthFooterLink,
  AuthFormGroup,
  AuthHeader,
  AuthLoginCard,
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
      <AuthLoginCard>
        <View style={styles.topIconWrap}>
          <Image source={require('@/assets/images/3d_create_card_v2.png')} style={styles.topIcon} resizeMode="contain" />
        </View>
        <AuthHeader
          title="Create your NFC identity"
          subtitle="A guided setup will help you build a card people can save in one tap."
        />

        <View style={styles.guide}>
          {['Create your profile', 'Choose your card style', 'Share by NFC or QR'].map((item, index) => (
            <View key={item} style={styles.guideRow}>
              <View style={styles.guideDot}>
                <AppText style={styles.guideDotText}>{index + 1}</AppText>
              </View>
              <AppText style={styles.guideText}>{item}</AppText>
            </View>
          ))}
        </View>

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
          label={isSubmitting ? 'Creating...' : 'Create account'}
          onPress={handleRegister}
          loading={isSubmitting}
          disabled={busy}
        />

        <AuthFooterLink
          prompt="Already have an account?"
          action="Sign in"
          onPress={() => router.replace('/(auth)/login')}
          disabled={busy}
        />
      </AuthLoginCard>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  topIconWrap: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 6,
  },
  topIcon: {
    width: 80,
    height: 80,
  },
  guide: {
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 4,
  },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  guideDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideDotText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF', fontFamily: 'Inter_900Black' },
  guideText: { fontSize: 13, fontWeight: '800', color: '#111827', fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },
});
