/**
 * HomeScreen — 06 Main Dashboard & Share Center (Apple Wallet × Stripe × Linear)
 *
 * Implements:
 * 06 — Main Dashboard (Hero visual NFC card + phone, "Good morning, Thean", [TAP TO SHARE], 326 taps / 1,284 views)
 * 07 — Share Center (Large visual buttons: NFC | QR | Link | Contact)
 * 08 — Activity (Timeline: Today 09:42 NFC tap, 09:18 Profile view, 08:51 QR scan)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Share,
  Clipboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  surfaceHighlight: '#222228',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#2596BE',
  accentDark: '#1a6f8e',
  accentGlow: 'rgba(37, 150, 190, 0.25)',
  cardDark: '#0D0D10',
  success: '#34C759',
} as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const { user } = useAuth();
  const userName = user?.displayName || 'Thean';
  const greeting = getGreeting();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animated shimmer and floating effect for hero card
  const floatAnim = useSharedValue(0);
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3200 }),
        withTiming(0, { duration: 3200 }),
      ),
      -1,
    );
    shimmerAnim.value = withRepeat(
      withTiming(1, { duration: 2500 }),
      -1,
    );
  }, [floatAnim, shimmerAnim]);

  const cardFloatStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(floatAnim.value, [0, 1], [0, -8], Extrapolation.CLAMP),
      },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerAnim.value, [0, 0.5, 1], [0, 0.45, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(shimmerAnim.value, [0, 1], [-SCREEN_WIDTH, SCREEN_WIDTH], Extrapolation.CLAMP),
      },
    ],
  }));

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  const handleTapToShare = useCallback(() => {
    HapticTap.confidentClick();
    router.push('/share-profile' as any);
  }, []);

  const handleNfcAction = useCallback(() => {
    HapticTap.medium();
    router.push('/nfc/connect' as any);
  }, []);

  const handleQrAction = useCallback(() => {
    HapticTap.light();
    router.push('/qr/customize' as any);
  }, []);

  const handleLinkAction = useCallback(() => {
    HapticTap.softConfirmation();
    const profileUrl = `https://nfcglobal.com/u/${userName.toLowerCase().replace(/\s+/g, '')}`;
    Clipboard.setString(profileUrl);
    showToast('Link copied to clipboard');
  }, [userName, showToast]);

  const handleContactAction = useCallback(() => {
    HapticTap.light();
    router.push('/contact-card' as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View>
            <AppText style={styles.brandTitle} weight="bold">
              SiteHub<AppText style={{ color: C.accent }}>.</AppText>
            </AppText>
            <AppText style={styles.brandSubtitle}>NFC CUSTOMER APP</AppText>
          </View>
          <Pressable
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/settings' as any)}
            hitSlop={8}
          >
            <View style={styles.avatarBadge}>
              <AppText style={styles.avatarText} weight="bold">
                {userName.charAt(0).toUpperCase()}
              </AppText>
            </View>
          </Pressable>
        </View>

        {/* Hero Visual Card: Physical NFC Card + Phone aesthetic */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.cardContainer, cardFloatStyle]}>
            <LinearGradient
              colors={['#1F2026', '#141418', '#0A0A0D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.physicalCard}
            >
              <Animated.View style={[StyleSheet.absoluteFill, styles.shimmerWrap, shimmerStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Card Chip & Brand */}
              <View style={styles.cardHeader}>
                <View style={styles.nfcWaveChip}>
                  <View style={styles.chipMetallic} />
                  <AppIcon name="wifi" size={16} color={C.accent} style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.activeDot} />
                  <AppText style={styles.statusPillText}>CONNECTED</AppText>
                </View>
              </View>

              {/* Card Holder Info */}
              <View style={styles.cardInfo}>
                <AppText style={styles.cardOwnerName} weight="bold">
                  {userName.toUpperCase()}
                </AppText>
                <AppText style={styles.cardOwnerTitle}>
                  Founder & Managing Director
                </AppText>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <AppText style={styles.cardSerial}>NFC • NTAG216 • READY</AppText>
                <View style={styles.logoMark}>
                  <View style={[styles.miniCircle, { backgroundColor: C.accent }]} />
                  <View style={[styles.miniCircle, { backgroundColor: '#FFFFFF', opacity: 0.8 }]} />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Greeting & Headline */}
        <View style={styles.greetingSection}>
          <AppText style={styles.greetingTitle} weight="bold">
            {greeting}, {userName}
          </AppText>
          <AppText style={styles.greetingSubtitle}>
            Your card is ready to share.
          </AppText>
        </View>

        {/* Primary Strong Action: [ TAP TO SHARE ] */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.tapToShareButton,
              pressed && styles.tapToSharePressed,
            ]}
            onPress={handleTapToShare}
          >
            <LinearGradient
              colors={[C.accent, C.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tapToShareGradient}
            >
              <AppIcon name="radio" size={20} color="#FFFFFF" />
              <AppText style={styles.tapToShareText} weight="bold">
                TAP TO SHARE
              </AppText>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Live Metrics Row (326 NFC taps | 1,284 profile views) */}
        <View style={styles.metricsContainer}>
          <Pressable
            style={styles.metricCard}
            onPress={() => router.push('/analytics/nfc' as any)}
          >
            <View style={styles.metricHeader}>
              <AppText style={styles.metricLabel}>NFC TAPS</AppText>
              <AppIcon name="zap" size={14} color={C.accent} />
            </View>
            <AppText style={styles.metricValue} weight="bold">
              326
            </AppText>
            <View style={styles.metricTrendRow}>
              <AppText style={styles.metricTrend}>↑ +14.2%</AppText>
              <AppText style={styles.metricSub}>this week</AppText>
            </View>
          </Pressable>

          <View style={styles.metricDivider} />

          <Pressable
            style={styles.metricCard}
            onPress={() => router.push('/analytics/overview' as any)}
          >
            <View style={styles.metricHeader}>
              <AppText style={styles.metricLabel}>PROFILE VIEWS</AppText>
              <AppIcon name="eye" size={14} color="#FFFFFF" />
            </View>
            <AppText style={styles.metricValue} weight="bold">
              1,284
            </AppText>
            <View style={styles.metricTrendRow}>
              <AppText style={styles.metricTrend}>↑ +18.4%</AppText>
              <AppText style={styles.metricSub}>this week</AppText>
            </View>
          </Pressable>
        </View>

        {/* 07 — Share Center (Large Visual Buttons: NFC | QR | Link | Contact) */}
        <View style={styles.sectionHeaderRow}>
          <AppText style={styles.sectionTitle} weight="bold">
            Share Center
          </AppText>
          <AppText style={styles.sectionNote}>ONE-TAP EXPORT</AppText>
        </View>

        <View style={styles.shareCenterGrid}>
          {/* NFC Button */}
          <Pressable
            style={({ pressed }) => [styles.shareTile, pressed && styles.shareTilePressed]}
            onPress={handleNfcAction}
          >
            <View style={[styles.shareIconWrap, { backgroundColor: 'rgba(37, 150, 190, 0.15)' }]}>
              <AppIcon name="wifi" size={24} color={C.accent} style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
            <AppText style={styles.shareTileTitle} weight="bold">
              NFC
            </AppText>
            <AppText style={styles.shareTileSubtitle}>
              Tap Device
            </AppText>
          </Pressable>

          {/* QR Button */}
          <Pressable
            style={({ pressed }) => [styles.shareTile, pressed && styles.shareTilePressed]}
            onPress={handleQrAction}
          >
            <View style={[styles.shareIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <AppIcon name="qr-code" size={24} color="#FFFFFF" />
            </View>
            <AppText style={styles.shareTileTitle} weight="bold">
              QR
            </AppText>
            <AppText style={styles.shareTileSubtitle}>
              Scan Code
            </AppText>
          </Pressable>

          {/* Link Button */}
          <Pressable
            style={({ pressed }) => [styles.shareTile, pressed && styles.shareTilePressed]}
            onPress={handleLinkAction}
          >
            <View style={[styles.shareIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <AppIcon name="copy" size={22} color="#FFFFFF" />
            </View>
            <AppText style={styles.shareTileTitle} weight="bold">
              Link
            </AppText>
            <AppText style={styles.shareTileSubtitle}>
              Copy URL
            </AppText>
          </Pressable>

          {/* Contact Button */}
          <Pressable
            style={({ pressed }) => [styles.shareTile, pressed && styles.shareTilePressed]}
            onPress={handleContactAction}
          >
            <View style={[styles.shareIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <AppIcon name="user" size={22} color="#FFFFFF" />
            </View>
            <AppText style={styles.shareTileTitle} weight="bold">
              Contact
            </AppText>
            <AppText style={styles.shareTileSubtitle}>
              vCard File
            </AppText>
          </Pressable>
        </View>

        {/* 08 — Activity Timeline */}
        <View style={styles.sectionHeaderRow}>
          <AppText style={styles.sectionTitle} weight="bold">
            Activity
          </AppText>
          <Pressable
            onPress={() => {
              HapticTap.light();
              router.push('/activity' as any);
            }}
            hitSlop={8}
          >
            <AppText style={styles.viewAllLink} weight="medium">
              View All →
            </AppText>
          </Pressable>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.timelineDayBadge}>
            <AppText style={styles.timelineDayText} weight="bold">
              TODAY
            </AppText>
          </View>

          {/* Event 1 */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineNode, { borderColor: C.accent }]}>
                <AppIcon name="wifi" size={12} color={C.accent} style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.timelineRowTop}>
                <AppText style={styles.timelineEventTitle} weight="bold">
                  NFC tap
                </AppText>
                <AppText style={styles.timelineTime}>09:42</AppText>
              </View>
              <AppText style={styles.timelineDetail}>
                Direct NFC exchange · Metal Matte Black Card
              </AppText>
            </View>
          </View>

          {/* Event 2 */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineNode, { borderColor: '#8E8E93' }]}>
                <AppIcon name="eye" size={12} color="#FFFFFF" />
              </View>
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.timelineRowTop}>
                <AppText style={styles.timelineEventTitle} weight="bold">
                  Profile view
                </AppText>
                <AppText style={styles.timelineTime}>09:18</AppText>
              </View>
              <AppText style={styles.timelineDetail}>
                Safari Mobile on iOS · Phnom Penh, KH
              </AppText>
            </View>
          </View>

          {/* Event 3 */}
          <View style={[styles.timelineItem, { paddingBottom: 4 }]}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineNode, { borderColor: '#8E8E93' }]}>
                <AppIcon name="qr-code" size={12} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.timelineRowTop}>
                <AppText style={styles.timelineEventTitle} weight="bold">
                  QR scan
                </AppText>
                <AppText style={styles.timelineTime}>08:51</AppText>
              </View>
              <AppText style={styles.timelineDetail}>
                Networking Event · Business Card Stand
              </AppText>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </IosScrollView>

      {/* Subtle Toast Feedback */}
      {toastMessage && (
        <View style={styles.toast}>
          <AppIcon name="check" size={16} color="#FFFFFF" />
          <AppText style={styles.toastText} weight="medium">
            {toastMessage}
          </AppText>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 20,
  },
  brandTitle: {
    fontSize: 22,
    letterSpacing: -0.5,
    color: C.text,
  },
  brandSubtitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  avatarButton: {
    borderRadius: 20,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1,
    borderColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: C.text,
    fontSize: 15,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 16,
  },
  physicalCard: {
    width: '100%',
    aspectRatio: 1.586, // ISO/IEC 7810 ID-1 standard ratio
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  shimmerWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nfcWaveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipMetallic: {
    width: 32,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#3A3A40',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.success,
  },
  statusPillText: {
    fontSize: 10,
    color: C.textSecondary,
    letterSpacing: 1,
    fontWeight: '700',
  },
  cardInfo: {
    marginVertical: 12,
  },
  cardOwnerName: {
    fontSize: 22,
    letterSpacing: 1.2,
    color: C.text,
  },
  cardOwnerTitle: {
    fontSize: 12,
    color: C.textSecondary,
    letterSpacing: 0.2,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSerial: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.textMuted,
    fontWeight: '600',
  },
  logoMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -6,
  },
  miniCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  greetingSection: {
    marginTop: 18,
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 28,
    letterSpacing: -0.6,
    color: C.text,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: C.textSecondary,
    marginTop: 4,
  },
  actionContainer: {
    marginBottom: 22,
  },
  tapToShareButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  tapToSharePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  tapToShareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  tapToShareText: {
    fontSize: 16,
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    marginBottom: 28,
  },
  metricCard: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 11,
    letterSpacing: 1,
    color: C.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 32,
    color: C.text,
    letterSpacing: -1,
    marginVertical: 4,
  },
  metricTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricTrend: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '600',
  },
  metricSub: {
    fontSize: 12,
    color: C.textMuted,
  },
  metricDivider: {
    width: 1,
    height: 50,
    backgroundColor: C.border,
    marginHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.4,
    color: C.text,
  },
  sectionNote: {
    fontSize: 10,
    letterSpacing: 1,
    color: C.textMuted,
    fontWeight: '700',
  },
  viewAllLink: {
    fontSize: 13,
    color: C.accent,
  },
  shareCenterGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  shareTile: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  shareTilePressed: {
    backgroundColor: C.surfaceRaised,
    transform: [{ scale: 0.96 }],
  },
  shareIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shareTileTitle: {
    fontSize: 14,
    color: C.text,
    letterSpacing: -0.2,
  },
  shareTileSubtitle: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  timelineDayBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: C.surfaceRaised,
    marginBottom: 16,
  },
  timelineDayText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.textSecondary,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 16,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: C.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineEventTitle: {
    fontSize: 14,
    color: C.text,
    letterSpacing: -0.2,
  },
  timelineTime: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
  timelineDetail: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 3,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
