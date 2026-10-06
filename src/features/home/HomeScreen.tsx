/**
 * HomeScreen — 06 Main Dashboard & Share Center
 * Luxury Minimalist (Apple Wallet × Stripe × Linear)
 *
 * Design Principles:
 * - True Black (#000000) canvas
 * - No RGB / rainbow clutter (no green status dots, no neon gradients)
 * - Restrained Monochrome with surgical #2596BE accent
 * - Seamless background tone transitions instead of heavy 1px borders
 * - High-conviction typography, generous whitespace, confident calm luxury
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#0E0E12',
  surfaceSoft: '#16161C',
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
  const userName = user?.displayName || 'Thean Coc';
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
    router.push('/(tabs)/share' as any);
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
    const profileUrl = `https://nfcglobal.com/u/theancoc`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(profileUrl).catch(() => null);
    } else if (Clipboard && Clipboard.setString) {
      Clipboard.setString(profileUrl);
    }
    showToast('Profile link copied');
  }, [showToast]);

  const handleContactAction = useCallback(() => {
    HapticTap.light();
    router.push('/contact-card' as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText style={styles.greetingText}>
              {greeting},
            </AppText>
            <AppText style={styles.nameText} weight="bold">
              {userName}
            </AppText>
            <AppText style={styles.roleText}>
              Founder & Director
            </AppText>
          </View>
          <Pressable
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/settings' as any)}
            hitSlop={12}
          >
            <Image
              source={require('@/assets/images/avatars/avatar_founder_man.jpg')}
              style={styles.avatarCircle}
            />
          </Pressable>
        </View>

        {/* Hero Physical NFC Card (Apple Wallet Aesthetic) */}
        <View style={styles.cardWrapper}>
          <Pressable
            style={styles.physicalCard}
            onPress={() => router.push('/(tabs)/share' as any)}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.contactlessSymbol}>
                <View style={[styles.contactlessArc, styles.arc1]} />
                <View style={[styles.contactlessArc, styles.arc2]} />
                <View style={[styles.contactlessArc, styles.arc3]} />
                <View style={[styles.contactlessArc, styles.arc4]} />
              </View>
              <AppText style={styles.cardTypeLabel}>BLACK METAL</AppText>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardOwnerCol}>
                <AppText style={styles.cardOwnerName} weight="bold">
                  {userName.toUpperCase()}
                </AppText>
                <AppText style={styles.cardOwnerTitle}>
                  FOUNDER & DIRECTOR
                </AppText>
              </View>
              <Image
                source={require('@/assets/images/avatars/avatar_founder_man.jpg')}
                style={styles.cardAvatarPhoto}
              />
            </View>

            <View style={styles.cardBottomRow}>
              <AppText style={styles.cardSerial}>NFC • CONNECTED</AppText>
              <View style={styles.cardAccentPip} />
            </View>
          </Pressable>
        </View>

        {/* Primary Action Button — Apple Style Solid White */}
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

        {/* Minimalist Metrics (Apple Health / Linear clean typography) */}
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
            onPress={() => router.push('/analytics' as any)}
          >
            <AppText style={styles.statNumber} weight="bold">
              1,284
            </AppText>
            <AppText style={styles.statLabel}>PROFILE VIEWS</AppText>
          </Pressable>
        </View>

        {/* Share Center — Clean Understated Row */}
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
            <AppIcon name="wifi" size={18} color={C.text} style={{ transform: [{ rotate: '90deg' }] }} />
            <AppText style={styles.shareBtnLabel}>NFC</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            onPress={handleQrAction}
          >
            <AppIcon name="qr-code" size={18} color={C.text} />
            <AppText style={styles.shareBtnLabel}>QR Code</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            onPress={handleLinkAction}
          >
            <AppIcon name="copy" size={18} color={C.text} />
            <AppText style={styles.shareBtnLabel}>Copy Link</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            onPress={handleContactAction}
          >
            <AppIcon name="user" size={18} color={C.text} />
            <AppText style={styles.shareBtnLabel}>Save Contact</AppText>
          </Pressable>
        </View>

        {/* Recent Activity (Apple Wallet Transaction List) */}
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
            <AppText style={styles.viewAllText}>View All</AppText>
          </Pressable>
        </View>

        <View style={styles.activityList}>
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

        <View style={{ height: 80 }} />
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 14,
    color: C.textSecondary,
  },
  nameText: {
    fontSize: 26,
    letterSpacing: -0.6,
    color: C.text,
    marginTop: 2,
  },
  roleText: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  avatarButton: {
    borderRadius: 22,
    marginTop: 4,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: '#000000',
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
    marginVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardOwnerCol: {
    flex: 1,
    paddingRight: 12,
  },
  cardAvatarPhoto: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#000000',
  },
  cardOwnerName: {
    fontSize: 22,
    letterSpacing: 1.2,
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
    marginBottom: 24,
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
    marginBottom: 28,
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
    marginBottom: 12,
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
    marginBottom: 28,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
