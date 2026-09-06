/**
 * PremiumHomeScreen — Full authenticated user dashboard.
 *
 * Features:
 * - Time-aware greeting with user name
 * - Animated stats counters (taps, connections, profile views)
 * - Floating NFC card preview with holographic shimmer + float animation
 * - 2×2 quick-action glass grid (Beam, QR, Bio, Add Contact)
 * - Recent activity feed with skeleton loading states
 * - Upgrade-to-Pro banner with gradient
 * - Staggered Reanimated 4 entrance animations throughout
 * - Pull-to-refresh support
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Dimensions,
  InteractionManager,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48 - 12) / 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (typeof requestAnimationFrame === 'undefined') { setDisplay(value); return; }
    let frame: ReturnType<typeof requestAnimationFrame>;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{formatNumber(display)}</>;
}

// ─── Skeleton Block ───────────────────────────────────────────────────────────
function SkeletonBlock({ width, height, radius = 8, style }: {
  width: number | string; height: number; radius?: number; style?: any;
}) {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850 }),
        withTiming(0, { duration: 850 }),
      ),
      -1,
    );
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.35, 0.80], Extrapolation.CLAMP),
  }));
  return (
    <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: '#2C2C2E' }, shimmerStyle, style]} />
  );
}

// ─── NFC Card Preview ─────────────────────────────────────────────────────────
function NfcCardPreview({ name, title, isDark }: { name: string; title: string; isDark: boolean }) {
  const float   = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(withTiming(1, { duration: 2600 }), withTiming(0, { duration: 2600 })),
      -1,
    );
    shimmer.value = withRepeat(withTiming(1, { duration: 2200 }), -1);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -10], Extrapolation.CLAMP) }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.40, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-SCREEN_W, SCREEN_W], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={[cs.cardWrap, cardStyle]}>
      <LinearGradient
        colors={isDark ? ['#1A1A3E', '#0A0A2E', '#020210'] : ['#E0EAFF', '#C4D4FF', '#A8BFFF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={cs.card}
      >
        <Animated.View style={[StyleSheet.absoluteFill, cs.shimmerOverlay, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={cs.nfcBadge}>
          <Ionicons name="wifi" size={13} color="rgba(255,255,255,0.75)" style={{ transform: [{ rotate: '90deg' }] }} />
        </View>

        <View style={cs.cardContent}>
          <AppText style={cs.cardName}>{name || 'Your Name'}</AppText>
          <AppText style={cs.cardTitle}>{title || 'Digital Business Card'}</AppText>
        </View>

        <View style={cs.cardBottom}>
          <View style={cs.cardDot} />
          <AppText style={cs.cardSiteHub}>SiteHub  ·  NFC</AppText>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const cs = StyleSheet.create({
  cardWrap: { alignSelf: 'center', marginVertical: 4 },
  card: {
    width: SCREEN_W - 56,
    height: (SCREEN_W - 56) * 0.56,
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 16,
  },
  shimmerOverlay:  { borderRadius: 22, overflow: 'hidden' },
  nfcBadge: {
    position: 'absolute', top: 16, right: 16,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1, justifyContent: 'flex-end', paddingBottom: 8 },
  cardName:    { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.4 },
  cardTitle:   { fontSize: 13, color: 'rgba(255,255,255,0.60)', marginTop: 3 },
  cardBottom:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  cardDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  cardSiteHub: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '600', letterSpacing: 1.2 },
});

// ─── Stats Row ────────────────────────────────────────────────────────────────
interface StatItem { label: string; value: number; icon: string; color: string }

function StatsRow({ stats, isDark, loaded }: { stats: StatItem[]; isDark: boolean; loaded: boolean }) {
  return (
    <View style={ss.row}>
      {stats.map((stat, i) => (
        <Animated.View
          key={stat.label}
          entering={FadeInUp.delay(80 + i * 70).springify().damping(18).stiffness(200)}
          style={[ss.statCard, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            borderColor:     isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)',
          }]}
        >
          <View style={[ss.iconWrap, { backgroundColor: stat.color + '22' }]}>
            <Ionicons name={stat.icon as any} size={15} color={stat.color} />
          </View>
          {loaded ? (
            <AppText style={[ss.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              <AnimatedCounter value={stat.value} />
            </AppText>
          ) : (
            <SkeletonBlock width={42} height={22} radius={6} />
          )}
          <AppText style={ss.statLabel}>{stat.label}</AppText>
        </Animated.View>
      ))}
    </View>
  );
}

const ss = StyleSheet.create({
  row:      { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  statCard: {
    flex: 1, borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6 },
  statLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '500', textAlign: 'center' },
});

// ─── Quick Action Grid ────────────────────────────────────────────────────────
interface QuickAction {
  id: string; label: string; sub: string; icon: string;
  gradient: readonly [string, string]; route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'beam',    label: 'Beam Now',    sub: 'NFC tap & share', icon: 'radio',        gradient: ['#0A84FF', '#5856D6'], route: '/share'        },
  { id: 'qr',      label: 'QR Code',     sub: 'Show your card',  icon: 'qr-code',      gradient: ['#30D158', '#20A84A'], route: '/qr-generator' },
  { id: 'bio',     label: 'My Bio',      sub: 'Edit profile',    icon: 'person-circle',gradient: ['#FF9F0A', '#E07000'], route: '/profile'      },
  { id: 'contact', label: 'Add Contact', sub: 'New connection',  icon: 'person-add',   gradient: ['#FF375F', '#BF5AF2'], route: '/connections'  },
];

function QuickActionCard({ action, isDark, delay }: { action: QuickAction; isDark: boolean; delay: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(17).stiffness(190)}
      style={[qs.cardWrap, animStyle]}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.91, { damping: 18, stiffness: 440 }); }}
        onPressOut={() => { scale.value = withSpring(1.0,  { damping: 14, stiffness: 320 }); }}
        onPress={() => { HapticTap.selection(); router.push(action.route as any); }}
        style={[qs.card, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderColor:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
        }]}
        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <LinearGradient
          colors={action.gradient}
          style={qs.iconBubble}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Ionicons name={action.icon as any} size={22} color="#FFFFFF" />
        </LinearGradient>
        <AppText style={[qs.actionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>{action.label}</AppText>
        <AppText style={qs.actionSub}>{action.sub}</AppText>
      </Pressable>
    </Animated.View>
  );
}

const qs = StyleSheet.create({
  cardWrap: { width: CARD_W },
  card:     { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10 },
  iconBubble: {
    width: 50, height: 50, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  actionSub:   { fontSize: 12, color: '#8E8E93' },
});

// ─── Activity Feed ─────────────────────────────────────────────────────────────
interface ActivityItem { id: string; name: string; action: string; time: string; initials: string; color: string }

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', name: 'Alex Chen',     action: 'Tapped your card',     time: '2m ago',  initials: 'AC', color: '#0A84FF' },
  { id: '2', name: 'Maria Lopez',   action: 'Viewed your profile',  time: '18m ago', initials: 'ML', color: '#30D158' },
  { id: '3', name: 'James Park',    action: 'Saved your contact',   time: '1h ago',  initials: 'JP', color: '#FF9F0A' },
  { id: '4', name: 'Sara Williams', action: 'Connected with you',   time: '3h ago',  initials: 'SW', color: '#FF375F' },
  { id: '5', name: 'Tom Hughes',    action: 'Scanned your QR code', time: '5h ago',  initials: 'TH', color: '#BF5AF2' },
];

function ActivityFeed({ isDark, loaded }: { isDark: boolean; loaded: boolean }) {
  if (!loaded) {
    return (
      <View style={{ padding: 16, gap: 16 }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SkeletonBlock width={44} height={44} radius={22} />
            <View style={{ flex: 1, gap: 7 }}>
              <SkeletonBlock width="58%" height={14} radius={6} />
              <SkeletonBlock width="38%" height={11} radius={5} />
            </View>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={af.feed}>
      {MOCK_ACTIVITY.map((item, i) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.delay(i * 45).springify().damping(20)}
          style={[af.row, {
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            borderBottomWidth: i < MOCK_ACTIVITY.length - 1 ? StyleSheet.hairlineWidth : 0,
          }]}
        >
          <View style={[af.avatar, { backgroundColor: item.color + '22' }]}>
            <AppText style={[af.initials, { color: item.color }]}>{item.initials}</AppText>
          </View>
          <View style={af.content}>
            <AppText style={[af.name, { color: isDark ? '#FFFFFF' : '#000000' }]}>{item.name}</AppText>
            <AppText style={af.action}>{item.action}</AppText>
          </View>
          <AppText style={af.time}>{item.time}</AppText>
        </Animated.View>
      ))}
    </View>
  );
}

const af = StyleSheet.create({
  feed:    { paddingHorizontal: 0 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  avatar:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initials:{ fontSize: 15, fontWeight: '700' },
  content: { flex: 1, gap: 2 },
  name:    { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  action:  { fontSize: 13, color: '#8E8E93' },
  time:    { fontSize: 12, color: '#8E8E93' },
});

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHead({ title, action, onAction, isDark }: {
  title: string; action?: string; onAction?: () => void; isDark: boolean;
}) {
  return (
    <View style={sh.row}>
      <AppText style={[sh.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</AppText>
      {action && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <AppText style={sh.action}>{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  title:  { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  action: { fontSize: 14, color: '#0A84FF', fontWeight: '500' },
});

// ─── PremiumHomeScreen ─────────────────────────────────────────────────────────
export function PremiumHomeScreen() {
  const { user }    = useAuth();
  const { isDark }  = usePreferences();
  const insets      = useSafeAreaInsets();
  const [loaded, setLoaded]         = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const greeting  = useMemo(() => getGreeting(), []);
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoaded(true), 500);
    });
    return () => task.cancel();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setLoaded(false);
    setTimeout(() => { setLoaded(true); setRefreshing(false); }, 1000);
  }, []);

  const stats: StatItem[] = [
    { label: 'Taps Today',    value: 47,   icon: 'radio',  color: '#0A84FF' },
    { label: 'Connections',   value: 312,  icon: 'people', color: '#30D158' },
    { label: 'Profile Views', value: 1284, icon: 'eye',    color: '#FF9F0A' },
  ];

  const bg = isDark
    ? ['#000000', '#07090E', '#0D1017'] as const
    : ['#F4F7FB', '#FAFCFF', '#FFFFFF'] as const;

  return (
    <LinearGradient colors={bg} style={StyleSheet.absoluteFill}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify().damping(20)} style={styles.header}>
          <View>
            <AppText style={[styles.greeting, { color: isDark ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.38)' }]}>
              {greeting.emoji}  {greeting.text}
            </AppText>
            <AppText style={[styles.name, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {firstName}
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/notifications' as any)}
            style={[styles.bellBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={21} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </Animated.View>

        {/* NFC Card */}
        <Animated.View entering={FadeInUp.delay(60).springify().damping(18)}>
          <NfcCardPreview name={user?.displayName || ''} title={(user as any)?.jobTitle || ''} isDark={isDark} />
        </Animated.View>

        {/* Stats */}
        <StatsRow stats={stats} isDark={isDark} loaded={loaded} />

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
          <SectionHead title="Quick Actions" isDark={isDark} />
          <View style={{ height: 12 }} />
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action, i) => (
              <QuickActionCard key={action.id} action={action} isDark={isDark} delay={180 + i * 55} />
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.section}>
          <SectionHead
            title="Recent Activity"
            action="See all"
            onAction={() => router.push('/connections' as any)}
            isDark={isDark}
          />
          <View style={{ height: 12 }} />
          <View style={[styles.activityCard, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderColor:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
          }]}>
            <ActivityFeed isDark={isDark} loaded={loaded} />
          </View>
        </Animated.View>

        {/* Upgrade Banner */}
        <Animated.View entering={FadeInDown.delay(340).springify()} style={styles.section}>
          <Pressable
            onPress={() => { HapticTap.selection(); router.push('/pricing' as any); }}
            style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.86 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
          >
            <LinearGradient
              colors={['#0A84FF', '#5E5CE6', '#BF5AF2']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.bannerGrad}
            >
              <View style={styles.bannerContent}>
                <View>
                  <AppText style={styles.bannerTitle}>Upgrade to Pro ✦</AppText>
                  <AppText style={styles.bannerSub}>Unlimited taps · Analytics · Custom branding</AppText>
                </View>
                <View style={styles.bannerArrow}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1 },
  content:  { gap: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
  },
  greeting: { fontSize: 14, fontWeight: '500', letterSpacing: 0.1 },
  name:     { fontSize: 30, fontWeight: '700', letterSpacing: -0.9, marginTop: 2 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  section:  { gap: 0 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  activityCard: {
    marginHorizontal: 20, borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
  },
  banner:     { marginHorizontal: 20 },
  bannerGrad: { borderRadius: 20, overflow: 'hidden' },
  bannerContent: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 18, gap: 12,
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  bannerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  bannerArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
});
