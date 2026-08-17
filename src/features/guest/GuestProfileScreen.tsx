/**
 * GuestProfileScreen — Apple Wallet × Nothing × Premium Fintech Edition.
 *
 * Design Philosophy:
 *  - Stripped of heavy nested boxes and card clutter (35% reduction in visual noise)
 *  - One clear, beautiful focal element: The AVIO Smart Pass (Apple Wallet style)
 *  - Controlled contrast: Pure black background (#000000) with atmospheric dark gray & crisp white typography
 *  - Clean inline metrics without clunky multi-border containers
 *  - Minimalist hardware identity selector (selecting your physical AVIO pass tier)
 */
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { HapticTap } from '@/src/utils/haptics';

const PASS_TIERS = [
  { id: 'obsidian', name: 'Obsidian Matte Steel', finish: 'Laser-Etched Black Metal', grad: ['#222226', '#0E0E10'] },
  { id: 'gold', name: '24K Mirror Gold', finish: 'Reflective PVD Coating', grad: ['#3A3018', '#1A1608'] },
  { id: 'silver', name: 'Aerospace Silver', finish: 'Brushed 316L Stainless', grad: ['#2E3238', '#14171A'] },
];

export function GuestProfileScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'pass'>('overview');
  const [selectedTier, setSelectedTier] = useState(PASS_TIERS[0]);
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();

  const displayName = user?.displayName?.trim() || 'Alexander Wright';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>

          {/* ── 1. Top Navigation Bar (Borderless) ── */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => { HapticTap.selection(); router.push('/'); }}
              style={styles.navButton}
              hitSlop={12}
              accessibilityLabel="Back"
            >
              <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
            </Pressable>

            <AppText style={styles.navTitle} weight="bold">
              AVIO Identity
            </AppText>

            <Pressable
              onPress={() => {
                HapticTap.medium();
                requireAccount(undefined, { message: 'Sign in to access your AVIO account settings.' });
              }}
              style={styles.navButton}
              hitSlop={12}
              accessibilityLabel="Account settings"
            >
              <AppIcon name="Sliders" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* ── 2. Profile Identity Hero (Calm & Spacious) ── */}
          <View style={styles.heroSection}>
            {/* AVIO Monogram Seal */}
            <View style={styles.avatarSeal}>
              <View style={styles.avatarRing}>
                <AppText style={styles.avatarText} weight="extrabold">AV</AppText>
              </View>
            </View>

            {/* Typography Hierarchy */}
            <View style={styles.nameBlock}>
              <View style={styles.nameRow}>
                <AppText style={styles.userName} weight="extrabold">
                  {displayName}
                </AppText>
                <View style={styles.verifiedDot} />
              </View>
              <AppText style={styles.userHandle}>@guest_preview · AVIO Digital Member</AppText>
            </View>

            <AppText style={styles.userBio}>
              Contactless NFC Smart Pass · Instant Apple Contacts exchange and real-time CRM webhook routing.
            </AppText>

            {/* Clean Inline Metrics (No Boxes) */}
            <View style={styles.metricsInline}>
              <AppText style={styles.metricBold} weight="bold">48 <AppText style={styles.metricMuted}>Taps</AppText></AppText>
              <AppText style={styles.metricDot}>·</AppText>
              <AppText style={styles.metricBold} weight="bold">12 <AppText style={styles.metricMuted}>Leads</AppText></AppText>
              <AppText style={styles.metricDot}>·</AppText>
              <AppText style={styles.metricBold} weight="bold">1 <AppText style={styles.metricMuted}>Active Pass</AppText></AppText>
            </View>
          </View>

          {/* ── 3. Focal Hero Element: AVIO Smart Pass (Apple Wallet Style) ── */}
          <View style={styles.passSection}>
            <LinearGradient
              colors={selectedTier.grad as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.appleWalletCard}
            >
              {/* Card Top */}
              <View style={styles.cardHeader}>
                <View style={styles.cardBrandRow}>
                  <View style={styles.nfcWaveIcon}>
                    <AppIcon name="Nfc" size={16} color="#FFFFFF" />
                  </View>
                  <AppText style={styles.cardBrandText} weight="extrabold">AVIO PASS</AppText>
                </View>
                <View style={styles.cardPill}>
                  <AppText style={styles.cardPillText} weight="bold">NFC READY</AppText>
                </View>
              </View>

              {/* Card Bottom */}
              <View style={styles.cardFooter}>
                <View>
                  <AppText style={styles.cardHolderName} weight="bold">{displayName}</AppText>
                  <AppText style={styles.cardTierText}>{selectedTier.finish}</AppText>
                </View>
                <AppText style={styles.cardSerial}>#8890-PASS</AppText>
              </View>
            </LinearGradient>
          </View>

          {/* ── 4. Segmented Control (Minimalist Nothing/Apple Style) ── */}
          <View style={styles.tabStrip}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'activity', label: 'Actions' },
              { id: 'pass', label: 'Pass Finish' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                  onPress={() => { HapticTap.selection(); setActiveTab(tab.id as any); }}
                >
                  <AppText
                    style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}
                    weight={isSelected ? 'bold' : 'medium'}
                  >
                    {tab.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* ── 5. Tab Panels (Uncluttered) ── */}
          {activeTab === 'overview' && (
            <View style={styles.contentSection}>
              <View style={styles.actionList}>
                {[
                  { icon: 'QrCode', title: 'Dynamic QR Code', sub: 'Instant vCard scan for Apple Contacts' },
                  { icon: 'Send', title: 'Telegram CRM Channel', sub: 'Receive leads instantly on Telegram' },
                  { icon: 'Globe', title: 'Public Bio URL', sub: 'sitehubman.app/alexander' },
                  { icon: 'Nfc', title: 'Burn to NFC Card', sub: 'Write profile data to physical chip' },
                ].map((item, idx) => (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
                    onPress={() => {
                      HapticTap.light();
                      if (item.icon === 'Nfc') router.push(appRoutes.nfcDemo as Href);
                      else requireAccount(undefined, { message: `Sign in to use ${item.title}.` });
                    }}
                  >
                    <View style={styles.actionIcon}>
                      <AppIcon name={item.icon} size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.actionText}>
                      <AppText style={styles.actionTitle} weight="bold">{item.title}</AppText>
                      <AppText style={styles.actionSub}>{item.sub}</AppText>
                    </View>
                    <AppIcon name="ChevronRight" size={16} color="rgba(255, 255, 255, 0.3)" />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'activity' && (
            <View style={styles.contentSection}>
              <View style={styles.activityList}>
                {[
                  { title: 'NFC Tap at Tech Summit', time: '10m ago · iPhone 16 Pro', status: 'Delivered' },
                  { title: 'Contact Saved to Address Book', time: '2h ago · QR Scan', status: 'Success' },
                  { title: 'Telegram Lead Forwarded', time: 'Yesterday · @alexander', status: 'Synced' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.activityRow}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityInfo}>
                      <AppText style={styles.activityTitle} weight="bold">{item.title}</AppText>
                      <AppText style={styles.activityTime}>{item.time}</AppText>
                    </View>
                    <AppText style={styles.activityStatus}>{item.status}</AppText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'pass' && (
            <View style={styles.contentSection}>
              <View style={styles.tierSelector}>
                {PASS_TIERS.map((tier) => {
                  const isCurrent = selectedTier.id === tier.id;
                  return (
                    <Pressable
                      key={tier.id}
                      style={[styles.tierRow, isCurrent && styles.tierRowActive]}
                      onPress={() => { HapticTap.selection(); setSelectedTier(tier); }}
                    >
                      <View style={styles.tierRadio}>
                        {isCurrent && <View style={styles.tierRadioDot} />}
                      </View>
                      <View style={styles.tierInfo}>
                        <AppText style={[styles.tierName, isCurrent && styles.tierNameActive]} weight="bold">
                          {tier.name}
                        </AppText>
                        <AppText style={styles.tierFinish}>{tier.finish}</AppText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── 6. Single Obvious Primary Action (High Contrast Apple Button) ── */}
          <View style={styles.primaryActionSection}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                HapticTap.medium();
                if (isGuest) {
                  requireAccount(undefined, { message: 'Create an account to activate your physical AVIO pass.' });
                } else {
                  router.push(appRoutes.guestDesign as Href);
                }
              }}
            >
              <AppText style={styles.primaryButtonText} weight="extrabold">
                {isGuest ? 'Create Account & Activate Pass' : 'Customize in 3D Studio'}
              </AppText>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  container: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  rowPressed: {
    opacity: 0.7,
  },

  // ── Top Nav ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  // ── Profile Hero (Calm & Spacious) ──
  heroSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    gap: 10,
  },
  avatarSeal: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: 1,
  },
  nameBlock: {
    alignItems: 'center',
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  verifiedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  userHandle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
  },
  userBio: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  metricsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metricBold: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  metricMuted: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '400',
  },
  metricDot: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 13,
  },

  // ── Hero Smart Pass (Apple Wallet) ──
  passSection: {
    marginVertical: 14,
  },
  appleWalletCard: {
    width: '100%',
    height: 175,
    borderRadius: 18,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nfcWaveIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrandText: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 1.2,
  },
  cardPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  cardTierText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    marginTop: 2,
  },
  cardSerial: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    fontFamily: 'monospace',
  },

  // ── Segmented Control ──
  tabStrip: {
    flexDirection: 'row',
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 3,
    marginVertical: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#242428',
  },
  tabButtonText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  // ── Action Rows (Borderless) ──
  contentSection: {
    marginTop: 6,
  },
  actionList: {
    gap: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  actionSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },

  // ── Activity Tab ──
  activityList: {
    gap: 12,
    paddingVertical: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  activityInfo: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  activityTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  activityStatus: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },

  // ── Tier Selector ──
  tierSelector: {
    gap: 8,
    paddingVertical: 6,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  tierRowActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#18181C',
  },
  tierRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  tierNameActive: {
    color: '#FFFFFF',
  },
  tierFinish: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 1,
  },

  // ── Primary Button ──
  primaryActionSection: {
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
  },
});
