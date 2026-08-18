import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  InteractionManager,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { HapticTap } from '@/src/utils/haptics';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { appRoutes } from '@/src/constants/navigation';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useOrders } from '@/src/hooks/useOrders';
import {
  getCustomerInsights,
  type CustomerInsights,
} from '@/src/services/customerInsightsService';
import {
  loadCustomerCloudCard,
  loadGuestCloudCard,
} from '@/src/services/guestCardDraftService';
import { useBioPage } from '@/src/hooks/useBioPage';
import type { Order } from '@/src/types/models';
import { FAB } from '@/src/components/FAB';
import { QuickActionModal } from '@/src/components/QuickActionModal';
import { NfcBeamModal } from '@/src/components/NfcBeamModal';
import { LiveActivityRadar } from '@/src/components/LiveActivityRadar';
import { computeUserPrestige } from '@/src/services/prestigeTierService';
import { pageThemes } from '@/src/constants/pageThemes';

// ─── Telegram-style Avatar Gradient helper ──────────────────────────────────
const TELEGRAM_GRADIENTS = [
  ['#FF512F', '#DD2476'], // Sunset Pink/Orange
  ['#4776E6', '#8E54E9'], // Purple Violet
  ['#00B4DB', '#0083B0'], // Ocean Cyan
  ['#11998E', '#38EF7D'], // Emerald Green
  ['#FC4A1A', '#F7B733'], // Bright Amber
  ['#8E2DE2', '#4A00E0'], // Deep Royal Purple
  ['#F857A6', '#FF5858'], // Rose Coral
] as const;

function getTelegramColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TELEGRAM_GRADIENTS[Math.abs(hash) % TELEGRAM_GRADIENTS.length];
}
const HOME_THEME = pageThemes.home;
const INK = HOME_THEME.text;
const MUTED = HOME_THEME.muted;
const SURFACE = HOME_THEME.surface;
const SURFACE_BORDER = HOME_THEME.border;
const BG = HOME_THEME.canvas;

const SPACING = {
  xs: 6,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  section: 40,
};

// ─── Quick actions ───────────────────────────────────────────────────────────
const ACTIONS = [
  {
    label: 'Sample Moments',
    subtitle: 'Preview captured leads',
    route: appRoutes.customerConnections as Href,
    icon: 'Users' as AppIconName,
    bg: '#E2F16D', // Lime Yellow
    color: '#000000',
    image: require('@/assets/images/3d_share_card_v2.png'),
  },
  {
    label: 'NFC Demo',
    subtitle: 'Try tap-to-open',
    route: appRoutes.nfcDemo as Href,
    icon: 'Nfc' as AppIconName,
    bg: '#E57A65', // Terracotta
    color: '#FFFFFF',
    image: require('@/assets/images/3d_signals_v2.png'),
  },
  {
    label: 'Track order',
    subtitle: 'Follow production',
    route: appRoutes.guestTrackOrder as Href,
    icon: 'Truck' as AppIconName,
    bg: '#2563EB', // Sapphire Blue
    color: '#FFFFFF',
    image: require('@/assets/images/3d_track_card_v2.png'),
  },
  {
    label: 'New order',
    subtitle: 'Choose a card design',
    route: appRoutes.customer.templates as Href,
    icon: 'Plus' as AppIconName,
    bg: '#FF5733', // Coral Red
    color: '#FFFFFF',
    image: require('@/assets/images/3d_create_card_v2.png'),
  },
];

const TRUST_POINTS = [
  { label: 'Public profile', icon: 'UserRound' as AppIconName },
  { label: 'NFC card order', icon: 'CreditCard' as AppIconName },
  { label: 'Lead moments', icon: 'Users' as AppIconName },
];

