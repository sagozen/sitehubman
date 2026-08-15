import { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AvioLogo } from '@/src/components/AvioLogo';
import { HapticTap, HapticPattern } from '@/src/utils/haptics';
import { ensureCardIdentity } from '@/src/services/firestoreService';
import { useAuth } from '@/src/hooks/useAuth';

export default function InstantCardActivationRoute() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { user } = useAuth();

  const cardId = code ? String(code).toUpperCase() : `AVIO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleActivate = async () => {
    if (!fullName.trim()) {
      HapticPattern.warning();
      return;
    }

    try {
      setLoading(true);
      HapticTap.medium();

      const slug = fullName.trim().toLowerCase().replace(/\s+/g, '-');
      const uid = user?.id || `anon_${Date.now()}`;

      await ensureCardIdentity({
        cardId,
        ownerId: uid,
        ownerType: 'customer',
        userId: uid,
        publicSlug: slug,
        status: 'active',
        profile: {
          fullName: fullName.trim(),
          role: jobTitle.trim(),
          company: company.trim(),
          phone: phone.trim(),
          email: email.trim(),
        },
        design: {
          cardDesign: 'matte_black',
          product: 'card',
          cardChoice: 'physical',
        },
      });

      HapticPattern.success();
      setActivated(true);
    } catch {
      HapticPattern.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.logoWrap}>
            <AvioLogo size="sm" showTagline={false} />
          </View>

          {activated ? (
            <View style={styles.cardBox}>
              <View style={styles.badgeSuccess}>
                <AppIcon name="CheckCircle" size={48} color="#0066FF" />
              </View>
              <AppText style={styles.title}>Card Activated!</AppText>
              <AppText style={styles.sub}>
                Your physical AVIO NFC card is now live and linked to your digital identity.
              </AppText>

              <View style={styles.cardSummary}>
                <AppText style={styles.summaryLabel}>Card ID</AppText>
                <AppText style={styles.summaryValue}>{cardId}</AppText>
                <AppText style={styles.summaryLabel}>Cardholder</AppText>
                <AppText style={styles.summaryValue}>{fullName}</AppText>
              </View>

              <Pressable
                style={styles.primaryBtn}
                onPress={() => router.replace('/(tabs)/' as any)}
              >
                <AppText style={styles.primaryBtnText}>Go to Dashboard</AppText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cardBox}>
              <View style={styles.nfcIconHeader}>
                <AppIcon name="Radio" size={32} color="#0066FF" />
              </View>

              <AppText style={styles.title}>Claim Your AVIO Card</AppText>
              <AppText style={styles.sub}>
                Enter your professional details to link this hardware card ({cardId}) to your profile.
              </AppText>

              <View style={styles.inputs}>
                <TextInput
                  placeholder="Full Name *"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                />

                <TextInput
                  placeholder="Job Title (e.g. Founder, Architect)"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  style={styles.input}
                />

                <TextInput
                  placeholder="Company / Organization"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={company}
                  onChangeText={setCompany}
                  style={styles.input}
                />

                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                />

                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <Pressable
                onPress={handleActivate}
                disabled={loading || !fullName.trim()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.8 },
                  (!fullName.trim() || loading) && { opacity: 0.5 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <AppText style={styles.primaryBtnText}>Activate Card (5s)</AppText>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoWrap: {
    marginBottom: 20,
  },
  cardBox: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  nfcIconHeader: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputs: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  badgeSuccess: {
    marginBottom: 16,
  },
  cardSummary: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
});
