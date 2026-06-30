import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { HapticTap } from '@/src/utils/haptics';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { appRoutes } from '@/src/constants/navigation';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useOrders } from '@/src/hooks/useOrders';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { useBioPage } from '@/src/hooks/useBioPage';
import type { Order } from '@/src/types/models';
import { Animated, Easing } from 'react-native';

// ─── Brand ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const SURFACE = '#FFFFFF';
const BG = '#FFFFFF';

// ─── Enhanced Animations for Millennial Appeal ─────────────────────────────
const useFloatAnimation = (delay: number) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [translateY]);

  return { transform: [{ translateY }] };
};

const usePulseAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scale]);

  return { transform: [{ scale }] };
};

// ─── Gradient Background for Depth ─────────────────────────────────────────
const useGradientBackground = () => {
  const [gradientPosition, setGradientPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition(prev => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return {
    backgroundImage: `linear-gradient(90deg, rgba(37,150,190,0.03) 0%, rgba(37,150,190,0.08) ${gradientPosition}%, rgba(37,150,190,0.03) 100%)`,
    backgroundSize: '200% 100%',
  };
};

// ─── Animation for micro-interactions ─────────────────────────────────────
const usePressAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return { scale, pressIn, pressOut };
};

// ─── Refined Branding ─────────────────────────────────────────────────────
const BRAND_VARIANTS = {
  primary: '#2596BE',
  secondary: '#64B5F6',
  accent: '#4FC3F7',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  elevated: '#F0F4F8',
};

// ─── Enhanced Animations ──────────────────────────────────────────────────
const ANIMATION_CONFIG = {
  quick: { duration: 150 },
  normal: { duration: 250 },
  slow: { duration: 350 },
  linger: { duration: 450 },
  spring: { damping: 20, stiffness: 170 },
};

// ─── Enhanced Typography Hierarchy ───────────────────────────────────────
const TYPOGRAPHY_SCALE = {
  display: { fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  title1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  title2: { fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  title3: { fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  headline: { fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },
  bodySmall: { fontSize: 15, lineHeight: 22, letterSpacing: -0.1 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
};

// ─── Refined Spacing System ───────────────────────────────────────────────
const SPACING = {
  xxxs: 2,
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  section: 40,
  content: 48,
};

// ─── Enhanced Layout Constants ───────────────────────────────────────────
const LAYOUT = {
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    pill: 999,
  },
  shadowIntensity: {
    subtle: 'rgba(0,0,0,0.05)',
    low: 'rgba(0,0,0,0.08)',
    medium: 'rgba(0,0,0,0.12)',
    high: 'rgba(0,0,0,0.16)',
  },
};

// ─── Quick actions ───────────────────────────────────────────────────────────
const ACTIONS = [
  { label: 'Create Card', image: require('@/assets/images/3d_create_card_v2.png'), route: appRoutes.guestDesign as Href, icon: 'Plus' as AppIconName },
  { label: 'Network', image: require('@/assets/images/3d_share_card_v2.png'), route: appRoutes.customerConnections as Href, icon: 'Users' as AppIconName },
  { label: 'Insights', image: require('@/assets/images/3d_analytics_v2.png'), route: appRoutes.guestAnalytics as Href, icon: 'ChartBar' as AppIconName },
  { label: 'Studio', image: require('@/assets/images/3d_signals_v2.png'), route: appRoutes.studio as Href, icon: 'Sparkles' as AppIconName },
];

// ─── Order status ────────────────────────────────────────────────────────────
function orderStatus(s: string): { label: string; color: string } {
  if (['production_approved', 'printer_assigned', 'printing', 'nfc_writing', 'nfc_verification', 'qa_pending', 'qa_failed'].includes(s))
    return { label: 'In Production', color: '#F59E0B' };
  if (['shipped', 'ready_to_ship'].includes(s))
    return { label: 'Shipped', color: '#10B981' };
  if (s === 'delivered') return { label: 'Delivered', color: '#3B82F6' };
  return { label: 'Processing', color: BRAND_VARIANTS.primary };
}

function greeting(name?: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${time}${name ? `, ${name.split(' ')[0]}` : ''}`;
}

// ─── Enhanced Order Row with Better Visual Hierarchy ─────────────────────────
function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const { scale, pressIn, pressOut } = usePressAnimation();
  const st = orderStatus(order.status);
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const amt = order.amount != null ? `$${order.amount.toFixed(0)}` : '—';

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() => {
        HapticTap.light();
        onPress();
      }}
      style={({ pressed }) => [
        pressed && styles.orderPressed,
      ]}
    >
      <Animated.View style={[
        styles.orderRow,
        { transform: [{ scale }] },
      ]}>
        <View style={styles.orderIcon}>
          <AppIcon name="CreditCard" size={20} color={BRAND_VARIANTS.primary} weight="medium" />
        </View>
        <View style={styles.orderInfo}>
          <AppText variant="body" weight="semibold" color={INK2}>
            {order.customerName || 'NFC Card'}
          </AppText>
          <AppText variant="caption" color={MUTED}>
            {order.quantity ?? 1}× {order.cardDesign?.replace(/_/g, ' ')}
          </AppText>
        </View>
        <View style={styles.orderMeta}>
          <View style={[styles.orderBadge, { backgroundColor: `${st.color}15` }]}>
            <AppText variant="caption" weight="medium" color={st.color}>
              {st.label}
            </AppText>
          </View>
          <AppText variant="bodySmall" weight="bold" color={INK2}>
            {amt}
          </AppText>
          <AppText variant="caption" color={MUTED}>
            {date}
          </AppText>
        </View>
        <AppIcon name="ChevronRight" size={15} color={MUTED} weight="medium" />
      </Animated.View>
    </Pressable>
  );
}

// ─── Enhanced Stats Card ───────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: AppIconName; color: string }) {
  return (
    <View style={styles.statCard}>
      <AppIcon name={icon} size={24} color={color} weight="medium" />
      <View style={styles.statContent}>
        <AppText variant="title2" weight="bold" color={INK}>
          {value}
        </AppText>
        <AppText variant="caption" color={MUTED}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────
export function GuestHomeScreen() {
  useAppTheme();
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { bioPage, saveBioPage, isLoading } = useBioPage(user?.id ?? '');
  const [previewTheme, setPreviewTheme] = useState<'vibrant_pink' | 'tech_noir' | 'editorial' | 'ocean_wave'>('vibrant_pink');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { unreadCount } = useNotifications();
  const { orders } = useOrders(user?.role ?? 'guest', user?.id ?? '');
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Enhanced animations
  const floatAnim = useFloatAnimation(0);
  const pulseAnim = usePulseAnimation();
  const gradientBg = useGradientBackground();

  useEffect(() => {
    if (user?.id && !isGuest) {
      void loadCustomerCloudCard(user.id).then(setCloudCard);
      void getCustomerInsights(user.id).then(setInsights).catch(() => null);
    }
  }, [user?.id, isGuest]);

  const recentOrders = useMemo(() => orders.slice(0, 2), [orders]);

  const cardProfile = cloudCard?.profile;
  const heroName = cardProfile?.fullName?.trim() || user?.displayName?.trim() || '';
  const heroTitle = cardProfile?.role?.trim() || '';
  const heroPhone = cardProfile?.phone?.trim() || '';
  const heroEmail = cardProfile?.email?.trim() || '';

  function handleShare() {
    if (isGuest) {
      requireAccount(undefined, { message: 'Sign in to share your profile link.' });
      return;
    }
    if (insights?.bioSlug) router.push(`/public/${insights.bioSlug}` as Href);
    else router.push(appRoutes.guestDesign as Href);
  }

  function handleAction(a: any) {
    if (a.action === 'share') {
      handleShare();
      return;
    }
    if (a.route) router.push(a.route);
  }

  const initial = (user?.displayName?.trim() || 'G')[0].toUpperCase();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <IosScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          contentInset={{ bottom: 20 }}
        >
          {/* Enhanced Gradient Background */}
          <Animated.View style={[styles.gradientContainer, gradientBg]} />

          {/* ── ENHANCED PROFILE HEADER ── */}
          <View style={styles.profileHeader}>
            <Pressable
              onPressIn={() => {
                HapticTap.light();
                setIsHovering(true);
              }}
              onPressOut={() => setIsHovering(false)}
              onPress={() => {
                HapticTap.light();
                router.push('/profile');
              }}
              style={({ pressed }) => [
                pressed && styles.pressed,
              ]}
            >
              <Animated.View style={[
                styles.profileAvatar,
                isHovering && styles.hovered,
                floatAnim,
              ]}>
                <AppText style={styles.profileAvatarT}>{initial}</AppText>
              </Animated.View>
            </Pressable>
            <View style={styles.profileCopy}>
              <AppText variant="caption" weight="medium" color={MUTED}>
                {greeting(user?.displayName)}
              </AppText>
              <View style={styles.profileNameRow}>
                <AppText variant="title2" weight="bold" color={INK} numberOfLines={1}>
                  {heroName || user?.displayName || 'Your Name'}
                </AppText>
                <AppIcon name="BadgeCheck" size={18} color={BRAND_VARIANTS.primary} weight="medium" />
              </View>
              <AppText variant="caption" weight="medium" color={MUTED} numberOfLines={1}>
                {[heroTitle || 'Digital identity', cardProfile?.company || 'NFC Global'].filter(Boolean).join(' / ')}
              </AppText>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPressIn={() => {
                  HapticTap.light();
                  setIsHovering(true);
                }}
                onPressOut={() => setIsHovering(false)}
                onPress={() => {
                  HapticTap.light();
                  if (isGuest) {
                    requireAccount(undefined, { message: 'Sign in to receive card and profile notifications.' });
                  } else {
                    router.push('/notifications');
                  }
                }}
                style={({ pressed }) => [
                  styles.headerIcon,
                  pressed && styles.pressed,
                  isHovering && styles.hovered,
                ]}
              >
                <AppIcon name="Bell" size={19} color={INK} weight="medium" />
                {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
              </Pressable>
              <Pressable
                onPressIn={() => {
                  HapticTap.medium();
                  setIsHovering(true);
                }}
                onPressOut={() => setIsHovering(false)}
                onPress={() => {
                  HapticTap.medium();
                  router.push(appRoutes.studio as Href);
                }}
                style={({ pressed }) => [
                  pressed && styles.pressed,
                ]}
              >
                <Animated.View style={[
                  styles.headerIcon,
                  isHovering && styles.hovered,
                  pulseAnim,
                ]}>
                  <AppIcon name="Sparkles" size={20} color={BRAND_VARIANTS.primary} weight="medium" />
                </Animated.View>
              </Pressable>
            </View>
          </View>

          {/* ── NFC CARD — Enhanced with Depth and Interaction ───────────────────── */}
          <View style={styles.cardContainer}>
            <Animated.View style={[styles.cardElevation, floatAnim]}>
              <NfcGlobalCardFace
                fullName={heroName || undefined}
                title={heroTitle || undefined}
                phone={heroPhone || undefined}
                email={heroEmail || undefined}
              />
            </Animated.View>
          </View>

          {/* Primary action with enhanced feedback */}
          <Pressable
            onPressIn={() => {
              HapticTap.rigid();
              setIsHovering(true);
            }}
            onPressOut={() => setIsHovering(false)}
            onPress={() => {
              HapticTap.rigid();
              handleShare();
            }}
            style={({ pressed }) => [
              styles.shareButton,
              pressed && styles.pressed,
              isHovering && styles.hovered,
            ]}
          >
            <AppIcon name="Share" size={18} color="#FFFFFF" weight="bold" />
            <AppText variant="body" weight="bold" color="#FFFFFF">
              Share profile
            </AppText>
          </Pressable>

          {/* ── QUICK ACTIONS — Refined Layout with Better Spacing ────────────── */}
          <View style={styles.actionContainer}>
            {ACTIONS.map((a, index) => (
              <Pressable
                key={a.label}
                onPressIn={() => {
                  HapticTap.light();
                  setIsHovering(true);
                }}
                onPressOut={() => setIsHovering(false)}
                onPress={() => {
                  HapticTap.light();
                  handleAction(a);
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionPressed,
                  isHovering && styles.actionHovered,
                  { transform: [{ scale: index % 2 === 0 ? 1.02 : 1 }] },
                ]}
                accessibilityRole="button"
              >
                <View style={styles.actionImageContainer}>
                  <Image source={a.image} style={styles.actionImage} resizeMode="contain" />
                </View>
                <AppText variant="bodySmall" weight="semibold" color={INK}>
                  {a.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* ── RECENT ACTIVITY — Enhanced Visual Design ────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="title3" weight="bold" color={INK}>
                Recent Activity
              </AppText>
            </View>
            <View style={styles.activityList}>
              {[
                ['Profile viewed', 'Today'],
                ['Connection made', 'Active'],
                ['Card scanned', isGuest ? 'Preview' : 'Live'],
              ].map(([title, meta], i) => (
                <View key={title} style={[styles.activityRow, i === 2 && styles.activityRowLast]}>
                  <AppText variant="body" weight="semibold" color={INK}>
                    {title}
                  </AppText>
                  <AppText variant="caption" color={MUTED}>
                    {meta}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          {/* ── STATS ROW (customers only) — Enhanced Cards ─────────────────── */}
          {!isGuest && insights ? (
            <View style={statsStyles.statsRow}>
              {[
                { label: 'Orders', value: String(insights.totalOrders), icon: 'ClipboardList' as const, color: BRAND_VARIANTS.primary },
                { label: 'Active', value: String(insights.activeOrders), icon: 'Clock' as const, color: '#F59E0B' },
                { label: 'Delivered', value: String(insights.deliveredOrders), icon: 'CircleCheck' as const, color: '#10B981' },
              ].map((stat, index) => (
                <StatCard
                  key={stat.label}
                  {...stat}
                  style={[
                    statsStyles.statCard,
                    index % 2 === 0 && statsStyles.statCardFirst,
                    index % 2 === 1 && statsStyles.statCardLast,
                  ]}
                />
              ))}
            </View>
          ) : null}

          {/* ── RECENT ORDERS — Enhanced Presentation ─────────────────────── */}
          {!isGuest && recentOrders.length > 0 ? (
            <View style={styles.ordersSection}>
              <View style={styles.sectionHeader}>
                <AppText variant="title3" weight="bold" color={INK}>
                  Recent Orders
                </AppText>
                <Pressable
                  onPressIn={() => {
                    HapticTap.light();
                    setIsHovering(true);
                  }}
                  onPressOut={() => setIsHovering(false)}
                  onPress={() => {
                    HapticTap.light();
                    router.push(appRoutes.guestTrackOrder as Href);
                  }}
                  style={({ pressed }) => [
                    styles.viewAllButton,
                    pressed && styles.viewAllPressed,
                  ]}
                >
                  <AppText variant="body" color={BRAND_VARIANTS.primary} weight="medium">
                    View All
                  </AppText>
                  <AppIcon name="ChevronRight" size={13} color={BRAND_VARIANTS.primary} weight="medium" />
                </Pressable>
              </View>
              <View style={styles.ordersCard}>
                {recentOrders.map((o) => (
                  <OrderRow key={o.id} order={o} onPress={() => router.push(`/orders/detail/${o.id}` as Href)} />
                ))}
              </View>
            </View>
          ) : null}

          {/* ── PRODUCTS — Enhanced Discovery ──────────────────────────────── */}
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <AppText variant="title3" weight="bold" color={INK}>
                Explore Features
              </AppText>
            </View>
            <View style={styles.productsList}>
              {[
                {
                  label: 'Design Your Card',
                  icon: 'Plus' as AppIconName,
                  color: BRAND_VARIANTS.primary,
                  onPress: () => {
                    if (isGuest) {
                      requireAccount(undefined, { message: 'Sign in to start designing.' });
                    } else {
                      router.push(appRoutes.guestDesign as Href);
                    }
                  }
                },
                {
                  label: 'Connect with Others',
                  icon: 'Users' as AppIconName,
                  color: '#FF9500',
                  onPress: () => {
                    if (isGuest) {
                      requireAccount(undefined, { message: 'Sign in to build your network.' });
                    } else {
                      router.push(appRoutes.customerConnections as Href);
                    }
                  }
                },
                {
                  label: 'View Analytics',
                  icon: 'ChartBar' as AppIconName,
                  color: '#4ECDC4',
                  onPress: () => {
                    if (isGuest) {
                      requireAccount(undefined, { message: 'Sign in to access insights.' });
                    } else {
                      router.push(appRoutes.guestAnalytics as Href);
                    }
                  }
                },
                {
                  label: 'Try NFC Demo',
                  icon: 'Nfc' as AppIconName,
                  color: '#9D8DFF',
                  onPress: () => router.push(appRoutes.nfcDemo as Href)
                },
              ].map((item, index) => (
                <Pressable
                  key={item.label}
                  onPressIn={() => {
                    HapticTap.light();
                    setIsHovering(true);
                  }}
                  onPressOut={() => setIsHovering(false)}
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.productItem,
                    index === 3 && styles.productItemLast,
                    pressed && styles.productPressed,
                    isHovering && styles.productHovered,
                  ]}
                >
                  <AppIcon name={item.icon} size={20} color={item.color} weight="bold" />
                  <AppText variant="body" weight="semibold" color={INK}>
                    {item.label}
                  </AppText>
                  <AppIcon name="ChevronRight" size={15} color={MUTED} weight="medium" />
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── NFC DEMO LINK — Enhanced Prompt ────────────────────────────── */}
          <Pressable
            onPressIn={() => {
              HapticTap.light();
              setIsHovering(true);
            }}
            onPressOut={() => setIsHovering(false)}
            onPress={() => {
              HapticTap.light();
              router.push(appRoutes.nfcDemo as Href);
            }}
            style={({ pressed }) => [
              styles.demoLink,
              pressed && styles.demoPressed,
              isHovering && styles.demoHovered,
            ]}
          >
            <AppIcon name="Nfc" size={16} color={MUTED} weight="medium" />
            <AppText variant="body" color={MUTED} weight="medium">
              Try NFC demo on this device
            </AppText>
            <AppIcon name="ChevronRight" size={14} color={MUTED} weight="medium" />
          </Pressable>

        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

const statsStyles = {
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  } as ViewStyle,
  statCardFirst: {
    marginRight: SPACING.xs / 2,
  } as ViewStyle,
  statCardLast: {
    marginLeft: SPACING.xs / 2,
  } as ViewStyle,
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
  } as TextStyle,
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0,
  } as TextStyle,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
    gap: SPACING.section,
  },

  // Enhanced Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.xs,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: LAYOUT.borderRadius.xl,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INK,
  },
  profileAvatarT: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.xxs,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: 0,
  },
  profileName: {
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: INK,
    letterSpacing: -0.3,
  },
  identityMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  hovered: {
    opacity: 0.95,
  },

  // Gradient Background
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...StyleSheet.absoluteFillObject,
  },

  // Card — Enhanced with depth and sophistication
  cardContainer: {
    marginVertical: SPACING.lg,
    alignItems: 'center',
  },
  cardElevation: {
    borderRadius: LAYOUT.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    backgroundColor: '#FFFFFF',
  },

  // Share Button — Enhanced
  shareButton: {
    height: 52,
    borderRadius: LAYOUT.borderRadius.xl,
    backgroundColor: INK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Action Strip — Enhanced Layout
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginVertical: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    minWidth: 80,
    aspectRatio: 1,
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  actionHovered: {
    opacity: 0.95,
    transform: [{ scale: 1.02 }],
  },
  actionImageContainer: {
    width: 48,
    height: 48,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  actionImage: {
    width: 24,
    height: 24,
  },

  // Section Headers
  section: {
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  viewAllPressed: {
    opacity: 0.8,
  },

  // Activity List — Enhanced
  activityList: {
    backgroundColor: SURFACE,
    borderRadius: LAYOUT.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  activityRowLast: {
    borderBottomWidth: 0,
  },

  // Orders Section
  ordersSection: {
    marginVertical: SPACING.lg,
  },
  ordersCard: {
    backgroundColor: SURFACE,
    borderRadius: LAYOUT.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  orderRowLast: {
    borderBottomWidth: 0,
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: 'rgba(37,150,190,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  orderBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: LAYOUT.borderRadius.pill,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
  },
  orderPressed: {
    opacity: 0.9,
  },

  // Products Section
  productsSection: {
    marginVertical: SPACING.lg,
  },
  productsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  productItem: {
    flex: 1,
    minWidth: 100,
    aspectRatio: 1.2,
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  productItemLast: {
    marginRight: 0,
  },
  productPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  productHovered: {
    opacity: 0.95,
    transform: [{ scale: 1.02 }],
  },

  // Demo Link
  demoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  demoPressed: {
    opacity: 0.9,
  },
  demoHovered: {
    opacity: 0.95,
  },

  // Stats Styles
  ...statsStyles,
});