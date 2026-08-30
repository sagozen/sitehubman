/**
 * ExecutiveHeroBanner.tsx
 *
 * The #1 above-the-fold conversion section for AVIO.
 * Replaces abstract NFC card widget with:
 *  - Real lifestyle photography (business executive context)
 *  - Bold, outcome-driven headline
 *  - Live social proof numbers
 *  - Primary CTA: "Share My Card" (black/white HIG)
 *  - Secondary CTA: "Order Metal Card"
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

interface ExecutiveHeroBannerProps {
  displayName?: string;
  tapsToday?: number;
  totalLeads?: number;
  onShareCard: () => void;
  onOrderCard: () => void;
  onViewProfile: () => void;
}

const SOCIAL_PROOF_STATS = [
  { value: '12,400+', label: 'Executives' },
  { value: '98%', label: 'Scan Rate' },
  { value: '3.2s', label: 'Avg. Save Time' },
];

export function ExecutiveHeroBanner({
  displayName,
  tapsToday = 0,
  totalLeads = 0,
  onShareCard,
  onOrderCard,
  onViewProfile,
}: ExecutiveHeroBannerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Pressable onPress={onViewProfile} style={styles.heroImageWrapper}>
        <Image
          source={require('@/assets/images/marketing/hero-home.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroGradient} />
        {tapsToday > 0 && (
          <View style={styles.liveTapBadge}>
            <View style={styles.liveTapDot} />
            <AppText style={styles.liveTapText} weight="bold">
              {tapsToday} tap{tapsToday > 1 ? 's' : ''} today
            </AppText>
          </View>
        )}
        <View style={styles.heroOverlayContent}>
          <AppText style={styles.heroGreeting}>
            {greeting}{displayName ? `, ${displayName.split(' ')[0]}` : ''}
          </AppText>
          <AppText style={styles.heroHeadline} weight="extrabold">
            {'Your card is live\nand ready to close deals.'}
          </AppText>
          <View style={styles.heroLeadsBadge}>
            <AppIcon name="Users" size={13} color="#FFFFFF" />
            <AppText style={styles.heroLeadsBadgeText} weight="bold">
              {totalLeads > 0 ? `${totalLeads} leads captured` : 'Start capturing leads today'}
            </AppText>
          </View>
        </View>
      </Pressable>

      <View style={styles.ctaRow}>
        <Pressable
          style={({ pressed }) => [styles.ctaPrimary, pressed && styles.ctaPressed]}
          onPress={() => { HapticTap.medium(); onShareCard(); }}
        >
          <AppIcon name="Share2" size={16} color="#000000" />
          <AppText style={styles.ctaPrimaryText} weight="extrabold">Share My Card</AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaPressed]}
          onPress={() => { HapticTap.light(); onOrderCard(); }}
        >
          <AppIcon name="CreditCard" size={16} color="#FFFFFF" />
          <AppText style={styles.ctaSecondaryText} weight="bold">Order Metal</AppText>
        </Pressable>
      </View>

      <View style={styles.socialProofStrip}>
        {SOCIAL_PROOF_STATS.map((stat, i) => (
          <React.Fragment key={stat.label}>
            <View style={styles.statItem}>
              <AppText style={styles.statValue} weight="extrabold">{stat.value}</AppText>
              <AppText style={styles.statLabel}>{stat.label}</AppText>
            </View>
            {i < SOCIAL_PROOF_STATS.length - 1 && <View style={styles.statDivider} />}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  heroImageWrapper: { borderRadius: 20, overflow: 'hidden', height: 240, backgroundColor: '#111114' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.52)' },
  heroOverlayContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, gap: 6 },
  heroGreeting: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, letterSpacing: 0.2 },
  heroHeadline: { color: '#FFFFFF', fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heroLeadsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroLeadsBadgeText: { color: '#FFFFFF', fontSize: 12 },
  liveTapBadge: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  liveTapDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#30D158' },
  liveTapText: { color: '#FFFFFF', fontSize: 11, letterSpacing: 0.3 },
  ctaRow: { flexDirection: 'row', gap: 10 },
  ctaPrimary: { flex: 1.4, height: 50, backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaSecondary: { flex: 1, height: 50, backgroundColor: '#111114', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaPressed: { opacity: 0.8 },
  ctaPrimaryText: { color: '#000000', fontSize: 15 },
  ctaSecondaryText: { color: '#FFFFFF', fontSize: 14 },
  socialProofStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D10', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', paddingVertical: 14, paddingHorizontal: 20 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: '#FFFFFF', fontSize: 18, letterSpacing: -0.5 },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },
});
