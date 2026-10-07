/**
 * HomeScreen — Flow 1: Home / Living Digital Identity
 * Direction:
 * - Photography & Human Presence (large executive portrait anchor, avatar cluster)
 * - Breaking the Card Box (editorial bleed, floating physical card, overlapping badge)
 * - Living Data (real people connections "+6 today", reach curve, active beacon)
 * - High-Impact Editorial Typography ("Be remembered. One tap away.")
 * - Apple HIG × Modern Travel Lifestyle × Premium Black Granite UI
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Clipboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  canvas: '#000000',
  surface: '#0E0E12',
  surfaceRaised: '#16161C',
  surfaceGlass: 'rgba(20, 20, 26, 0.72)',
  hairline: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#636366',
  accent: '#2596BE',
  accentCyan: '#00A3FF',
  emerald: '#30D158',
} as const;

export function HomeScreen() {
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');

  const userName = bioPage?.displayName || user?.displayName || 'Thean Coc';
  const userTitle = bioPage?.tagline || bioPage?.headline || 'Founder & Director';
  const company = bioPage?.company || 'NFC Global';

  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    router.push('/(tabs)/share' as any);
  }, []);

  const handleNfcAction = useCallback(() => {
    HapticTap.medium();
    router.push('/nfc/connect' as any);
  }, []);

  const handleQrAction = useCallback(() => {
    HapticTap.light();
    router.push('/qr-generator' as any);
  }, []);

  const handleLinkAction = useCallback(() => {
    HapticTap.softConfirmation();
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(profileUrl).catch(() => null);
    } else if (Clipboard && Clipboard.setString) {
      Clipboard.setString(profileUrl);
    }
    showToast('Profile link copied');
  }, [profileUrl, showToast]);

  const handleContactAction = useCallback(() => {
    HapticTap.light();
    router.push('/contact-card' as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Top Editorial Identity Header (Breaks rigid borders) ── */}
        <View style={styles.topBar}>
          <View>
            <AppText style={styles.brandKicker} weight="bold">
              SITEHUB · IDENTITY
            </AppText>
            <AppText style={styles.editorialHeadline} weight="bold">
              Be remembered.
            </AppText>
          </View>

          <Pressable
            style={styles.avatarPill}
            onPress={() => router.push('/(tabs)/settings' as any)}
            hitSlop={10}
          >
            <Image
              source={require('@/assets/images/avatars/avatar_founder_man.jpg')}
              style={styles.topBarAvatar}
            />
            <View style={styles.onlineDot} />
          </Pressable>
        </View>

        {/* ── Living Visual Hero Anchor (Large Portrait + Floating NFC Pass) ── */}
        <View style={styles.heroAnchorContainer}>
          {/* Real Human Photography Environment */}
          <View style={styles.heroPhotoWrapper}>
            <Image
              source={require('@/assets/images/avatars/avatar_executive_real.jpg')}
              style={styles.heroPhotoImage}
              resizeMode="cover"
            />
            <View style={styles.heroPhotoOverlay} />

            {/* Overlapping Identity Title directly on photography */}
            <View style={styles.heroTextOverlay}>
              <View style={styles.heroLiveBadge}>
                <View style={styles.heroBeaconDot} />
                <AppText style={styles.heroLiveText} weight="bold">
                  NFC ACTIVE
                </AppText>
              </View>

              <AppText style={styles.heroPersonName} weight="bold">
                {userName}
              </AppText>
              <AppText style={styles.heroPersonTitle}>
                {userTitle} · {company}
              </AppText>
            </View>
          </View>

          {/* Floating Physical Metal Card Overlay — Breaks Card Boundary */}
          <Pressable
            style={({ pressed }) => [
              styles.floatingMetalCard,
              pressed && styles.floatingCardPressed,
            ]}
            onPress={handleTapToShare}
          >
            <View style={styles.metalCardHeader}>
              <View style={styles.metalBrandRow}>
                <AppIcon name="wifi" size={15} color="rgba(255,255,255,0.85)" style={{ transform: [{ rotate: '90deg' }] }} />
                <AppText style={styles.metalBrandText} weight="bold">
                  NFC GLOBAL
                </AppText>
              </View>
              <AppText style={styles.metalMaterialBadge}>BLACK METAL</AppText>
            </View>

            <View style={styles.metalCardMiddle}>
              <AppText style={styles.metalOwnerText} weight="bold">
                {userName.toUpperCase()}
              </AppText>
              <AppText style={styles.metalRoleText}>
                MANAGING DIRECTOR · VERIFIED PASS
              </AppText>
            </View>

            <View style={styles.metalCardFooter}>
              <View style={styles.metalChipIcon}>
                <View style={styles.chipSegment} />
                <View style={styles.chipSegment} />
              </View>
              <AppText style={styles.metalSerialText}>
                ID // 084 · TAP READY
              </AppText>
            </View>
          </Pressable>
        </View>

        {/* ── Primary Physical Interaction Trigger ── */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryTapAction,
            pressed && styles.primaryTapActionPressed,
          ]}
          onPress={handleTapToShare}
        >
          <View style={styles.tapActionLeft}>
            <View style={styles.tapIconPulse}>
              <AppIcon name="wifi" size={20} color="#000000" style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
            <View>
              <AppText style={styles.tapActionTitle} weight="bold">
                TAP TO SHARE IDENTITY
              </AppText>
              <AppText style={styles.tapActionSubtitle}>
                Hold phone near client or card to beam
              </AppText>
            </View>
          </View>
          <AppIcon name="chevron-right" size={20} color="#000000" />
        </Pressable>

        {/* ── Living Connections Bar (People + Movement instead of static numbers) ── */}
        <Pressable
          style={styles.livingConnectionsBar}
          onPress={() => router.push('/leads' as any)}
        >
          <View style={styles.avatarStack}>
            <Image
              source={require('@/assets/images/avatars/avatar_founder_man.jpg')}
              style={[styles.stackAvatar, { zIndex: 4, left: 0 }]}
            />
            <Image
              source={require('@/assets/images/avatars/avatar_founder_woman.jpg')}
              style={[styles.stackAvatar, { zIndex: 3, left: 24 }]}
            />
            <Image
              source={require('@/assets/images/avatars/avatar_executive_real.jpg')}
              style={[styles.stackAvatar, { zIndex: 2, left: 48 }]}
            />
            <View style={[styles.stackAvatarCount, { zIndex: 1, left: 72 }]}>
              <AppText style={styles.stackCountText} weight="bold">
                +18
              </AppText>
            </View>
          </View>

          <View style={styles.connectionsTextCol}>
            <View style={styles.connectionsRow}>
              <AppText style={styles.connectionsHighlight} weight="bold">
                24 new connections
              </AppText>
              <View style={styles.todayPill}>
                <AppText style={styles.todayPillText} weight="bold">
                  +6 today
                </AppText>
              </View>
            </View>
            <AppText style={styles.connectionsSub}>
              Metfone Summit & Executive Dinners
            </AppText>
          </View>

          <AppIcon name="chevron-right" size={16} color={C.textMuted} />
        </Pressable>

        {/* ── Living Data: Visual Reach Graph (No rigid box, continuous rhythm) ── */}
        <View style={styles.visualReachSection}>
          <View style={styles.reachHeader}>
            <View>
              <AppText style={styles.reachSectionTitle} weight="bold">
                Profile Reach
              </AppText>
              <AppText style={styles.reachNumber} weight="bold">
                1,284 views
              </AppText>
            </View>
            <View style={styles.trendBadge}>
              <AppIcon name="trending-up" size={12} color={C.emerald} />
              <AppText style={styles.trendText} weight="bold">
                +24% this week
              </AppText>
            </View>
          </View>

          {/* Organic Day Waves */}
          <View style={styles.waveChartRow}>
            {[
              { day: 'Mon', h: 32, active: false },
              { day: 'Tue', h: 48, active: false },
              { day: 'Wed', h: 64, active: false },
              { day: 'Thu', h: 92, active: true },
              { day: 'Fri', h: 80, active: false },
              { day: 'Sat', h: 44, active: false },
              { day: 'Sun', h: 96, active: true },
            ].map((col) => (
              <View key={col.day} style={styles.waveCol}>
                <View style={styles.waveTrack}>
                  <View
                    style={[
                      styles.waveBar,
                      { height: `${col.h}%` },
                      col.active && styles.waveBarActive,
                    ]}
                  />
                </View>
                <AppText style={styles.waveDayLabel}>{col.day}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* ── Share Matrix (Sleek High-Contrast Floating Triggers) ── */}
        <View style={styles.shareMatrixHeader}>
          <AppText style={styles.shareMatrixTitle} weight="bold">
            QUICK EXCHANGE
          </AppText>
        </View>

        <View style={styles.shareActionsRow}>
          <Pressable
            style={({ pressed }) => [styles.shareActionBtn, pressed && styles.shareActionBtnPressed]}
            onPress={handleNfcAction}
          >
            <View style={styles.shareActionIconWrap}>
              <AppIcon name="wifi" size={18} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
            <AppText style={styles.shareActionBtnTitle} weight="medium">NFC</AppText>
            <AppText style={styles.shareActionBtnSub}>Device tap</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareActionBtn, pressed && styles.shareActionBtnPressed]}
            onPress={handleQrAction}
          >
            <View style={styles.shareActionIconWrap}>
              <AppIcon name="qr-code" size={18} color="#FFFFFF" />
            </View>
            <AppText style={styles.shareActionBtnTitle} weight="medium">QR Pass</AppText>
            <AppText style={styles.shareActionBtnSub}>Fullscreen</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareActionBtn, pressed && styles.shareActionBtnPressed]}
            onPress={handleLinkAction}
          >
            <View style={styles.shareActionIconWrap}>
              <AppIcon name="copy" size={18} color="#FFFFFF" />
            </View>
            <AppText style={styles.shareActionBtnTitle} weight="medium">Copy Link</AppText>
            <AppText style={styles.shareActionBtnSub}>Web URL</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareActionBtn, pressed && styles.shareActionBtnPressed]}
            onPress={handleContactAction}
          >
            <View style={styles.shareActionIconWrap}>
              <AppIcon name="user-plus" size={18} color="#FFFFFF" />
            </View>
            <AppText style={styles.shareActionBtnTitle} weight="medium">vCard</AppText>
            <AppText style={styles.shareActionBtnSub}>Contacts</AppText>
          </Pressable>
        </View>

        {/* ── Live Activity Feed (Human Interactions) ── */}
        <View style={styles.activityHeader}>
          <AppText style={styles.activitySectionTitle} weight="bold">
            Recent Interactions
          </AppText>
          <Pressable
            onPress={() => router.push('/activity' as any)}
            hitSlop={8}
          >
            <AppText style={styles.viewAllText}>View All →</AppText>
          </Pressable>
        </View>

        <View style={styles.activityContainer}>
          {/* Item 1 */}
          <Pressable
            style={styles.activityItem}
            onPress={() => router.push('/leads/john-smith' as any)}
          >
            <Image
              source={require('@/assets/images/avatars/avatar_executive_real.jpg')}
              style={styles.activityAvatar}
            />
            <View style={styles.activityTextCol}>
              <AppText style={styles.activityItemName} weight="bold">
                John Smith (ABC Corp)
              </AppText>
              <AppText style={styles.activityItemMeta}>
                NFC Tap · Direct physical pass exchange
              </AppText>
            </View>
            <AppText style={styles.activityTime}>09:42</AppText>
          </Pressable>

          <View style={styles.activityItemDivider} />

          {/* Item 2 */}
          <Pressable
            style={styles.activityItem}
            onPress={() => router.push('/leads/sokha-chan' as any)}
          >
            <Image
              source={require('@/assets/images/avatars/avatar_founder_woman.jpg')}
              style={styles.activityAvatar}
            />
            <View style={styles.activityTextCol}>
              <AppText style={styles.activityItemName} weight="bold">
                Sokha Chan (ABC Group)
              </AppText>
              <AppText style={styles.activityItemMeta}>
                QR Pass Scan · Marketing Executive
              </AppText>
            </View>
            <AppText style={styles.activityTime}>09:18</AppText>
          </Pressable>
        </View>

        <View style={{ height: 110 }} />
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
    paddingTop: 4,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  brandKicker: {
    fontSize: 10,
    letterSpacing: 2,
    color: C.accentCyan,
    marginBottom: 4,
  },
  editorialHeadline: {
    fontSize: 28,
    letterSpacing: -0.8,
    color: C.text,
  },
  avatarPill: {
    position: 'relative',
  },
  topBarAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.emerald,
    borderWidth: 2,
    borderColor: '#000000',
  },
  heroAnchorContainer: {
    marginTop: 14,
    marginBottom: 20,
  },
  heroPhotoWrapper: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F0F14',
  },
  heroPhotoImage: {
    width: '100%',
    height: '100%',
  },
  heroPhotoOverlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  heroTextOverlay: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    right: 20,
  },
  heroLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  heroBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.emerald,
  },
  heroLiveText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
  heroPersonName: {
    fontSize: 26,
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  heroPersonTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  floatingMetalCard: {
    marginTop: -38,
    marginHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#121217',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  floatingCardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  metalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metalBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metalBrandText: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  metalMaterialBadge: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: C.accentCyan,
    fontWeight: '700',
  },
  metalCardMiddle: {
    marginVertical: 14,
  },
  metalOwnerText: {
    fontSize: 18,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  metalRoleText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.textSecondary,
    marginTop: 3,
  },
  metalCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metalChipIcon: {
    flexDirection: 'row',
    gap: 3,
  },
  chipSegment: {
    width: 10,
    height: 7,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  metalSerialText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.textMuted,
  },
  primaryTapAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryTapActionPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  tapActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tapIconPulse: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapActionTitle: {
    fontSize: 14,
    letterSpacing: 0.6,
    color: '#000000',
  },
  tapActionSubtitle: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 2,
  },
  livingConnectionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  avatarStack: {
    width: 108,
    height: 36,
    position: 'relative',
    justifyContent: 'center',
  },
  stackAvatar: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
  },
  stackAvatarCount: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceRaised,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackCountText: {
    fontSize: 10,
    color: C.accentCyan,
  },
  connectionsTextCol: {
    flex: 1,
    marginLeft: 8,
  },
  connectionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionsHighlight: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  todayPill: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayPillText: {
    fontSize: 10,
    color: C.emerald,
  },
  connectionsSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  visualReachSection: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
  },
  reachHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reachSectionTitle: {
    fontSize: 13,
    color: C.textSecondary,
    letterSpacing: 0.2,
  },
  reachNumber: {
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    color: C.emerald,
  },
  waveChartRow: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  waveCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  waveTrack: {
    flex: 1,
    width: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  waveBar: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 7,
  },
  waveBarActive: {
    backgroundColor: C.accentCyan,
  },
  waveDayLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
  shareMatrixHeader: {
    marginBottom: 12,
  },
  shareMatrixTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: C.textMuted,
  },
  shareActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  shareActionBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareActionBtnPressed: {
    backgroundColor: C.surfaceRaised,
    transform: [{ scale: 0.98 }],
  },
  shareActionIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareActionBtnTitle: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  shareActionBtnSub: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activitySectionTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 13,
    color: C.textSecondary,
  },
  activityContainer: {
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  activityTextCol: {
    flex: 1,
  },
  activityItemName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  activityItemMeta: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: C.textSecondary,
  },
  activityItemDivider: {
    height: 0,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#1E1E24',
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