// ─── Order status ────────────────────────────────────────────────────────────
function orderStatus(s: string): { label: string; color: string } {
  if (
    [
      'production_approved',
      'printer_assigned',
      'printing',
      'nfc_writing',
      'nfc_verification',
      'qa_pending',
      'qa_failed',
    ].includes(s)
  )
    return { label: 'In Production', color: '#F59E0B' };
  if (['shipped', 'ready_to_ship'].includes(s))
    return { label: 'Shipped', color: '#10B981' };
  if (s === 'delivered') return { label: 'Delivered', color: '#0A84FF' };
  return { label: 'Processing', color: '#FFFFFF' };
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────
const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonText}>
      <View style={[styles.skeletonLine, { width: '60%' }]} />
      <View style={[styles.skeletonLine, { width: '80%' }]} />
      <View style={[styles.skeletonLine, { width: '50%' }]} />
    </View>
    <View style={styles.skeletonCard} />
  </View>
);

// ─── Error State ───────────────────────────────────────────────────────────
const ErrorBanner = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <View style={styles.errorBanner}>
    <AppText variant="caption" weight="medium" style={{ color: '#FF453A' }}>
      {message}
    </AppText>
    <Pressable onPress={onRetry} style={{ padding: 4 }}>
      <AppText
        variant="caption"
        weight="bold"
        style={{ color: '#FFFFFF', textDecorationLine: 'underline' }}
      >
        Retry
      </AppText>
    </Pressable>
  </View>
);

// ─── Order Row Component ───────────────────────────────────────────────────
function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const st = orderStatus(order.status);
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '';
  const amt = order.amount != null ? `$${order.amount.toFixed(0)}` : 'N/A';

  return (
    <Pressable
      onPress={() => {
        HapticTap.light();
        onPress();
      }}
      style={({ pressed }) => [
        pressed && { backgroundColor: 'rgba(255,255,255,0.03)' },
      ]}
      hitSlop={12}
    >
      <View style={styles.orderRow}>
        <View style={styles.orderIcon}>
          <AppIcon name="CreditCard" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.orderInfo}>
          <AppText variant="body" weight="semibold" style={{ color: INK }}>
            {order.customerName || 'NFC Card'}
          </AppText>
          <AppText variant="caption" style={{ color: MUTED }}>
            {order.quantity ?? 1} x {order.cardDesign?.replace(/_/g, ' ')}
          </AppText>
        </View>
        <View style={styles.orderMeta}>
          <View
            style={[
              styles.orderBadge,
              { backgroundColor: 'rgba(255,255,255,0.08)' },
            ]}
          >
            <AppText
              variant="caption"
              weight="medium"
              style={{ color: st.color }}
            >
              {st.label}
            </AppText>
          </View>
          <AppText variant="bodySmall" weight="bold" style={{ color: INK }}>
            {amt}
          </AppText>
          <AppText variant="caption" style={{ color: MUTED }}>
            {date}
          </AppText>
        </View>
        <AppIcon name="ChevronRight" size={15} color={MUTED} />
      </View>
    </Pressable>
  );
}

// ─── Stats Card Component (Bento style) ────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  style,
}: {
  label: string;
  value: string;
  icon: AppIconName;
  style?: any;
}) {
  return (
    <View style={[styles.statCard, style]}>
      <AppIcon name={icon} size={15} color="rgba(255,255,255,0.5)" />
      <AppText variant="title1" weight="extrabold" style={{ color: INK }}>
        {value}
      </AppText>
      <AppText style={styles.statLabel} weight="bold">
        {label}
      </AppText>
    </View>
  );
}

