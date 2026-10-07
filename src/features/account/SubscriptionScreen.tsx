import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#2596BE',
} as const;

const FREE_FEATURES = ['1 NFC card', 'Basic profile page', 'QR code sharing', 'Basic analytics'];
const PRO_FEATURES = ['Unlimited cards', 'Advanced analytics', 'Custom branding', 'Priority support', 'Custom domain'];

export default function SubscriptionScreen() {
  const router = useRouter();

  const handleUpgrade = useCallback(() => {
    HapticTap.confidentClick();
    Alert.alert('Upgrade to Pro', 'Billing integration coming soon.');
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color={C.text} />
        </Pressable>
        <AppText variant="title3" style={styles.headerTitle}>Subscription</AppText>
        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.content}>
        {/* Free Plan */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <AppText style={styles.planName}>FREE</AppText>
            <View style={styles.activePill}>
              <AppText style={styles.activePillText}>Current Plan</AppText>
            </View>
          </View>
          <AppText variant="caption" muted style={styles.planPrice}>No charge</AppText>
          <View style={styles.featureList}>
            {FREE_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <AppIcon name="Check" size={15} color={C.muted} />
                <AppText variant="bodySmall" muted>{f}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* PRO Plan */}
        <View style={[styles.planCard, styles.proPlanCard]}>
          <View style={styles.planHeader}>
            <AppText style={[styles.planName, styles.proName]}>PRO</AppText>
            <View style={styles.saveBadge}>
              <AppText style={styles.saveBadgeText}>Save 30% yearly</AppText>
            </View>
          </View>
          <View style={styles.priceRow}>
            <AppText style={styles.proPrice}>$9</AppText>
            <AppText muted style={styles.priceUnit}>/month</AppText>
          </View>
          <View style={styles.featureList}>
            {PRO_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <AppIcon name="Check" size={15} color={C.accent} />
                <AppText variant="bodySmall" style={{ color: C.text }}>{f}</AppText>
              </View>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.88 }]}
            onPress={handleUpgrade}
            hitSlop={4}
          >
            <AppText style={styles.upgradeBtnText}>Upgrade to Pro</AppText>
          </Pressable>
        </View>

        <AppText variant="caption" muted style={styles.disclaimer}>
          Cancel anytime. No hidden fees. Billed monthly or annually.
        </AppText>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130, gap: 16 },
  planCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    gap: 14,
  },
  proPlanCard: {
    backgroundColor: '#161622',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.5,
  },
  proName: { color: '#FFFFFF' },
  activePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: { fontSize: 12, color: C.muted, fontWeight: '500' },
  saveBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  saveBadgeText: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },
  planPrice: { fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  proPrice: { fontSize: 36, fontWeight: '700', color: C.text, lineHeight: 40 },
  priceUnit: { fontSize: 16, paddingBottom: 4 },
  featureList: { gap: 10, marginTop: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  upgradeBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  upgradeBtnText: { color: '#000000', fontWeight: '700', fontSize: 15 },
  disclaimer: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
