/**
 * GuestProfileScreen — Premium Apple HIG & X.com-style identity & profile preview screen.
 *
 * Features:
 *  1. Solid black canvas (#000000) with safe area constraints
 *  2. Refined avatar & verified banner with high-contrast Apple action buttons
 *  3. Dynamic X.com tabs (Overview | Features | Design) with rich interactive preview cards
 *  4. Proper paddingBottom (130px) so content never collides with floating bottom dock
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
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { HapticTap } from '@/src/utils/haptics';

const LOCKED_FEATURES: { icon: AppIconName; label: string; sub: string }[] = [
  { icon: 'QrCode', label: 'QR Code Share', sub: 'Instant dynamic vCard' },
  { icon: 'Nfc', label: 'NFC Chip Lock', sub: 'Burn profile to smart card' },
  { icon: 'Wallet', label: 'Apple Wallet Pass', sub: 'Native iOS pass integration' },
  { icon: 'Image', label: 'Custom Brand Proof', sub: 'High-res logo engraving' },
];

const CARD_PREVIEWS = [
  { id: 'gold', name: '24K Gold Plated', material: 'Mirror Gold Metal', tag: 'Executive Tier', gradient: ['#FFD700', '#B8860B'] },
  { id: 'matte', name: 'Matte Black Steel', material: 'Laser-Etched Steel', tag: 'Most Popular', gradient: ['#2A2A2E', '#111114'] },
  { id: 'steel', name: 'Brushed Steel', material: 'Aerospace Grade 316L', tag: 'Ultra Durable', gradient: ['#4B5563', '#1F2937'] },
  { id: 'pvc', name: 'Matte CR80 PVC', material: 'Dual-Band Contactless', tag: 'Core Standard', gradient: ['#18181C', '#0B0B0E'] },
];

export function GuestProfileScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'design'>('overview');
  const [selectedPreviewCard, setSelectedPreviewCard] = useState(CARD_PREVIEWS[1]);
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();

  const displayName = user?.displayName?.trim() || 'Alexander Wright';
  const initial = (displayName[0] || 'A').toUpperCase();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} bounces style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>

          {/* ── 1. Top Header Bar ── */}
          <View style={styles.headerBar}>
            <Pressable
              onPress={() => { HapticTap.selection(); router.push('/'); }}
              style={styles.headerIconBtn}
              hitSlop={12}
            >
              <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
            </Pressable>

            <AppText style={styles.headerTitle} weight="bold">
              Digital Profile
            </AppText>

            <Pressable
              onPress={() => {
                HapticTap.medium();
                requireAccount(undefined, { message: 'Sign in to access notifications and live tap alerts.' });
              }}
              style={styles.headerIconBtn}
              hitSlop={12}
            >
              <AppIcon name="Bell" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* ── 2. Banner & Profile Identity ── */}
          <View style={styles.bannerContainer}>
            <LinearGradient
              colors={['#18181C', '#0A0A0C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerOverlay}>
                <AppText style={styles.bannerTag} weight="bold">● AVIO NFC SYSTEM 2026</AppText>
              </View>
            </LinearGradient>

            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={['#2997FF', '#0055FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarInner}
                >
                  <AppText style={styles.avatarLetter} weight="extrabold">{initial}</AppText>
                </LinearGradient>
              </View>

              <View style={styles.headerActionBtns}>
                {isGuest ? (
                  <Pressable
                    style={styles.signInBtn}
                    onPress={() => {
                      HapticTap.medium();
                      requireAccount(undefined, { message: 'Sign in to unlock your full digital profile card.' });
                    }}
                  >
                    <AppText style={styles.signInBtnText} weight="bold">Sign In</AppText>
                  </Pressable>
                ) : null}

                <Pressable
                  style={styles.nfcDemoBtn}
                  onPress={() => {
                    HapticTap.light();
                    router.push(appRoutes.nfcDemo as Href);
                  }}
                >
                  <AppIcon name="Nfc" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── 3. Profile Information ── */}
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <AppText style={styles.displayName} weight="extrabold" numberOfLines={1}>
                {displayName}
              </AppText>
              <View style={styles.verifiedBadge}>
                <AppIcon name="CircleCheck" size={14} color="#2997FF" />
              </View>
            </View>

            <AppText style={styles.handle}>@guest_preview · Member Pass</AppText>

            <AppText style={styles.bio}>
              Enterprise NFC Digital Identity OS. Instant contact tap sharing, realtime Telegram CRM routing, and Apple Wallet pass integration.
            </AppText>

            {/* Quick Stats Capsule */}
            <View style={styles.statsCard}>
              <View style={styles.statCol}>
                <AppText style={styles.statNum} weight="extrabold">48</AppText>
                <AppText style={styles.statLabel}>NFC Taps</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <AppText style={styles.statNum} weight="extrabold">12</AppText>
                <AppText style={styles.statLabel}>CRM Leads</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <AppText style={styles.statNum} weight="extrabold">1</AppText>
                <AppText style={styles.statLabel}>Active Card</AppText>
              </View>
            </View>
          </View>

          {/* ── 4. Segmented Tabs (Overview | Features | Design) ── */}
          <View style={styles.tabBar}>
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'features', label: 'Features' },
              { key: 'design', label: 'Smart Cards' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => { HapticTap.light(); setActiveTab(tab.key as any); }}
                >
                  <AppText
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                    weight={isActive ? 'extrabold' : 'medium'}
                  >
                    {tab.label}
                  </AppText>
                  {isActive && <View style={styles.tabIndicator} />}
                </Pressable>
              );
            })}
          </View>

          {/* ── 5. Tab Content ── */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {/* Unlock Profile Card */}
              <Pressable
                style={({ pressed }) => [styles.ctaCard, pressed && styles.cardPressed]}
                onPress={() => {
                  HapticTap.medium();
                  requireAccount(undefined, { message: 'Create an account to publish your live bio link.' });
                }}
              >
                <View style={styles.ctaCardContent}>
                  <View style={styles.ctaBadge}>
                    <AppText style={styles.ctaBadgeText} weight="bold">FREE TRIAL</AppText>
                  </View>
                  <AppText style={styles.ctaTitle} weight="extrabold">Claim Your Custom avio.link</AppText>
                  <AppText style={styles.ctaSub}>
                    Get a personalized bio link with instant vCard saving, social buttons, and contactless NFC tap metrics.
                  </AppText>
                </View>
                <View style={styles.ctaArrow}>
                  <AppIcon name="ChevronRight" size={18} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* Quick Action Links Preview */}
              <AppText style={styles.sectionHeader}>LIVE LINK TREE PREVIEW</AppText>
              <View style={styles.linksGroup}>
                {[
                  { icon: 'Phone', title: 'Direct Call & WhatsApp', subtitle: '+855 12 345 678', color: '#10B981' },
                  { icon: 'Send', title: 'Telegram Channel', subtitle: '@enterprise_leads', color: '#2997FF' },
                  { icon: 'Globe', title: 'Official Website', subtitle: 'https://sitehubman.app', color: '#A855F7' },
                  { icon: 'QrCode', title: 'Save Contact (.vcf)', subtitle: '1-tap to Apple Contacts', color: '#FFFFFF' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.linkRow}>
                    <View style={[styles.linkIconBox, { backgroundColor: `${item.color}15` }]}>
                      <AppIcon name={item.icon} size={16} color={item.color} />
                    </View>
                    <View style={styles.linkInfo}>
                      <AppText style={styles.linkTitle} weight="bold">{item.title}</AppText>
                      <AppText style={styles.linkSub}>{item.subtitle}</AppText>
                    </View>
                    <AppIcon name="AltArrowRight" size={14} color="rgba(255,255,255,0.3)" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'features' && (
            <View style={styles.tabContent}>
              <View style={styles.featureGrid}>
                {LOCKED_FEATURES.map((f) => (
                  <Pressable
                    key={f.label}
                    style={({ pressed }) => [styles.featureCard, pressed && styles.cardPressed]}
                    onPress={() => {
                      HapticTap.light();
                      requireAccount(undefined, { message: `Sign in to unlock ${f.label}.` });
                    }}
                  >
                    <View style={styles.featureIconWrap}>
                      <AppIcon name={f.icon} size={20} color="#FFFFFF" />
                    </View>
                    <AppText style={styles.featureName} weight="bold">{f.label}</AppText>
                    <AppText style={styles.featureSub}>{f.sub}</AppText>
                    <View style={styles.featureLock}>
                      <AppIcon name="LockKeyhole" size={11} color="rgba(255,255,255,0.4)" />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'design' && (
            <View style={styles.tabContent}>
              {/* Selected 3D Card Showcase */}
              <View style={styles.cardShowcase}>
                <LinearGradient
                  colors={selectedPreviewCard.gradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardMockup}
                >
                  <View style={styles.cardMockupTop}>
                    <AppText style={styles.cardBrand} weight="extrabold">AVIO PASS</AppText>
                    <AppText style={styles.cardTag} weight="bold">{selectedPreviewCard.tag}</AppText>
                  </View>
                  <View style={styles.cardMockupBottom}>
                    <AppText style={styles.cardOwner} weight="extrabold">{displayName}</AppText>
                    <AppText style={styles.cardMat}>{selectedPreviewCard.material}</AppText>
                  </View>
                </LinearGradient>
              </View>

              {/* Material Selector Row */}
              <AppText style={styles.sectionHeader}>SELECT HARDWARE FINISH</AppText>
              <View style={styles.materialSelector}>
                {CARD_PREVIEWS.map((card) => {
                  const isSelected = selectedPreviewCard.id === card.id;
                  return (
                    <Pressable
                      key={card.id}
                      style={[styles.matItem, isSelected && styles.matItemActive]}
                      onPress={() => { HapticTap.selection(); setSelectedPreviewCard(card); }}
                    >
                      <AppText style={[styles.matName, isSelected && styles.matNameActive]} weight="bold">
                        {card.name}
                      </AppText>
                      <AppText style={styles.matSub}>{card.tag}</AppText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Customizer Button */}
              <Pressable
                style={styles.openStudioBtn}
                onPress={() => {
                  HapticTap.medium();
                  router.push(appRoutes.guestDesign as Href);
                }}
              >
                <AppIcon name="CreditCard" size={18} color="#000000" />
                <AppText style={styles.openStudioText} weight="extrabold">
                  Customize in 3D Studio →
                </AppText>
              </Pressable>
            </View>
          )}

          {/* ── 6. Bottom Sign Up Banner ── */}
          <View style={styles.bottomCtaBanner}>
            <AppText style={styles.bottomCtaTitle} weight="extrabold">Ready to order your physical NFC card?</AppText>
            <AppText style={styles.bottomCtaSub}>Join thousands of executives and teams sharing contacts at 60FPS.</AppText>
            <Pressable
              style={styles.createAccountBtn}
              onPress={() => {
                HapticTap.medium();
                requireAccount(undefined, { message: 'Create your free account to get started.' });
              }}
            >
              <AppText style={styles.createAccountText} weight="extrabold">Create Free Account</AppText>
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
    paddingBottom: 140, // Keeps bottom content well above the floating dock
  },
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // ── Header Bar ──
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },

  // ── Banner & Avatar ──
  bannerContainer: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111114',
  },
  bannerGradient: {
    height: 90,
    padding: 12,
    justifyContent: 'flex-start',
  },
  bannerOverlay: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bannerTag: {
    color: '#2997FF',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginTop: -28,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  avatarInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  headerActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  signInBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  signInBtnText: {
    color: '#000000',
    fontSize: 13,
  },
  nfcDemoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Profile Meta ──
  profileMeta: {
    marginTop: 14,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  verifiedBadge: {
    paddingTop: 2,
  },
  handle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: '60%',
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  tabContent: {
    paddingTop: 16,
  },

  // ── Overview Tab ──
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(41, 151, 255, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  ctaCardContent: {
    flex: 1,
    gap: 4,
  },
  ctaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(41, 151, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  ctaBadgeText: {
    color: '#2997FF',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  ctaSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
  ctaArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  linksGroup: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    gap: 12,
  },
  linkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInfo: {
    flex: 1,
    gap: 2,
  },
  linkTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  linkSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
  },

  // ── Features Tab ──
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
    gap: 6,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureName: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  featureSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
  },
  featureLock: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // ── Design Tab ──
  cardShowcase: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardMockup: {
    width: '100%',
    height: 170,
    borderRadius: 18,
    padding: 18,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  cardMockupTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 1,
  },
  cardTag: {
    color: '#2997FF',
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardMockupBottom: {
    gap: 2,
  },
  cardOwner: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  cardMat: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  materialSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  matItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  matItemActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#18181C',
  },
  matName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  matNameActive: {
    color: '#FFFFFF',
  },
  matSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
  },
  openStudioBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  openStudioText: {
    color: '#000000',
    fontSize: 14,
  },

  // ── Bottom CTA ──
  bottomCtaBanner: {
    marginTop: 28,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
  },
  bottomCtaTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  bottomCtaSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  createAccountBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#000000',
    fontSize: 14,
  },
});
