import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights } from '@/src/services/customerInsightsService';
import { IosScrollView } from '@/src/components/IosScrollView';

const BRAND = '#2596BE';

export function GuestNfcDemoScreen() {
  const pulse = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [bioSlug, setBioSlug] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest || !user?.id) {
      setBioSlug(null);
      return;
    }
    void getCustomerInsights(user.id).then((i) => setBioSlug(i.bioSlug));
  }, [isGuest, user?.id]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ring1Scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const ring1Opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const ring2Scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const ring2Opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] });

  function simulateTap() {
    if (bioSlug) {
      router.push(`/public/${bioSlug}`);
      return;
    }
    requireAccount(undefined, {
      message: 'Sign in and publish an e-card to open your profile on tap.',
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={22} color="#1C1C1E" />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>NFC Preview</AppText>
            <AppText style={styles.subtitle}>Simulated tap experience</AppText>
          </View>
          <AppIcon name="Nfc" size={28} color={BRAND} />
        </View>

        {/* Card */}
        <View style={styles.cardWrap}>
          <NfcGlobalCardFace fullName={user?.displayName || undefined} />
        </View>

        {/* Tap zone */}
        <Pressable
          style={styles.tapZone}
          onPress={simulateTap}
          accessibilityRole="button"
          accessibilityLabel="Simulate NFC tap"
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.ring, { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] }]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.ring, styles.ring2, { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }]}
          />
          <View style={styles.orbWrap}>
            <AppIcon name="Nfc" size={44} color={BRAND} />
          </View>
          <AppText style={styles.tapLabel}>Tap to simulate</AppText>
          <AppText style={styles.tapSub}>Opens your NFC profile page</AppText>
        </Pressable>

        {/* How it works */}
        <View style={styles.stepsCard}>
          <AppText style={styles.stepsTitle}>How NFC tapping works</AppText>
          {(
            [
              { icon: 'CreditCard' as const, label: 'Your card stores a URL on the chip' },
              { icon: 'Nfc' as const, label: 'Any phone reads it with one tap — no app needed' },
              { icon: 'UserRound' as const, label: 'Your profile page opens instantly' },
            ] as const
          ).map((step, i) => (
            <View key={i} style={styles.step}>
              <AppIcon name={step.icon} size={24} color={BRAND} />
              <AppText style={styles.stepText}>{step.label}</AppText>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaCard}>
          <AppIcon name="ShieldCheck" size={28} color="#34C759" />
          <View style={styles.ctaCopy}>
            <AppText style={styles.ctaTitle}>Ready to go live?</AppText>
            <AppText style={styles.ctaSub}>Real chip writing unlocks after account setup.</AppText>
          </View>
        </View>

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 20, gap: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  cardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  tapZone: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: BRAND,
  },
  ring2: { width: 120, height: 120, borderRadius: 60 },
  orbWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF7FC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  tapLabel: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  tapSub: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  stepsTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2, marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#3C3C43', lineHeight: 20 },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaCopy: { flex: 1, gap: 3 },
  ctaTitle: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  ctaSub: { fontSize: 12, fontWeight: '500', color: '#8E8E93' },
});
