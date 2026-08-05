/**
 * GuestProfileScreen — Premium Chat OS-style guest identity page.
 *
 * Layout:
 *  1. Full-bleed Telegram gradient hero (52% screen height)
 *  2. Deep scrim + bold name + role badge overlaid at bottom
 *  3. Top bar: back + bell
 *  4. Sign In CTA pill + NFC Demo pill
 *  5. 2x2 locked feature grid
 *  6. Bottom sticky: 'Create Free Account' white pill
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
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { HapticTap } from '@/src/utils/haptics';

const { height: SCREEN_H } = Dimensions.get('window');
const HERO_H = SCREEN_H * 0.48;

// ── Telegram gradient helper ─────────────────────────────────────────────────
const TELEGRAM_GRADIENTS = [
  ['#FF512F', '#DD2476'],
  ['#4776E6', '#8E54E9'],
  ['#00B4DB', '#0083B0'],
  ['#11998E', '#38EF7D'],
  ['#FC4A1A', '#F7B733'],
  ['#8E2DE2', '#4A00E0'],
  ['#F857A6', '#FF5858'],
] as const;

function getTelegramColors(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TELEGRAM_GRADIENTS[Math.abs(hash) % TELEGRAM_GRADIENTS.length];
}

// ── Locked feature tiles ─────────────────────────────────────────────────────
const LOCKED_FEATURES: { icon: AppIconName; label: string; sub: string }[] = [
  { icon: 'QrCode', label: 'QR Code', sub: 'Personal share link' },
  { icon: 'Nfc', label: 'NFC Write', sub: 'Lock chip to profile' },
  { icon: 'Wallet', label: 'Apple Wallet', sub: 'Add to mobile wallet' },
  { icon: 'Image', label: 'Photo Upload', sub: 'Personalise your card' },
];

// ── Main component ───────────────────────────────────────────────────────────
export function GuestProfileScreen() { const [selectedTab, setSelectedTab] = React.useState<'bio' | 'card' | 'settings'>('bio');
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();

  const displayName = user?.displayName?.trim() || 'Guest Creator';
  const initial = (displayName[0] || 'G').toUpperCase();
  const gradColors = getTelegramColors(displayName);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── 1. Full-bleed Gradient Hero ── */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[gradColors[0], gradColors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          />

          {/* Scrim */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', '#000000']}
            locations={[0.25, 0.65, 1]}
            style={styles.heroScrim}
          />

          {/* Top bar */}
          <SafeAreaView style={styles.heroTopBar} edges={['top']}>
            <Pressable
              style={styles.heroIconBtn}
              onPress={() => { HapticTap.light(); router.back(); }}
              hitSlop={12}
            >
              <AppIcon name="ChevronLeft" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={styles.heroIconBtn}
              onPress={() => { HapticTap.light(); }}
              hitSlop={12}
            >
              <AppIcon name="Bell" size={20} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>

          {/* Name block at bottom of hero */}
          <View style={styles.heroNameBlock}>
            {/* Avatar circle */}
            <View style={styles.heroAvatar}>
              <AppText style={styles.heroAvatarLetter} weight="extrabold">
                {initial}
              </AppText>
            </View>
            <AppText style={styles.heroName} weight="extrabold" numberOfLines={2}>
              {displayName}
            </AppText>
            <View style={styles.guestBadge}>
              <AppIcon name="ShieldCheck" size={12} color="rgba(255,255,255,0.7)" />
              <AppText style={styles.guestBadgeText}>
                {isGuest ? 'Guest account · Preview mode' : 'Verified account'}
              </AppText>
            </View>
          </View>
        </View>

        {/* ── 2. Action Pills ── */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.pillPrimary, pressed && styles.pressed]}
            onPress={() => {
              HapticTap.medium();
              requireAccount(undefined, { message: 'Sign in to unlock your full card.' });
            }}
          >
            <AppIcon name="LogIn" size={16} color="#000000" />
            <AppText style={styles.pillPrimaryText} weight="extrabold">Sign In to Unlock</AppText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.pillSecondary, pressed && styles.pressed]}
            onPress={() => {
              HapticTap.light();
              router.push(appRoutes.nfcDemo as Href);
            }}
          >
            <AppIcon name="Nfc" size={16} color="#FFFFFF" />
            <AppText style={styles.pillSecondaryText} weight="extrabold">NFC Demo</AppText>
          </Pressable>
        </View>

        {/* ── 3. Section label ── */}
        <View style={styles.sectionRow}>
          <AppText style={styles.sectionLabel} weight="extrabold">What you unlock</AppText>
          <View style={styles.lockPill}>
            <AppIcon name="Lock" size={11} color="rgba(255,255,255,0.5)" />
            <AppText style={styles.lockPillText}>Sign in required</AppText>
          </View>
        </View>

        {/* ── 4. Locked feature 2x2 grid ── */}
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
                <AppIcon name={f.icon} size={22} color="#FFFFFF" />
              </View>
              <AppText style={styles.featureLabel} weight="extrabold">{f.label}</AppText>
              <AppText style={styles.featureSub}>{f.sub}</AppText>
              <View style={styles.featureLockBadge}>
                <AppIcon name="Lock" size={10} color="rgba(255,255,255,0.4)" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── 5. Design card preview CTA ── */}
        <Pressable
          style={({ pressed }) => [styles.designCta, pressed && styles.pressed]}
          onPress={() => { HapticTap.medium(); router.push(appRoutes.guestDesign as Href); }}
        >
          <View style={styles.designCtaLeft}>
            <AppIcon name="CreditCard" size={20} color="#FFFFFF" />
            <View>
              <AppText style={styles.designCtaTitle} weight="extrabold">Design Your Card</AppText>
              <AppText style={styles.designCtaSub}>Preview your NFC card for free</AppText>
            </View>
          </View>
          <AppIcon name="ChevronRight" size={18} color="rgba(255,255,255,0.4)" />
        </Pressable>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* ── 6. Sticky bottom CTA ── */}
      <View style={styles.stickyFooter}>
        <SafeAreaView edges={['bottom']}>
          <Pressable
            style={({ pressed }) => [styles.createAccountBtn, pressed && styles.pressed]}
            onPress={() => {
              HapticTap.medium();
              requireAccount(undefined, { message: 'Create your free account to go live.' });
            }}
          >
            <AppText style={styles.createAccountText} weight="extrabold">
              Create your free account →
            </AppText>
          </Pressable>
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
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111114',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  // ── Hero ──────────────────────────────────────────────────────
  heroWrap: {
    width: '100%',
    height: HERO_H,
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_H * 0.7,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNameBlock: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    gap: 6,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroAvatarLetter: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  heroName: {
    fontSize: 32,
    lineHeight: 38,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  guestBadgeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── Action pills ─────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  pillPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 50,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  pillPrimaryText: {
    color: '#000000',
    fontSize: 14,
  },
  pillSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillSecondaryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  // ── Section row ──────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  lockPillText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },

  // ── Feature grid ─────────────────────────────────────────────
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  featureTile: {
    width: '47%',
    backgroundColor: '#111114',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    gap: 6,
    minHeight: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    lineHeight: 14,
  },
  featureLockBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
  },

  // ── Design CTA ───────────────────────────────────────────────
  designCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    backgroundColor: '#111114',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  designCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  designCtaTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  designCtaSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },

  // ── Sticky footer ────────────────────────────────────────────
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
    height: 54,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountText: {
    color: '#000000',
    fontSize: 16,
  },
});
