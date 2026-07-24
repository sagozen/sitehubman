import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { HapticTap } from '@/src/utils/haptics';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
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
    image: require('@/assets/images/3d_share_card_v2.png'),
  },
  {
    label: 'NFC Demo',
    subtitle: 'Try tap-to-open',
    route: appRoutes.nfcDemo as Href,
    icon: 'Nfc' as AppIconName,
    image: require('@/assets/images/3d_signals_v2.png'),
  },
  {
    label: 'Track order',
    subtitle: 'Follow production',
    route: appRoutes.guestTrackOrder as Href,
    icon: 'Truck' as AppIconName,
    image: require('@/assets/images/3d_track_card_v2.png'),
  },
  {
    label: 'New order',
    subtitle: 'Choose a card design',
    route: appRoutes.customer.templates as Href,
    icon: 'Plus' as AppIconName,
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
      <View style={styles.statCardHeader}>
        <AppText variant="title1" weight="extrabold" style={{ color: INK }}>
          {value}
        </AppText>
        <View style={styles.statCardIconWrap}>
          <AppIcon name={icon} size={15} color="#FFFFFF" variant="solar-bold" />
        </View>
      </View>
      <AppText style={styles.statCardLabel} weight="bold">
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

  const cardWidth = Math.min(screenWidth - 40, 380);

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
    void loadData();
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
              {/* ── 1. Top Header Row: Hello, Name + (+ Add) ── */}
              <View style={styles.topGreetingRow}>
                <Pressable
                  onPress={() => {
                    HapticTap.light();
                    router.push('/profile' as any);
                  }}
                  style={styles.greetingLeft}
                >
                  {bioPage?.photoUrl ? (
                    <Image
                      source={{ uri: bioPage.photoUrl }}
                      style={styles.greetingAvatarImg}
                    />
                  ) : (
                    <LinearGradient
                      colors={getTelegramColors(heroName || 'Creator')}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.greetingAvatarCircle}
                    >
                      <AppText style={styles.greetingAvatarLetter} weight="extrabold">
                        {(heroName?.[0] || 'C').toUpperCase()}
                      </AppText>
                    </LinearGradient>
                  )}
                  <View>
                    <AppText style={styles.greetingSub}>Hello,</AppText>
                    <AppText style={styles.greetingName} weight="extrabold">
                      {heroName?.split(' ')[0] || 'Creator'}
                    </AppText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    HapticTap.medium();
                    router.push(appRoutes.guestDesign as Href);
                  }}
                  style={({ pressed }) => [
                    styles.addPillBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.addPillText} weight="bold">+ Add</AppText>
                </Pressable>
              </View>

              {/* ── 2. NFC Card Hero Preview ── */}
              <View style={styles.cardContainer}>
                <View style={[styles.cardElevation, { width: cardWidth }]}>
                  <NfcGlobalCardFace
                    fullName={heroName || undefined}
                    title={heroTitle || undefined}
                    phone={heroPhone || undefined}
                    email={heroEmail || undefined}
                    gradientIndex={cloudCard?.design?.gradientIndex ?? 0}
                    width={cardWidth}
                  />
                </View>
              </View>

              {/* ── 3. Primary Action Row (My Card & View Profile) ── */}
              <View style={styles.primaryPillRow}>
                <Pressable
                  onPress={() => {
                    HapticTap.medium();
                    router.push(appRoutes.guestDesign as Href);
                  }}
                  style={({ pressed }) => [
                    styles.myCardPill,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.myCardPillText} weight="black">
                    My Card
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    HapticTap.light();
                    if (bioPage?.slug) {
                      router.push(`/public/${bioPage.slug}` as Href);
                    } else {
                      router.push(appRoutes.studio as Href);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.viewProfilePill,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.viewProfilePillText} weight="bold">
                    View Profile
                  </AppText>
                </Pressable>
              </View>

              {/* ── 4. Profile Details + QR Code Module ── */}
              <View style={styles.profileDetailsQrCard}>
                <View style={styles.detailsCopyWrap}>
                  <AppText style={styles.detailsLabel}>Profile details</AppText>
                  <AppText style={styles.detailsName} weight="bold" numberOfLines={1}>
                    {heroName || 'Creator'}
                  </AppText>
                  <AppText style={styles.detailsSub} numberOfLines={2}>
                    {heroTitle || 'Digital identity card optimized for contactless share.'}
                  </AppText>
                </View>

                <View style={styles.detailsQrWrap}>
                  <QRCode
                    value={bioPage?.slug ? `https://sitehub.app/public/${bioPage.slug}` : 'https://sitehub.app'}
                    size={58}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                    quietZone={2}
                  />
                </View>
              </View>



              {/* Quick Actions Scroll (Landscape Bento Layout) */}
              <View style={{ marginTop: 4 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.actionScrollView}
                  contentContainerStyle={styles.actionScroll}
                >
                  {ACTIONS.map((a) => (
                    <Pressable
                      key={a.label}
                      onPress={() => {
                        HapticTap.light();
                        if (isGuest && a.label === 'Sample Moments') {
                          requireAccount(undefined, {
                            message: 'Sign in to see moments capture.',
                          });
                        } else {
                          router.push(a.route);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.actionCard,
                        pressed && styles.actionCardPressed,
                      ]}
                    >
                      <View style={styles.actionTextWrap}>
                        <View style={styles.actionCardHeader}>
                          <AppText
                            variant="bodySmall"
                            weight="bold"
                            style={{ color: INK }}
                          >
                            {a.label}
                          </AppText>
                        </View>
                        <AppText variant="caption" style={{ color: MUTED }}>
                          {a.subtitle}
                        </AppText>
                      </View>
                      <View style={styles.actionImageWrap}>
                        {a.image ? (
                          <Image
                            source={a.image}
                            style={styles.actionImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.actionIconContainer}>
                            <AppIcon name={a.icon} size={15} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>



              {/* Recent Orders */}
              {!isGuest && recentOrders.length > 0 ? (
                <View style={styles.ordersSection}>
                  <View style={styles.sectionHeader}>
                    <AppText
                      variant="title3"
                      weight="bold"
                      style={{ color: INK }}
                    >
                      Recent Orders
                    </AppText>
                    <Pressable
                      onPress={() =>
                        router.push(appRoutes.guestTrackOrder as Href)
                      }
                    >
                      <AppText
                        variant="caption"
                        weight="bold"
                        style={{ color: '#FFFFFF' }}
                      >
                        View All
                      </AppText>
                    </Pressable>
                  </View>
                  <View style={styles.ordersCard}>
                    {recentOrders.map((o) => (
                      <OrderRow
                        key={o.id}
                        order={o}
                        onPress={() =>
                          router.push(`/orders/detail/${o.id}` as Href)
                        }
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Guest Local Draft Banner */}
              {isGuest ? (
                <View style={styles.guestBanner}>
                  <View style={styles.guestBannerIcon}>
                    <AppIcon name="ShieldCheck" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.guestBannerCopy}>
                    <AppText variant="bodySmall" weight="bold" style={{ color: INK }}>
                      Your card is saved. Sign in to claim it.
                    </AppText>
                  </View>
                </View>
              ) : null}
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
    paddingBottom: 80,
    gap: SPACING.base,
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
  greetingAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E22',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  greetingAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  greetingSub: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  greetingName: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
  },
  addPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addPillText: {
    color: '#FFFFFF',
    fontSize: 13,
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
  statsSection: {
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'space-between',
    minHeight: 80,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  statCardIconWrap: {
    opacity: 0.35,
  },
  statCardLabel: {
    fontSize: 10,
    color: MUTED,
    letterSpacing: 0,
    marginTop: 4,
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
});