// ─── Main HomeScreen Component ─────────────────────────────────────────────
export function GuestHomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { bioPage } = useBioPage(user?.id ?? '');

  const [error, setError] = useState<string | null>(null);
  const { unreadCount, items } = useNotifications();
  const { orders } = useOrders(user?.role ?? 'guest', user?.id ?? '');
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [cloudCard, setCloudCard] =
    useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSent, setWaitlistSent] = useState(false);
  const [showBeamModal, setShowBeamModal] = useState(false);

  const cardWidth = Math.min(screenWidth - 40, 380);

  // NFC Live pulse animation — 60fps native driver
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseOpacity]);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      // Retry guest session migration in background if user is logged in but guest session is still active
      if (!isGuest && user) {
        try {
          const { finalizeGuestAccountUpgrade } = await import('@/src/utils/guestAccountUpgrade');
          await finalizeGuestAccountUpgrade(user);
        } catch (err) {
          console.warn('GuestHomeScreen: Background guest upgrade retry failed:', err);
        }
      }

      let loadedCard: Awaited<ReturnType<typeof loadCustomerCloudCard>> = null;
      try {
        loadedCard = isGuest
          ? await loadGuestCloudCard()
          : await loadCustomerCloudCard(user?.id ?? '');
      } catch (err) {
        console.warn('GuestHomeScreen: Failed to load cloud card:', err);
      }
      setCloudCard(loadedCard);

      let computedInsights: CustomerInsights | null = null;
      try {
        computedInsights = await getCustomerInsights(user?.id ?? '');
      } catch (err) {
        console.warn('GuestHomeScreen: Failed to load customer insights:', err);
      }
      setInsights(computedInsights);
    } catch (err) {
      console.error('GuestHomeScreen: loadData error:', err);
      setError('Could not load card insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, user?.id]);

  useEffect(() => {
    // Render the screen first, then load cloud data after animations settle
    const task = InteractionManager.runAfterInteractions(() => {
      void loadData();
    });
    return () => task.cancel();
  }, [loadData]);

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);

  const heroName =
    bioPage?.displayName || user?.displayName || (isGuest ? 'Guest Draft' : '');
  const heroTitle =
    bioPage?.headline || (isGuest ? 'Customize this design' : '');
  const heroPhone = '';
  const heroEmail = bioPage?.email || user?.email || '';

  const handleShare = () => {
    if (isGuest) {
      requireAccount(undefined, { message: 'Sign in to share your card.' });
    } else {
      router.push('/(tabs)/profile');
    }
  };

  // ── Profile Completion Score ──────────────────────────────────────
  const profileSteps = useMemo(() => [
    { label: 'Add your name', done: !!(bioPage?.displayName || heroName) },
    { label: 'Add a photo', done: !!bioPage?.photoUrl },
    { label: 'Add your title', done: !!(bioPage?.tagline || bioPage?.headline) },
    { label: 'Add email or WhatsApp', done: !!(bioPage?.email || bioPage?.whatsapp) },
    { label: 'Share your card', done: !!(bioPage?.taps && bioPage.taps > 0) },
  ], [bioPage, heroName]);

  const profileScore = useMemo(() => {
    const done = profileSteps.filter((s) => s.done).length;
    return Math.round((done / profileSteps.length) * 100);
  }, [profileSteps]);

  const nextStep = useMemo(() => profileSteps.find((s) => !s.done), [profileSteps]);
  const profileComplete = profileScore === 100;

  // ── Executive Prestige Tier Stats ──────────────────────────────────
  const prestigeStats = useMemo(() => {
    const totalCount = (bioPage?.taps || 0) + (insights?.totalOrders || 0);
    return computeUserPrestige(totalCount);
  }, [bioPage?.taps, insights?.totalOrders]);

  return (
    <View style={styles.root}>
      {/* Low opacity ambient brand collage background */}
      <View style={styles.homeBackdropWrap} pointerEvents="none">
        <Image
          source={require('@/assets/images/savee_background.png')}
          style={styles.homeBackdropImg}
          resizeMode="cover"
        />
        <View style={styles.homeBackdropOverlay} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top']}>
        <IosScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <SkeletonLoader />
          ) : error ? (
            <ErrorBanner message={error} onRetry={() => setIsLoading(true)} />
          ) : (
            <>
              {/* ── 1. Executive Top Header ── */}
              <View style={styles.topGreetingRow}>
                <Pressable
                  onPress={() => { HapticTap.light(); router.push('/profile' as any); }}
                  style={styles.greetingLeft}
                >
                  {bioPage?.photoUrl ? (
                    <Image source={{ uri: bioPage.photoUrl }} style={styles.greetingAvatarImg} />
                  ) : (
                    <View style={styles.executiveAvatarSeal}>
                      <AppText style={styles.executiveAvatarLetter} weight="extrabold">
                        {(heroName?.[0] || 'A').toUpperCase()}
                      </AppText>
                    </View>
                  )}
                  <View style={styles.executiveTitles}>
                    <View style={styles.prestigePill}>
                      <AppText style={styles.prestigePillText} weight="bold">
                        {prestigeStats.currentTier.badge} {prestigeStats.currentTier.name.toUpperCase()}
                      </AppText>
                    </View>
                    <AppText style={styles.greetingName} weight="extrabold">
                      {heroName || 'Executive Member'}
                    </AppText>
                  </View>
                </Pressable>

                <View style={styles.headerRightActions}>
                  <Pressable
                    onPress={() => { HapticTap.light(); router.push('/scan' as any); }}
                    style={styles.notifBtn}
                    hitSlop={8}
                  >
                    <AppIcon name="Scan" size={18} color="#FFFFFF" />
                  </Pressable>
                  <Pressable
                    onPress={() => { HapticTap.light(); router.push(appRoutes.guestDesign as Href); }}
                    style={styles.notifBtn}
                    hitSlop={8}
                  >
                    <AppIcon name="Bell" size={18} color="#FFFFFF" />
                    {unreadCount > 0 && <View style={styles.notifDot} />}
                  </Pressable>
                </View>
              </View>

              {/* ── 2. NFC Smart Card Hero ── */}
              <View style={styles.cardContainer}>
                <FlippableNfcCard
                  fullName={heroName || undefined}
                  title={heroTitle || undefined}
                  phone={heroPhone || undefined}
                  email={heroEmail || undefined}
                  gradientIndex={cloudCard?.design?.gradientIndex ?? 0}
                  width={cardWidth}
                  cardId={cloudCard?.cardId ?? 'BC-NFC_JEWDVONG'}
                />
                <AppText style={styles.subtleFlipHint}>Tap to flip card</AppText>
              </View>

              {/* ── 3. Profile Completion Bar (hidden when 100%) ── */}
              {!profileComplete && !isGuest && (
                <Pressable
                  onPress={() => { HapticTap.light(); router.push('/edit-bio' as any); }}
                  style={({ pressed }) => [styles.completionCard, pressed && styles.pressed]}
                >
                  <View style={styles.completionHeader}>
                    <AppText style={styles.completionTitle} weight="extrabold">
                      Complete your profile
                    </AppText>
                    <AppText style={styles.completionScore} weight="extrabold">
                      {profileScore}%
                    </AppText>
                  </View>
                  <View style={styles.completionTrack}>
                    <View style={[styles.completionFill, { width: `${profileScore}%` as any }]} />
                  </View>
                  {nextStep && (
                    <View style={styles.completionNextRow}>
                      <AppIcon name="ArrowRight" size={12} color="rgba(255,255,255,0.5)" />
                      <AppText style={styles.completionNextText} weight="bold">
                        Next: {nextStep.label}
                      </AppText>
                    </View>
                  )}
                </Pressable>
              )}

              {/* ── 4. Primary Executive CTA: Share Card & Beam ── */}
              <Pressable
                onPress={() => {
                  HapticTap.medium();
                  setShowBeamModal(true);
                }}
                style={({ pressed }) => [styles.refinedShareBtn, pressed && styles.pressed]}
              >
                <AppIcon name="Nfc" size={18} color="#000000" />
                <AppText style={styles.refinedShareText} weight="extrabold">
                  NFC Beam & Share Card
                </AppText>
              </Pressable>

              {/* ── 4. Executive Command Trio (Quiet & Refined) ── */}
              <View style={styles.secondaryActionRow}>
                <Pressable
                  onPress={() => { HapticTap.medium(); router.push('/profile' as any); }}
                  style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
                >
                  <AppIcon name="User" size={14} color="rgba(255,255,255,0.8)" />
                  <AppText style={styles.secondaryActionText} weight="bold">Executive Bio</AppText>
                </Pressable>
                <Pressable
                  onPress={() => { HapticTap.medium(); router.push(appRoutes.guestDesign as Href); }}
                  style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
                >
                  <AppIcon name="Sparkles" size={14} color="rgba(255,255,255,0.8)" />
                  <AppText style={styles.secondaryActionText} weight="bold">Card Studio</AppText>
                </Pressable>
                <Pressable
                  onPress={() => { HapticTap.medium(); router.push('/connections' as any); }}
                  style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
                >
                  <AppIcon name="Users" size={14} color="rgba(255,255,255,0.8)" />
                  <AppText style={styles.secondaryActionText} weight="bold">CRM Leads</AppText>
                </Pressable>
              </View>

              {/* ── Divider ── */}
              <View style={styles.hairlineDivider} />

              {/* ── 5. Live Activity Radar Feed (Active Networking Pulse) ── */}
              <LiveActivityRadar
                totalTaps={bioPage?.taps ?? 0}
                totalViews={bioPage?.views ?? 0}
                onPressItem={() => {
                  router.push('/connections' as any);
                }}
              />

              {/* ── 6. Executive Presence & Analytics Intelligence ── */}
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <AppText style={styles.infoTitle} weight="extrabold">Executive Presence & Intelligence</AppText>
                  <AppText style={styles.infoCardCode}>Active Smart Pass · {cloudCard?.cardId ?? 'BC-NFC_JEWDVONG'}</AppText>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <AppText style={styles.metricValue} weight="extrabold">
                      {bioPage?.taps ?? 0}
                    </AppText>
                    <AppText style={styles.metricLabel}>NFC Taps</AppText>
                  </View>

                  <View style={styles.metricItem}>
                    <AppText style={styles.metricValue} weight="extrabold">
                      {bioPage?.views ?? 0}
                    </AppText>
                    <AppText style={styles.metricLabel}>Bio Views</AppText>
                  </View>

                  <View style={styles.metricItem}>
                    <AppText style={styles.metricValue} weight="extrabold">
                      {insights?.totalOrders ?? 0}
                    </AppText>
                    <AppText style={styles.metricLabel}>Orders</AppText>
                  </View>
                </View>
              </View>

              {/* ── Divider ── */}
              <View style={styles.hairlineDivider} />

              {/* ── 6. Bespoke Hardware Concierge ── */}
              <Pressable
                onPress={() => {
                  HapticTap.medium();
                  setShowWaitlist(true);
                }}
                style={({ pressed }) => [styles.commerceRow, pressed && styles.pressed]}
              >
                <View style={styles.commerceLeft}>
                  <AppText style={styles.commerceTitle} weight="extrabold">Bespoke Metal NFC Card</AppText>
                  <AppText style={styles.commerceSub}>Laser-Engraved Titanium · 24K Gold · Limited</AppText>
                </View>
                <View style={styles.commerceRight}>
                  <AppText style={styles.commerceLink} weight="bold">Join Waitlist →</AppText>
                </View>
              </Pressable>

              {/* ── 7. Pro Upgrade Nudge ── */}
              <Pressable
                onPress={() => {
                  HapticTap.medium();
                  router.push('/pricing' as any);
                }}
                style={({ pressed }) => [styles.proNudgeCard, pressed && styles.pressed]}
              >
                <View style={styles.proNudgeBadge}>
                  <AppText style={styles.proNudgeBadgeText} weight="extrabold">PRO</AppText>
                </View>
                <View style={styles.proNudgeContent}>
                  <AppText style={styles.proNudgeTitle} weight="extrabold">
                    Unlock your full identity
                  </AppText>
                  <View style={styles.proFeatureList}>
                    {[
                      'Unlimited bio links & social channels',
                      'Analytics: views, taps & saves',
                      'Custom domain  (you.com)',
                      'Priority card production',
                    ].map((f) => (
                      <View key={f} style={styles.proFeatureRow}>
                        <AppIcon name="Check" size={12} color="#000000" />
                        <AppText style={styles.proFeatureText} weight="bold">{f}</AppText>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.proNudgeArrow}>
                  <AppIcon name="ChevronRight" size={16} color="#000000" />
                </View>
              </Pressable>

              {/* ── 8. Viral Referral Invite (Free Pro Incentive) ── */}
              <Pressable
                onPress={async () => {
                  HapticTap.medium();
                  const slug = bioPage?.slug || 'join';
                  const shareUrl = `https://aviobrand.com/?ref=${encodeURIComponent(slug)}`;
                  try {
                    await Share.share({
                      message: `Get your own executive AVIO Smart Pass NFC business card for free! Use my invite link: ${shareUrl}`,
                      url: shareUrl,
                      title: 'Invite to AVIO Smart Pass',
                    });
                  } catch {
                    // ignore
                  }
                }}
                style={({ pressed }) => [styles.referralCard, pressed && styles.pressed]}
              >
                <View style={styles.referralIconBox}>
                  <AppIcon name="Gift" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.referralContent}>
                  <AppText style={styles.referralTitle} weight="extrabold">
                    Give Free Card, Get 1 Mo Pro
                  </AppText>
                  <AppText style={styles.referralSub}>
                    Share your invite link with a colleague or friend.
                  </AppText>
                </View>
                <View style={styles.referralShareBtn}>
                  <AppText style={styles.referralShareBtnText} weight="bold">Invite →</AppText>
                </View>
              </Pressable>
            </>

          )}
        </IosScrollView>
      </SafeAreaView>

      {/* FAB and Overlay Modal */}
      <FAB
        onPress={() => {
          HapticTap.medium();
          setFabOpen(true);
        }}
      />
      <QuickActionModal visible={fabOpen} onClose={() => setFabOpen(false)} />

      {/* ── Physical Card Waitlist Modal ── */}
      <Modal visible={showWaitlist} animationType="slide" transparent>
        <Pressable style={styles.waitlistOverlay} onPress={() => setShowWaitlist(false)}>
          <Pressable style={styles.waitlistCard} onPress={() => {}}>
            <View style={styles.waitlistHandle} />
            <View style={styles.waitlistIconSeal}>
              <AppIcon name="CreditCard" size={22} color="#FFFFFF" />
            </View>
            <AppText style={styles.waitlistTitle} weight="extrabold">
              Bespoke Metal NFC Card
            </AppText>
            <AppText style={styles.waitlistSub}>
              Laser-engraved titanium or 24K gold plated. Limited production runs. Drop your email and we will notify you first.
            </AppText>
            {!waitlistSent ? (
              <>
                <TextInput
                  style={styles.waitlistInput}
                  value={waitlistEmail}
                  onChangeText={setWaitlistEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  style={({ pressed }) => [styles.waitlistBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    if (!waitlistEmail.includes('@')) return;
                    HapticTap.heavy();
                    // Store in Firestore waitlist collection
                    import('@/src/services/firebaseClient').then(({ db }) => {
                      import('firebase/firestore').then(({ collection, addDoc, serverTimestamp }) => {
                        addDoc(collection(db, 'metal_card_waitlist'), {
                          email: waitlistEmail.trim().toLowerCase(),
                          userId: user?.id ?? 'guest',
                          name: heroName ?? '',
                          createdAt: serverTimestamp(),
                        }).catch(() => undefined);
                      });
                    });
                    setWaitlistSent(true);
                  }}
                >
                  <AppText style={styles.waitlistBtnText} weight="extrabold">
                    Reserve My Spot
                  </AppText>
                </Pressable>
              </>
            ) : (
              <View style={styles.waitlistSuccess}>
                <AppIcon name="Check" size={20} color="#FFFFFF" />
                <AppText style={styles.waitlistSuccessText} weight="bold">
                  You're on the list! We'll be in touch.
                </AppText>
              </View>
            )}
            <Pressable onPress={() => { setShowWaitlist(false); setWaitlistSent(false); }} style={styles.waitlistClose} hitSlop={12}>
              <AppText style={styles.waitlistCloseText} weight="bold">Close</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Immersive Fullscreen NFC Beam Mode ── */}
      <NfcBeamModal
        visible={showBeamModal}
        onClose={() => setShowBeamModal(false)}
        fullName={heroName || 'Alexander Wright'}
        title={heroTitle || 'Founder & CEO · AVIO'}
        cardId={cloudCard?.cardId ?? 'BC-NFC_JEWDVONG'}
        url={
          bioPage?.slug
            ? `https://aviobrand.com/u/${bioPage.slug}`
            : 'https://aviobrand.com/u/demo'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  homeBackdropWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
  },
  homeBackdropImg: {
    width: '100%',
    height: '100%',
    opacity: 0.06,
  },
  homeBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
    paddingBottom: 130, // Clearance for floating capsule dock
    gap: 14,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  topGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  executiveAvatarSeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  executiveAvatarLetter: {
    color: '#000000',
    fontSize: 18,
  },
  executiveTitles: {
    gap: 1,
  },
  executiveEyebrow: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  prestigePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  prestigePillText: {
    color: '#E5E5EA',
    fontSize: 9,
    letterSpacing: 1,
  },
  greetingAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  greetingName: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#000000',
  },

  // ── Refined Unboxed Elements ──
  subtleFlipHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 8,
  },
  refinedShareBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  refinedShareText: {
    color: '#000000',
    fontSize: 15,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  infoSection: {
    gap: 12,
    paddingHorizontal: 4,
  },
  infoHeader: {
    gap: 2,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  infoCardCode: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 48,
    marginTop: 2,
  },
  metricItem: {
    gap: 2,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  commerceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  commerceLeft: {
    gap: 2,
  },
  commerceTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  commerceSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  commerceRight: {},
  commerceLink: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
  },
  // ── Stats row ─────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 26,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  // ── Primary CTA row ───────────────────────────────────────────
  primaryCtaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  ctaShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  ctaShareText: {
    color: '#000000',
    fontSize: 15,
  },
  ctaDesign: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ctaDesignText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  // ── Section title ─────────────────────────────────────────────
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
  },
  // ── Quick 2×2 grid ────────────────────────────────────────────
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickCard: {
    width: '47%',
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
    justifyContent: 'flex-end',
    gap: 4,
  },
  quickCardIcon: {
    marginBottom: 6,
  },
  quickCardLabel: {
    fontSize: 14,
  },
  quickCardSub: {
    fontSize: 11,
    lineHeight: 14,
  },
  primaryPillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  myCardPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myCardPillText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  viewProfilePill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfilePillText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  profileDetailsQrCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  detailsCopyWrap: {
    flex: 1,
    gap: 3,
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    textTransform: 'uppercase',
  },
  detailsName: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  detailsSub: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 16,
  },
  detailsQrWrap: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  bentoGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bentoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  orderHardwareBento: {
    width: '100%',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderHardwareLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nfcIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderHardwareTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  laserPill: {
    backgroundColor: 'rgba(0, 102, 255, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  laserPillText: {
    fontSize: 9,
    color: '#2997FF',
    letterSpacing: 0.5,
  },
  orderHardwareSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    lineHeight: 16,
  },
  fbAvatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fbAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarNoBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
  },
  inboxBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  neonBadgePill: {
    backgroundColor: '#30D158',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neonBadgeNum: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  headerIconNoBg: {
    width: 38,
    height: 38,
    borderRadius: 0,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  launchHero: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(17, 17, 20, 0.92)',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  launchEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30D158',
  },
  launchEyebrow: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  launchTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  launchSub: {
    color: '#A1A1AA',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  launchCtaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  launchPrimary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  launchPrimaryText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '900',
  },
  launchSecondary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  launchSecondaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustPill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.22)',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustPillText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '800',
  },
  cardContainer: {
    marginVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardElevation: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#111111',
  },
  oceanShareCard: {
    backgroundColor: '#111114',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  oceanShareIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0,
  },
  shareTitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  actionScrollView: {
    marginHorizontal: -SPACING.base,
    marginBottom: SPACING.xs,
  },
  actionScroll: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
  },
  actionCard: {
    width: 200,
    height: 96,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    backgroundColor: SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  actionTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  actionIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionImageWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionImage: {
    width: 48,
    height: 48,
  },
  ordersSection: {
    marginVertical: 4,
  },
  ordersCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    paddingVertical: 0,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SURFACE_BORDER,
  },
  orderIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: 2,
    marginRight: 4,
  },
  orderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    borderRadius: 16,
    marginVertical: 8,
  },
  guestBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerCopy: {
    flex: 1,
    gap: 2,
  },
  skeletonContainer: {
    padding: SPACING.base,
    gap: 16,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SURFACE,
  },
  skeletonText: {
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: SURFACE,
  },
  skeletonCard: {
    height: 200,
    backgroundColor: SURFACE,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderColor: 'rgba(255, 69, 58, 0.25)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatOsHeader: {
    gap: 12,
    marginBottom: 16,
  },
  searchBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E22',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchBarText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  tagScroll: {
    flexDirection: 'row',
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  tagPillActive: {
    backgroundColor: '#FFFFFF',
  },
  tagPillText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  tagPillActiveText: {
    color: '#000000',
  },
  chatOsGrid: {
    gap: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  chatOsCard: {
    backgroundColor: '#111114',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    height: 240,
    position: 'relative',
  },
  chatOsCardVisual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070708',
  },
  chatOsSphere: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  chatOsCardFooter: {
    padding: 16,
    backgroundColor: '#111114',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  chatOsCardName: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  chatOsCardRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    zIndex: 999,
  },
  floatingActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    height: 48,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingActionText: {
    color: '#000000',
    fontSize: 14,
  },
  floatingActionPlus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingActionPlusText: {
    color: '#FFFFFF',
    fontSize: 18,
  },

  // NFC Live pulse badge
  liveBadgeWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Profile Completion Bar ──
  completionCard: {
    borderRadius: 14,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 10,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  completionScore: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  completionTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  completionFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  completionNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionNextText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },

  cardHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cardHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: -0.2,
  },

  // Wide Primary Share Card Button
  widePrimaryShareBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  widePrimaryShareText: {
    color: '#000000',
    fontSize: 16,
    letterSpacing: -0.2,
  },

  // Secondary CTA buttons
  ctaSecondaryBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaSecondaryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  // ── Waitlist Modal ──
  waitlistOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  waitlistCard: {
    backgroundColor: '#111114',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    gap: 14,
    paddingBottom: 40,
  },
  waitlistHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  waitlistIconSeal: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitlistTitle: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  waitlistSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 14,
    lineHeight: 20,
  },
  waitlistInput: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'System',
  },
  waitlistBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitlistBtnText: {
    color: '#000000',
    fontSize: 15,
  },
  waitlistSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  waitlistSuccessText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  waitlistClose: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  waitlistCloseText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },

  // ── Pro Upgrade Nudge ──
  proNudgeCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  proNudgeBadge: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  proNudgeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  proNudgeContent: {
    flex: 1,
    gap: 8,
  },
  proNudgeTitle: {
    color: '#000000',
    fontSize: 15,
  },
  proFeatureList: {
    gap: 4,
  },
  proFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proFeatureText: {
    color: 'rgba(0, 0, 0, 0.65)',
    fontSize: 12,
    flex: 1,
  },
  proNudgeArrow: {
    alignSelf: 'center',
    opacity: 0.4,
  },

  // ── Viral Referral Card ──
  referralCard: {
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referralIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralContent: {
    flex: 1,
    gap: 2,
  },
  referralTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  referralSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  referralShareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  referralShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});


