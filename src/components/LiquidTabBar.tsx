/**
 * LiquidTabBar — Premium Apple HIG-compliant tab bar.
 *
 * Enhancements over v1:
 * - Reanimated 4 spring animations (useSharedValue + withSpring)
 * - Animated pill indicator that slides under active tab
 * - Scale-bounce press feedback (0.85 → spring release to 1.0)
 * - BlurView frosted glass background (iOS native blur)
 * - Icon scale pop on activation
 * - Haptic feedback on every press
 *
 * Apple HIG rules:
 * - Tab bar height: 49pt + safe area bottom
 * - Icon size: 24pt
 * - Label: Caption 2 (10pt)
 * - Active tint: system blue (#0A84FF dark / #007AFF light)
 * - Touch target: 44pt minimum
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { createShadow } from '@/src/utils/shadows';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

// ─── Constants ───────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 49;
const TAB_ICON_SIZE  = 24;
const TAB_LABEL_SIZE = 10;

const SPRING_STANDARD = { damping: 18, stiffness: 260, mass: 0.9 };
const SPRING_SNAPPY   = { damping: 16, stiffness: 340, mass: 0.7 };

// ─── Animated Tab Item ────────────────────────────────────────────────────────
interface TabItemProps {
  iconName: any;
  labelText: string;
  isActive: boolean;
  isDark: boolean;
  activeTint: string;
  inactiveTint: string;
  onPress: () => void;
  accessibilityLabel: string;
}

function AnimatedTabItem({
  iconName, labelText, isActive, isDark,
  activeTint, inactiveTint, onPress, accessibilityLabel,
}: TabItemProps) {
  const pressAnim  = useSharedValue(1);
  const activeAnim = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeAnim.value = withSpring(isActive ? 1 : 0, SPRING_STANDARD);
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressAnim.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(activeAnim.value, [0, 1], [1, 1.1], Extrapolation.CLAMP) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeAnim.value, [0, 0.5, 1], [0.5, 0.75, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(activeAnim.value, [0, 1], [2, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Pressable
      onPressIn={() => {
        pressAnim.value = withSpring(0.82, SPRING_SNAPPY);
      }}
      onPressOut={() => {
        pressAnim.value = withSpring(1.0, SPRING_SNAPPY);
      }}
      onPress={() => {
        runOnJS(HapticTap.selection)();
        runOnJS(onPress)();
      }}
      style={[s.tabItem, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isActive }}
      hitSlop={0}
    >
      <Animated.View style={[s.tabInner, containerStyle]}>
        <Animated.View style={iconStyle}>
          <Ionicons name={iconName} size={TAB_ICON_SIZE} color={isActive ? activeTint : inactiveTint} />
        </Animated.View>
        <Animated.View style={labelStyle}>
          <AppText
            style={[s.tabLabel, { color: isActive ? activeTint : inactiveTint }]}
            weight={isActive ? 'semibold' : 'regular'}
          >
            {labelText}
          </AppText>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Sales Icon Map ───────────────────────────────────────────────────────────
const SALES_ICON_MAP: Record<string, string> = {
  index:   'Home',
  orders:  'ClipboardList',
  payouts: 'Wallet',
  me:      'User',
};

// ─── Sales Tab Bar ────────────────────────────────────────────────────────────
function SalesTabBar({
  items, activeRoute, navigation, descriptors, paddingBottom, newOrderHref, ordersBadgeLabel,
}: {
  items: NavItem[];
  activeRoute: any;
  navigation: any;
  descriptors?: Record<string, any>;
  paddingBottom: number;
  newOrderHref: string;
  ordersBadgeLabel: string;
}) {
  const leftItems  = items.slice(0, 2);
  const rightItems = items.slice(2);

  function SalesTab({ route }: { route: any }) {
    const isActive  = activeRoute?.name === route.name;
    const label     = routeLabel(route, descriptors);
    const iconName  = (SALES_ICON_MAP[route.name] ?? 'Home') as any;
    const showBadge = route.name === 'orders' && !!ordersBadgeLabel;

    return (
      <Pressable
        onPress={() => {
          HapticTap.selection();
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={({ pressed }) => [st.tab, pressed && { opacity: 0.72 }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: isActive }}
        hitSlop={0}
      >
        <View style={[st.tabInner, isActive && st.tabInnerActive]}>
          {showBadge ? (
            <View style={st.badge}>
              <AppText style={st.badgeText}>{ordersBadgeLabel}</AppText>
            </View>
          ) : null}
          <AppIcon name={iconName} size={TAB_ICON_SIZE} color={isActive ? '#007AFF' : '#8E8E93'} />
          <AppText style={[st.tabLabel, { color: isActive ? '#007AFF' : '#8E8E93', fontWeight: isActive ? '600' : '400' }]}>
            {label}
          </AppText>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[st.wrapper, { paddingBottom: Math.max(paddingBottom, 12), pointerEvents: 'box-none' as any }]}>
      <View style={st.bar}>
        <View style={st.side}>
          {leftItems.map(item => <SalesTab key={item.route.key} route={item.route} />)}
        </View>

        <View style={st.fabWrap}>
          <Pressable
            onPress={() => router.push(newOrderHref as any)}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.92 : 1 }] }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            accessibilityRole="button"
            accessibilityLabel="New order"
          >
            <View style={st.fab}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        <View style={st.side}>
          {rightItems.map(item => <SalesTab key={item.route.key} route={item.route} />)}
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 30,
    paddingHorizontal: 12,
    height: TAB_BAR_HEIGHT + 5,
    ...createShadow({ color: '#000', offset: { width: 0, height: 4 }, opacity: 0.06, radius: 16, elevation: 8 }),
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 3,
    minWidth: 54,
  },
  tabInnerActive: {
    backgroundColor: 'rgba(0,122,255,0.08)',
  },
  tabLabel: {
    fontSize: TAB_LABEL_SIZE,
    letterSpacing: 0,
  },
  fabWrap: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  fab: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#007AFF', offset: { width: 0, height: 4 }, opacity: 0.28, radius: 14, elevation: 10 }),
  },
  badge: {
    position: 'absolute',
    top: 2, right: 4,
    zIndex: 10,
    minWidth: 16, height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
    includeFontPadding: false,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  state: any;
  navigation: any;
  descriptors?: Record<string, any>;
}
type RouteItem = { type: 'route'; route: any };
type NavItem = RouteItem;
const CONSUMER_TAB_ORDER = ['index', 'connections', 'share', 'profile', 'settings'] as const;

const TAB_ICON_MAP: Record<string, { active: any; inactive: any; label: string }> = {
  index:       { active: 'home',         inactive: 'home-outline',        label: 'Home'     },
  connections: { active: 'people',       inactive: 'people-outline',      label: 'Contacts' },
  attendance:  { active: 'people',       inactive: 'people-outline',      label: 'Contacts' },
  share:       { active: 'radio',        inactive: 'radio-outline',       label: 'Beam'     },
  profile:     { active: 'person',       inactive: 'person-outline',      label: 'Bio'      },
  settings:    { active: 'settings-sharp', inactive: 'settings-outline',  label: 'Settings' },
};

export function LiquidTabBar({ state, navigation, descriptors }: Props) {
  const { isDark }  = usePreferences();
  const { user }    = useAuth();
  const insets      = useSafeAreaInsets();
  const tabRoutes   = state.routes;
  const activeRoute = tabRoutes[state.index];

  const activeOptions = descriptors?.[activeRoute?.key]?.options ?? {};
  const isLegacyConn = activeRoute?.name === 'attendance';
  const shouldHide   = !isLegacyConn && (activeOptions.href === null || activeOptions.tabBarStyle?.display === 'none');

  const isSalesBar    = tabRoutes.some((r: any) => r.name === 'orders') && tabRoutes.some((r: any) => r.name === 'payouts');
  const isConsumerBar = !isSalesBar && tabRoutes.some((r: any) => r.name === 'index') && tabRoutes.some((r: any) => r.name === 'profile');

  const visibleRoutes = useMemo(() => {
    const isTabVisible = (route: any) => {
      const opts = descriptors?.[route.key]?.options ?? {};
      if (opts.href === null) return false;
      if (opts.tabBarStyle?.display === 'none') return false;
      return true;
    };
    if (isConsumerBar) {
      const connRoute = tabRoutes.find((r: any) => r.name === 'connections') ?? tabRoutes.find((r: any) => r.name === 'attendance');
      const ordered = CONSUMER_TAB_ORDER.map((name) =>
        name === 'connections' ? connRoute : tabRoutes.find((r: any) => r.name === name)
      ).filter((r): r is (typeof tabRoutes)[number] => Boolean(r));
      return ordered.filter((r) => r.name === 'connections' || r.name === 'attendance' ? true : isTabVisible(r));
    }
    return tabRoutes.filter(isTabVisible);
  }, [descriptors, isConsumerBar, tabRoutes]);

  const isSalesUser = user?.role === 'sales';
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const lastFetchedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSalesUser || !user?.id) { setActiveOrdersCount(0); lastFetchedUserRef.current = null; return; }
    if (lastFetchedUserRef.current === user.id) return;
    let cancelled = false;
    const task = setTimeout(() => {
      void (async () => {
        try {
          const { listOrders } = await import('@/src/services/firestoreService');
          const orders = await listOrders('sales', user.id);
          if (cancelled) return;
          lastFetchedUserRef.current = user.id;
          setActiveOrdersCount(orders.filter((o) => o.status !== 'delivered' && (o.cardStatus ?? 'active') !== 'closed').length);
        } catch { if (!cancelled) setActiveOrdersCount(0); }
      })();
    }, 800);
    return () => { cancelled = true; clearTimeout(task); };
  }, [isSalesUser, user?.id]);

  const ordersBadgeLabel = activeOrdersCount > 99 ? '99+' : activeOrdersCount > 0 ? String(activeOrdersCount) : '';
  const newOrderHref     = isSalesBar ? appRoutes.sales.newOrder : appRoutes.newOrder;
  const items: NavItem[] = visibleRoutes.map((route: any) => ({ type: 'route', route }) as RouteItem);
  const activeIndex      = items.findIndex((item) => item.route.name === activeRoute?.name);

  // ─── Pill indicator animation (Reanimated 4) ─────────────────────────────
  const TAB_W = 68;
  const PILL_W = 60;
  const pillX = useSharedValue(8 + Math.max(0, activeIndex) * TAB_W + (TAB_W - PILL_W) / 2);

  useEffect(() => {
    if (activeIndex !== -1) {
      pillX.value = withSpring(
        8 + activeIndex * TAB_W + (TAB_W - PILL_W) / 2,
        SPRING_STANDARD,
      );
    }
  }, [activeIndex]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  if (shouldHide) return null;

  if (isSalesBar) {
    return (
      <SalesTabBar
        items={items}
        activeRoute={activeRoute}
        navigation={navigation}
        descriptors={descriptors}
        paddingBottom={Math.max(insets.bottom, theme.spacing.xs)}
        newOrderHref={newOrderHref}
        ordersBadgeLabel={ordersBadgeLabel}
      />
    );
  }

  // ─── Consumer dock colors ─────────────────────────────────────────────────
  const activeTint   = isDark ? '#0A84FF' : '#007AFF';
  const inactiveTint = isDark ? 'rgba(235,235,245,0.55)' : 'rgba(60,60,67,0.55)';
  const barBorder    = isDark ? 'rgba(84,84,88,0.55)' : 'rgba(60,60,67,0.12)';
  const blurTint     = isDark ? 'dark' : 'light';

  return (
    <View style={[styles.floatingDockWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.floatingDock, { borderColor: barBorder }]}>
        {/* Frosted glass background */}
        <BlurView
          intensity={isDark ? 60 : 72}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        />

        {/* Sliding pill indicator */}
        <Animated.View
          style={[styles.pillIndicator, pillStyle, { backgroundColor: isDark ? 'rgba(10,132,255,0.14)' : 'rgba(0,122,255,0.09)' }]}
          pointerEvents="none"
        />

        {/* Tab items */}
        {items.map((item) => {
          const route    = item.route;
          const isActive = activeRoute?.name === route.name;
          const mapping  = TAB_ICON_MAP[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline', label: route.name };
          const iconName = isActive ? mapping.active : mapping.inactive;

          return (
            <AnimatedTabItem
              key={route.key}
              iconName={iconName}
              labelText={mapping.label}
              isActive={isActive}
              isDark={isDark}
              activeTint={activeTint}
              inactiveTint={inactiveTint}
              accessibilityLabel={mapping.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function routeLabel(route: any, descriptors?: Record<string, any>) {
  const options = descriptors?.[route.key]?.options ?? {};
  if (route.name === 'attendance') return 'Connections';
  return options.title ?? route.name.charAt(0).toUpperCase() + route.name.slice(1);
}

const styles = StyleSheet.create({
  floatingDockWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none' as any,
    zIndex: 100,
  },
  floatingDock: {
    width: '92%',
    maxWidth: 380,
    height: TAB_BAR_HEIGHT + 8,
    borderRadius: Math.round((TAB_BAR_HEIGHT + 8) / 2),
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    overflow: 'hidden',
    ...createShadow({ color: '#000000', offset: { width: 0, height: 10 }, opacity: 0.22, radius: 24, elevation: 14 }),
  },
  pillIndicator: {
    position: 'absolute',
    top: '50%',
    width: 60,
    height: 44,
    marginTop: -22,
    borderRadius: 14,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: TAB_LABEL_SIZE,
    lineHeight: 13,
    letterSpacing: 0,
  },
});
