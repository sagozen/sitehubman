/**
 * GuestProfileScreen — X.com-style guest identity & profile preview screen.
 *
 * Layout:
 *  1. Solid black canvas (#000000) with 640px responsive container
 *  2. X.com header banner with floating overlapping circular avatar (-42px top margin, 4px black border)
 *  3. Header action row: 'Sign In to Unlock' white pill CTA + NFC Demo button
 *  4. X.com metadata: Name with Verified Badge, @guest handle, preview stats
 *  5. Underlined X.com navigation tab bar (Overview | Features | Design | Lock Preview)
 *  6. High-contrast charcoal cards (#111114, 1px border rgba(255,255,255,0.08))
 */
import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, router } from 'expo-router';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppHeaderV2 } from '@/src/components/AppHeaderV2';
import { AppButtonV2 } from '@/src/components/AppButtonV2';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { HapticTap } from '@/src/utils/haptics';

const BANNER_H = 140;

const HEADER_GRADIENTS = [
  ['#1D9BF0', '#0044FF'],
  ['#8E54E9', '#4776E6'],
  ['#00B4DB', '#0083B0'],
] as const;

function getHeaderColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return HEADER_GRADIENTS[Math.abs(hash) % HEADER_GRADIENTS.length];
}

const LOCKED_FEATURES: { icon: AppIconName; label: string; sub: string }[] = [
  { icon: 'QrCode', label: 'QR Code Share', sub: 'Personal share link' },
  { icon: 'Nfc', label: 'NFC Chip Lock', sub: 'Write profile to card' },
  { icon: 'Wallet', label: 'Apple Wallet', sub: 'Mobile wallet pass' },
  { icon: 'Image', label: 'Photo Upload', sub: 'Personalize avatar' },
];

