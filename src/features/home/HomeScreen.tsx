/**
 * HomeScreen — 06 Main Dashboard & Share Center
 * Luxury Minimalist (Apple Wallet × Stripe × Linear)
 *
 * Design Guidelines:
 * - True Black (#000000) canvas
 * - No RGB / rainbow / multi-color noise — restrained Monochrome + selective #2596BE
 * - No heavy 1px borders everywhere — clean background tone shifts and hairlines
 * - No fake metallic chips, rotating icons, blinking dots, or AI template clutter
 * - High-conviction typography, generous whitespace, confident calm luxury
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  canvas: '#000000',
  surface: '#0E0E11',
  surfaceSoft: '#141418',
  hairline: 'rgba(255, 255, 255, 0.06)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  accent: '#2596BE',
  cardBg: '#0B0B0E',
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

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
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
    showToast('Profile link copied');
  }, [userName, showToast]);

  const handleContactAction = useCallback(() => {
    HapticTap.light();
    router.push('/contact-card' as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Top Minimalist Header */}
        <View style={styles.header}>
          <View>
            <AppText style={styles.greetingText}>
              {greeting}, {userName}
            </AppText>
            <AppText style={styles.subGreetingText}>
              Your card is ready to share.
            </AppText>
          </View>
          <Pressable
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/settings' as any)}
            hitSlop={12}
          >
            <View style={styles.avatarCircle}>
              <AppText style={styles.avatarInitial} weight="bold">
                {userName.charAt(0).toUpperCase()}
              </AppText>
            </View>
          </Pressable>
        </View>

        {/* Hero Physical NFC Card (Apple Wallet Luxury Aesthetic) */}
        <View style={styles.cardWrapper}>
          <Pressable
            style={styles.physicalCard}
            onPress={() => router.push('/(tabs)/share' as any)}
          >
            {/* Top Row: Contactless Wave Symbol + Brand mark */}
            <View style={styles.cardTopRow}>
              {/* Minimalist 4-arc Contactless Symbol */}
              <View style={styles.contactlessSymbol}>
                <View style={[styles.contactlessArc, styles.arc1]} />
                <View style={[styles.contactlessArc, styles.arc2]} />
                <View style={[styles.contactlessArc, styles.arc3]} />
                <View style={[styles.contactlessArc, styles.arc4]} />
              </View>
              <AppText style={styles.cardTypeLabel}>BLACK METAL</AppText>
            </View>

            {/* Card Identity */}
            <View style={styles.cardBody}>
              <AppText style={styles.cardOwnerName} weight="bold">
                {userName.toUpperCase()}
              </AppText>
              <AppText style={styles.cardOwnerTitle}>
                FOUNDER & DIRECTOR
              </AppText>
            </View>

            {/* Card Footer: Clean ID */}
            <View style={styles.cardBottomRow}>
              <AppText style={styles.cardSerial}>NFC • CONNECTED</AppText>
              <View style={styles.cardAccentPip} />
            </View>
          </Pressable>
        </View>

        {/* Primary Action Button — Apple Style Crisp & Solid */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleTapToShare}
          >
            <AppText style={styles.primaryButtonText} weight="bold">
              TAP TO SHARE
            </AppText>
          </Pressable>
        </View>

        {/* Minimalist Live Metrics (Apple Health / Stripe clean stats) */}
        <View style={styles.statsRow}>
          <Pressable
            style={styles.statItem}
            onPress={() => router.push('/analytics/nfc' as any)}
          >
            <AppText style={styles.statNumber} weight="bold">
              326
            </AppText>
            <AppText style={styles.statLabel}>NFC TAPS</AppText>
          </Pressable>

          <View style={styles.statDivider} />

          <Pressable
            style={styles.statItem}
            onPress={() => router.push('/analytics/overview' as any)}
          >
            <AppText style={styles.statNumber} weight="bold">
              1,284
            </AppText>
            <AppText style={styles.statLabel}>PROFILE VIEWS</AppText>
          </Pressable>
        </View>

        {/* 07 — Share Center (Sleek, Borderless Minimal Actions) */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle} weight="bold">
            Share
          </AppText>
        </View>

        <View style={styles.shareRow}>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            onPress={handleNfcAction}
          >
            <AppIcon name="wifi" size={20} color={C.text} style={{ transform: [{ rotate: '90deg' }] }} />
            <AppText style={styles.shareBtnLabel}>NFC</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            onPress={handleQrAction}
          >
            <AppIcon name="qr-code" size={20} color={C.text} />
            <AppText style={styles.shareBtnLabel}>QR Code</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            onPress={handleLinkAction}
          >
            <AppIcon name="copy" size={19} color={C.text} />
            <AppText style={styles.shareBtnLabel}>Copy Link</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            onPress={handleContactAction}
          >
            <AppIcon name="user" size={19} color={C.text} />
            <AppText style={styles.shareBtnLabel}>Save Contact</AppText>
          </Pressable>
        </View>

        {/* 08 — Activity (Apple Wallet Clean Transaction Style) */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle} weight="bold">
            Recent Activity
          </AppText>
          <Pressable
            onPress={() => {
              HapticTap.light();
              router.push('/activity' as any);
            }}
            hitSlop={8}
          >
            <AppText style={styles.viewAllText}>All</AppText>
          </Pressable>
        </View>

        <View style={styles.activityList}>
          {/* Row 1 */}
          <View style={styles.activityRow}>
            <View style={styles.activityInfo}>
              <AppText style={styles.activityTitle} weight="medium">
                NFC Tap
              </AppText>
              <AppText style={styles.activityMeta}>
                Direct exchange · Matte Black
              </AppText>
            </View>
            <AppText style={styles.activityTime}>09:42</AppText>
          </View>

          <View style={styles.activitySeparator} />

          {/* Row 2 */}
          <View style={styles.activityRow}>
            <View style={styles.activityInfo}>
              <AppText style={styles.activityTitle} weight="medium">
                Profile View
              </AppText>
              <AppText style={styles.activityMeta}>
                Safari on iOS
              </AppText>
            </View>
            <AppText style={styles.activityTime}>09:18</AppText>
          </View>

          <View style={styles.activitySeparator} />

          {/* Row 3 */}
          <View style={styles.activityRow}>
            <View style={styles.activityInfo}>
              <AppText style={styles.activityTitle} weight="medium">
                QR Scan
              </AppText>
              <AppText style={styles.activityMeta}>
                Business card stand
              </AppText>
            </View>
            <AppText style={styles.activityTime}>08:51</AppText>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </IosScrollView>

      {/* Understated Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 26,
    letterSpacing: -0.6,
    color: C.text,
  },
  subGreetingText: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 3,
  },
  avatarButton: {
    borderRadius: 20,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: C.text,
    fontSize: 14,
  },
  cardWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  physicalCard: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 20,
    backgroundColor: C.cardBg,
    padding: 24,
    justifyContent: 'space-between',
    // Ultra-faint perimeter hairline — no heavy visible border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactlessSymbol: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  contactlessArc: {
    position: 'absolute',
    borderRightWidth: 1.8,
    borderColor: '#FFFFFF',
    borderRadius: 20,
  },
  arc1: { width: 8, height: 8, left: 0 },
  arc2: { width: 14, height: 14, left: 0 },
  arc3: { width: 20, height: 20, left: 0 },
  arc4: { width: 26, height: 26, left: 0 },
  cardTypeLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: C.textMuted,
    fontWeight: '700',
  },
  cardBody: {
    marginVertical: 16,
  },
  cardOwnerName: {
    fontSize: 24,
    letterSpacing: 1.5,
    color: C.text,
  },
  cardOwnerTitle: {
    fontSize: 11,
    letterSpacing: 1.8,
    color: C.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSerial: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: C.textMuted,
    fontWeight: '600',
  },
  cardAccentPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },
  actionContainer: {
    marginTop: 14,
    marginBottom: 26,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    letterSpacing: 1.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    color: C.text,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: C.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: C.hairline,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    letterSpacing: -0.3,
    color: C.text,
  },
  viewAllText: {
    fontSize: 13,
    color: C.textSecondary,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareBtnPressed: {
    backgroundColor: C.surfaceSoft,
    transform: [{ scale: 0.98 }],
  },
  shareBtnLabel: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: '500',
  },
  activityList: {
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  activityInfo: {
    flex: 1,
    gap: 3,
  },
  activityTitle: {
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
  },
  activityMeta: {
    fontSize: 12,
    color: C.textMuted,
  },
  activityTime: {
    fontSize: 13,
    color: C.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  activitySeparator: {
    height: 1,
    backgroundColor: C.hairline,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
});
export default HomeScreen;
