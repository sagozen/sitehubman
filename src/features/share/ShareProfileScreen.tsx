/**
 * ShareProfileScreen — Screen 2: Share / Your Digital Card ("Quick share. Maximum impact.")
 * Luxury Minimalist (Apple Wallet × Stripe × Linear · Black Granite UI)
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Clipboard,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';
import { NfcBeamModal } from '@/src/components/NfcBeamModal';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  border: 'transparent',
  borderLight: 'transparent',
  text: '#FFFFFF',
  textSecondary: '#E4E4E7',
  textMuted: '#8E8E93',
  accent: '#2596BE',
  emerald: '#799A85',
} as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export default function ShareProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');

  const userName = bioPage?.displayName || user?.displayName || 'Thean Coc';
  const userTitle = bioPage?.tagline || bioPage?.headline || 'Founder & Director';
  const greeting = getGreeting();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBeamModal, setShowBeamModal] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  const profileUrl = useMemo(() => {
    if (bioPage?.slug) return `https://nfcglobal.com/u/${bioPage.slug}`;
    const slug = userName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://nfcglobal.com/u/${slug || 'thean'}`;
  }, [bioPage?.slug, userName]);

  const handleTapToShare = useCallback(() => {
    HapticTap.confidentClick();
    setShowBeamModal(true);
  }, []);

  const handleNfcAction = useCallback(() => {
    HapticTap.medium();
    setShowBeamModal(true);
  }, []);

  const handleQrAction = useCallback(() => {
    HapticTap.light();
    router.push('/qr-generator' as any);
  }, [router]);

  const handleCopyLink = useCallback(() => {
    HapticTap.softConfirmation();
    Clipboard.setString(profileUrl);
    showToast('Profile URL copied to clipboard');
  }, [profileUrl, showToast]);

  const handleContactAction = useCallback(() => {
    HapticTap.light();
    router.push('/contact-card' as any);
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar with back navigation */}
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <AppIcon name="chevron-left" size={20} color={C.text} />
        </Pressable>
        <AppText style={styles.navTitle} weight="bold">
          Digital Card
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <AppText style={styles.greetingText}>{greeting}</AppText>
              <AppText style={styles.nameText} weight="bold">
                {userName}
              </AppText>
              <AppText style={styles.readyText}>
                Your card is ready to share.
              </AppText>
            </View>
            <Image
              source={require('@/assets/images/avatars/avatar_founder_man.jpg')}
              style={styles.avatarButton}
            />
          </View>

          {/* Hero Black Metal Card */}
          <View style={styles.cardWrapper}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardBrandRow}>
                <AppIcon name="wifi" size={16} color="rgba(255,255,255,0.7)" style={{ transform: [{ rotate: '90deg' }] }} />
                <AppText style={styles.cardBrandText} weight="bold">
                  NFC GLOBAL
                </AppText>
              </View>
              <View style={styles.contactlessSymbol}>
                <View style={[styles.contactlessArc, styles.arc1]} />
                <View style={[styles.contactlessArc, styles.arc2]} />
                <View style={[styles.contactlessArc, styles.arc3]} />
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardOwnerCol}>
                <AppText style={styles.cardOwnerName} weight="bold">
                  {userName.toUpperCase()}
                </AppText>
                <AppText style={styles.cardOwnerTitle}>
                  {userTitle}
                </AppText>
              </View>
              <Image
                source={require('@/assets/images/avatars/avatar_founder_man.jpg')}
                style={styles.cardAvatarPhoto}
              />
            </View>

            <View style={styles.cardFooterRow}>
              <View style={styles.cardStatusPill}>
                <AppText style={styles.statusPillText}>READY TO TAP</AppText>
              </View>
              <AppText style={styles.cardMaterialText}>BLACK METAL</AppText>
            </View>
          </View>

          {/* Tap to Share CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.tapToShareBtn,
              pressed && styles.tapToShareBtnPressed,
            ]}
            onPress={handleTapToShare}
          >
            <View style={styles.tapToShareInner}>
              <AppIcon name="wifi" size={18} color="#000000" style={{ transform: [{ rotate: '90deg' }] }} />
              <AppText style={styles.tapToShareText} weight="bold">
                TAP TO SHARE
              </AppText>
            </View>
            <AppIcon name="chevron-right" size={16} color="#000000" />
          </Pressable>

          {/* Section: SHARE YOUR CARD */}
          <View style={styles.sectionTitleRow}>
            <AppText style={styles.sectionHeaderTitle} weight="bold">
              SHARE YOUR CARD
            </AppText>
          </View>

          <View style={styles.shareGrid}>
            {/* Hero NFC Light Pill */}
            <Pressable
              style={({ pressed }) => [styles.sharePillPrimary, pressed && styles.sharePillPrimaryPressed]}
              onPress={handleNfcAction}
            >
              <AppIcon name="wifi" size={18} color="#000000" style={{ transform: [{ rotate: '90deg' }] }} />
              <View>
                <AppText style={styles.sharePillTitle} weight="bold">NFC Beam</AppText>
                <AppText style={styles.sharePillSub}>Device tap</AppText>
              </View>
            </Pressable>

            {/* Hero QR Light Pill */}
            <Pressable
              style={({ pressed }) => [styles.sharePillSecondary, pressed && styles.sharePillSecondaryPressed]}
              onPress={handleQrAction}
            >
              <AppIcon name="qr-code" size={18} color="#000000" />
              <View>
                <AppText style={styles.sharePillTitle} weight="bold">QR Pass</AppText>
                <AppText style={styles.sharePillSub}>Show QR</AppText>
              </View>
            </Pressable>
          </View>

          {/* Secondary Action Row */}
          <View style={styles.secondaryActionsRow}>
            {/* Copy Link */}
            <Pressable
              style={({ pressed }) => [styles.shareTileDark, pressed && styles.shareTileDarkPressed]}
              onPress={handleCopyLink}
            >
              <AppIcon name="copy" size={16} color="rgba(255,255,255,0.75)" />
              <AppText style={styles.shareTileText} weight="medium">Copy Link</AppText>
            </Pressable>

            {/* Save Contact */}
            <Pressable
              style={({ pressed }) => [styles.shareTileDark, pressed && styles.shareTileDarkPressed]}
              onPress={handleContactAction}
            >
              <AppIcon name="user-plus" size={16} color="rgba(255,255,255,0.75)" />
              <AppText style={styles.shareTileText} weight="medium">Save Contact</AppText>
            </Pressable>
          </View>

          {/* Apple Wallet Pass Banner */}
          <Pressable
            style={({ pressed }) => [
              styles.walletBannerCard,
              pressed && styles.walletBannerPressed,
            ]}
            onPress={() => {
              HapticTap.selection();
              router.push('/wallet-pass' as any);
            }}
          >
            <View style={styles.walletLeftContent}>
              <View style={styles.walletIconCircle}>
                <AppIcon name="credit-card" size={20} color="#FFFFFF" />
              </View>
              <View>
                <AppText style={styles.walletTitle} weight="bold">
                  Add to Apple Wallet
                </AppText>
                <AppText style={styles.walletSubtitle}>
                  Offline lockscreen pass & instant tap badge
                </AppText>
              </View>
            </View>
            <AppIcon name="chevron-right" size={16} color={C.textMuted} />
          </Pressable>

          {/* Section: CARD OVERVIEW */}
          <View style={styles.sectionTitleRow}>
            <AppText style={styles.sectionHeaderTitle} weight="bold">
              CARD OVERVIEW
            </AppText>
          </View>

          <View style={styles.overviewRow}>
            {/* 326 NFC Taps */}
            <Pressable
              style={styles.overviewItem}
              onPress={() => router.push('/analytics/nfc' as any)}
            >
              <View style={styles.dialWrap}>
                <AppText style={styles.overviewNumber} weight="bold">326</AppText>
              </View>
              <AppText style={styles.overviewLabel}>NFC TAPS</AppText>
            </Pressable>

            {/* 1,284 Profile Views */}
            <Pressable
              style={styles.overviewItem}
              onPress={() => router.push('/analytics' as any)}
            >
              <View style={styles.dialWrap}>
                <AppText style={styles.overviewNumber} weight="bold">1,284</AppText>
              </View>
              <AppText style={styles.overviewLabel}>PROFILE VIEWS</AppText>
            </Pressable>

            {/* 12 Contacts */}
            <Pressable
              style={styles.overviewItem}
              onPress={() => router.push('/leads' as any)}
            >
              <View style={styles.dialWrap}>
                <AppText style={styles.overviewNumber} weight="bold">12</AppText>
              </View>
              <AppText style={styles.overviewLabel}>CONTACTS</AppText>
            </Pressable>
          </View>

          <View style={{ height: 110 }} />
        </View>
      </IosScrollView>

      {/* Understated Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <AppText style={styles.toastText} weight="medium">
            {toastMessage}
          </AppText>
        </View>
      )}

      {/* NFC Beam Modal */}
      <NfcBeamModal
        visible={showBeamModal}
        onClose={() => setShowBeamModal(false)}
        url={profileUrl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    color: C.text,
  },
  scroll: {
    flexGrow: 1,
  },
  contentWrap: {
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 14,
    color: C.textSecondary,
    marginBottom: 2,
  },
  nameText: {
    fontSize: 26,
    color: C.text,
    letterSpacing: -0.5,
  },
  readyText: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: '#000000',
  },
  cardWrapper: {
    backgroundColor: '#242424',
    borderRadius: 20,
    padding: 22,
    marginTop: 10,
    minHeight: 184,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBrandText: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  contactlessSymbol: {
    width: 24,
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  contactlessArc: {
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRightWidth: 2,
    borderRadius: 12,
  },
  arc1: { width: 4, height: 8 },
  arc2: { width: 5, height: 13 },
  arc3: { width: 6, height: 18 },
  cardBody: {
    marginVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardOwnerCol: {
    flex: 1,
    paddingRight: 12,
  },
  cardAvatarPhoto: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#000000',
  },
  cardOwnerName: {
    fontSize: 20,
    letterSpacing: 0.8,
    color: C.text,
  },
  cardOwnerTitle: {
    fontSize: 12,
    color: C.textSecondary,
    letterSpacing: 0.4,
    marginTop: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusPillText: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardMaterialText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '600',
  },
  tapToShareBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  tapToShareBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  tapToShareInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tapToShareText: {
    fontSize: 14,
    letterSpacing: 0.8,
    color: '#000000',
  },
  sectionTitleRow: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: C.textMuted,
  },
  shareGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  /* Hero Light Pill Button (TipMe / Apple Pay Inspired) */
  sharePillPrimary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sharePillPrimaryPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    transform: [{ scale: 0.98 }],
  },
  sharePillSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sharePillSecondaryPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    transform: [{ scale: 0.98 }],
  },
  sharePillTitle: {
    fontSize: 13,
    color: '#000000',
    letterSpacing: -0.2,
  },
  sharePillSub: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.60)',
    marginTop: 1,
  },
  /* Secondary Charcoal Glass Tile (Hard Minimalist) */
  shareTileDark: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    height: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareTileDarkPressed: {
    backgroundColor: '#2C2C2E',
    transform: [{ scale: 0.98 }],
  },
  shareTileText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: -0.1,
  },
  overviewRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overviewItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dialWrap: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  overviewLabel: {
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    backgroundColor: '#1E1E24',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: C.text,
    fontSize: 13,
  },
  walletBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  walletBannerPressed: {
    backgroundColor: C.surfaceRaised,
  },
  walletLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: {
    fontSize: 14,
    color: C.text,
  },
  walletSubtitle: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
});