export function GuestProfileScreen() {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'features' | 'design'>('overview');
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();

  const displayName = user?.displayName?.trim() || 'Guest Creator';
  const initial = (displayName[0] || 'G').toUpperCase();
  const gradColors = getHeaderColors(displayName);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces style={styles.scroll}>
        <View style={styles.container}>

          <AppHeaderV2
            title="Profile"
            showBack={true}
            rightComponent={
              <Pressable onPress={() => { HapticTap.light(); }} hitSlop={12}>
                <AppIcon name="Bell" size={20} color="#FFFFFF" />
              </Pressable>
            }
          />

          {/* ── 2. Floating Overlapping Avatar & Action Pills ── */}
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[gradColors[0], gradColors[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarImg}
              >
                <AppText style={styles.avatarInitial} weight="extrabold">{initial}</AppText>
              </LinearGradient>
            </View>

            <View style={styles.actionPillRow}>
              <AppButtonV2
                variant="primary"
                size="sm"
                label="Sign In"
                iconLeft="LogIn"
                onPress={() => {
                  HapticTap.medium();
                  requireAccount(undefined, { message: 'Sign in to unlock your full digital profile card.' });
                }}
              />

              <AppButtonV2
                variant="secondary"
                size="sm"
                iconLeft="Nfc"
                onPress={() => {
                  HapticTap.light();
                  router.push(appRoutes.nfcDemo as Href);
                }}
              />
            </View>
          </View>

          {/* ── 3. Profile Metadata (X.com Style) ── */}
          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <AppText style={styles.displayNameText} weight="extrabold" numberOfLines={1}>
                {displayName}
              </AppText>
            </View>

            <AppText style={styles.handleText}>@guest_preview</AppText>

            <AppText style={styles.taglineText}>
              Previewing SiteHubMan NFC Digital Card OS. Sign in to edit bio, add custom links, and write to physical NFC chips.
            </AppText>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <AppIcon name="ShieldCheck" size={13} color="rgba(255,255,255,0.45)" />
                <AppText style={styles.metaText}>Preview Mode</AppText>
              </View>
              <View style={styles.metaItem}>
                <AppIcon name="Globe" size={13} color="#1D9BF0" />
                <AppText style={[styles.metaText, styles.metaLink]}>sitehubman.app</AppText>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">0</AppText>
                <AppText style={styles.statLabel}>Following</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">0</AppText>
                <AppText style={styles.statLabel}>Followers</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">1</AppText>
                <AppText style={styles.statLabel}>Draft Card</AppText>
              </View>
            </View>
          </View>

          {/* ── 4. X.com Underlined Navigation Tab Bar ── */}
          <View style={styles.navTabContainer}>
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'features', label: 'Features' },
              { key: 'design', label: 'Design' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={styles.navTabItem}
                  onPress={() => { HapticTap.light(); setActiveTab(tab.key as any); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <AppText
                    style={[styles.navTabText, isActive && styles.navTabTextActive]}
                    weight={isActive ? 'extrabold' : 'regular'}
                  >
                    {tab.label}
                  </AppText>
                  {isActive && <View style={styles.navActiveIndicator} />}
                </Pressable>
              );
            })}
          </View>

          {/* ── 5. Tab Content ── */}
          {activeTab === 'overview' && (
            <View style={styles.tabBody}>
              <Pressable
                style={({ pressed }) => [styles.bannerCtaCard, pressed && styles.pressed]}
                onPress={() => {
                  HapticTap.medium();
                  requireAccount(undefined, { message: 'Create your account to unlock your digital card.' });
                }}
              >
                <View style={styles.ctaCopyWrap}>
                  <AppText style={styles.ctaCardTitle} weight="extrabold">Unlock Full Profile</AppText>
                  <AppText style={styles.ctaCardSub}>Create a free account to customize your URL, links, and NFC cards.</AppText>
                </View>
                <AppIcon name="ChevronRight" size={18} color="rgba(255,255,255,0.4)" />
              </Pressable>

              <View style={styles.featureGrid}>
                {LOCKED_FEATURES.map((f) => (
                  <Pressable
                    key={f.label}
                    style={({ pressed }) => [styles.featureTile, pressed && styles.pressed]}
                    onPress={() => {
                      HapticTap.light();
                      requireAccount(undefined, { message: `Sign in to access ${f.label}.` });
                    }}
                  >
                    <View style={styles.featureIconWrap}>
                      <AppIcon name={f.icon} size={20} color="#FFFFFF" />
                    </View>
                    <AppText style={styles.featureLabel} weight="extrabold">{f.label}</AppText>
                    <AppText style={styles.featureSub}>{f.sub}</AppText>
                    <View style={styles.lockBadge}>
                      <AppIcon name="Lock" size={10} color="rgba(255,255,255,0.4)" />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'features' && (
            <View style={styles.tabBody}>
              <View style={styles.featureGrid}>
                {LOCKED_FEATURES.map((f) => (
                  <Pressable
                    key={f.label}
                    style={styles.featureTile}
                    onPress={() => requireAccount(undefined, { message: `Sign in to unlock ${f.label}.` })}
                  >
                    <View style={styles.featureIconWrap}>
                      <AppIcon name={f.icon} size={20} color="#FFFFFF" />
                    </View>
                    <AppText style={styles.featureLabel} weight="extrabold">{f.label}</AppText>
                    <AppText style={styles.featureSub}>{f.sub}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'design' && (
            <View style={styles.tabBody}>
              <Pressable
                style={({ pressed }) => [styles.designCard, pressed && styles.pressed]}
                onPress={() => { HapticTap.medium(); router.push(appRoutes.guestDesign as Href); }}
              >
                <AppIcon name="CreditCard" size={24} color="#FFFFFF" />
                <View style={styles.designCopy}>
                  <AppText style={styles.designTitle} weight="extrabold">Design Your NFC Card</AppText>
                  <AppText style={styles.designSub}>Preview 3D gradient templates and layout presets</AppText>
                </View>
                <AppIcon name="ChevronRight" size={18} color="rgba(255,255,255,0.4)" />
              </Pressable>
            </View>
          )}

          <View style={{ height: 140 }} />
        </View>
      </ScrollView>

      {/* ── 6. Bottom Sticky Action Pill ── */}
      <View style={styles.stickyFooter}>
        <SafeAreaView edges={['bottom']}>
          <AppButtonV2
            variant="primary"
            size="lg"
            label="Create free account →"
            fullWidth
            onPress={() => {
              HapticTap.medium();
              requireAccount(undefined, { message: 'Create your free account to go live.' });
            }}
          />
        </SafeAreaView>
      </View>
    </View>
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
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: '#000000',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // ── Cover Banner ──
  bannerWrap: {
    width: '100%',
    height: BANNER_H,
    position: 'relative',
    backgroundColor: '#111114',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Floating Avatar & Actions ──
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -42,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#000000',
    backgroundColor: '#111114',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  actionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  signInBtnText: {
    color: '#000000',
    fontSize: 14,
  },
  secondaryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Profile Metadata ──
  infoSection: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayNameText: {
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    justifyContent: 'center',
  },
  handleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: -4,
  },
  taglineText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginTop: 4,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  metaLink: {
    color: '#1D9BF0',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 8,
    paddingTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statNum: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },

  // ── Nav Tab Bar ──
  navTabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  navTabItem: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navTabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },
  navActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  // ── Tab Body ──
  tabBody: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bannerCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  ctaCopyWrap: {
    flex: 1,
    gap: 4,
  },
  ctaCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  ctaCardSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },

  // ── Feature Grid ──
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureTile: {
    width: '48%',
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 6,
    minHeight: 110,
    justifyContent: 'center',
    position: 'relative',
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  featureSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  lockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // ── Design Card ──
  designCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  designCopy: {
    flex: 1,
    gap: 2,
  },
  designTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  designSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },

  // ── Sticky Footer ──
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  createAccountBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  createAccountText: {
    color: '#000000',
    fontSize: 15,
  },
});
