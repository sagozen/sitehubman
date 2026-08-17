import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View, Animated } from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getLiquidTabIcon, LIQUID_TAB_ICON_SIZE } from '@/src/constants/liquidTabIcons';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

// ─── Sales icon map ─────────────────────────────────────────────────────────
const SALES_ICON_MAP: Record<string, string> = {
  index: 'Home',
  orders: 'ClipboardList',
  payouts: 'Wallet',
  me: 'User',
};

// ─── Premium Sales Tab Bar ────────────────────────────────────────────────────
function SalesTabBar({
  items,
  activeRoute,
  navigation,
  descriptors,
  paddingBottom,
  newOrderHref,
  ordersBadgeLabel,
}: {
  items: NavItem[];
  activeRoute: any;
  navigation: any;
  descriptors?: Record<string, any>;
  paddingBottom: number;
  newOrderHref: string;
  ordersBadgeLabel: string;
}) {
  const leftItems  = items.slice(0, 2); // Home, Orders
  const rightItems = items.slice(2);    // Payouts, Me

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
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isActive }}
      >
        <View style={[st.tabInner, isActive && st.tabInnerActive]}>
          {showBadge ? (
            <View style={st.badge}>
              <AppText style={st.badgeText}>{ordersBadgeLabel}</AppText>
            </View>
          ) : null}
          <AppIcon
            name={iconName}
            size={22}
            color={isActive ? '#2596BE' : '#8E8E93'}
          />
          <AppText style={[st.tabLabel, isActive ? st.tabLabelActive : st.tabLabelInactive]}>
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

// ─── Sales styles ─────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 30,
    paddingHorizontal: 12,
    height: 60,
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
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 3,
    minWidth: 54,
  },
  tabInnerActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#007AFF',
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: '#8E8E93',
  },
  fabWrap: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#007AFF', offset: { width: 0, height: 4 }, opacity: 0.2, radius: 12, elevation: 8 }),
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    zIndex: 10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
    includeFontPadding: false,
  },
});

interface Props {
  state: any;
  navigation: any;
  descriptors?: Record<string, any>;
}

type RouteItem = { type: 'route'; route: any };
type NavItem = RouteItem;

const CONSUMER_TAB_ORDER = ['index', 'connections', 'share', 'profile', 'settings'] as const;

export function LiquidTabBar({ state, navigation, descriptors }: Props) {
  const { colors, isDark } = usePreferences();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabRoutes = state.routes;
  const activeRoute = tabRoutes[state.index];

  const capsuleWidth = 60;
  const capsuleHeight = 46;
  const activeOptions = descriptors?.[activeRoute?.key]?.options ?? {};
  const isLegacyConnectionsRoute = activeRoute?.name === 'attendance';
  const shouldHide =
    !isLegacyConnectionsRoute &&
    (activeOptions.href === null || activeOptions.tabBarStyle?.display === 'none');

  const isSalesBar =
    tabRoutes.some((route: any) => route.name === 'orders') &&
    tabRoutes.some((route: any) => route.name === 'payouts');
  const isConsumerBar =
    !isSalesBar &&
    tabRoutes.some((route: any) => route.name === 'index') &&
    tabRoutes.some((route: any) => route.name === 'profile') &&
    tabRoutes.some((route: any) => route.name === 'settings');

  const visibleRoutes = useMemo(() => {
    const isTabVisible = (route: any) => {
      const options = descriptors?.[route.key]?.options ?? {};
      if (options.href === null) return false;
      if (options.tabBarStyle?.display === 'none') return false;
      return true;
    };

    if (isConsumerBar) {
      const connectionRoute =
        tabRoutes.find((route: any) => route.name === 'connections') ??
        tabRoutes.find((route: any) => route.name === 'attendance');
      const ordered = CONSUMER_TAB_ORDER.map((name) =>
        name === 'connections'
          ? connectionRoute
          : tabRoutes.find((route: any) => route.name === name)
      ).filter((route): route is (typeof tabRoutes)[number] => Boolean(route));

      return ordered.filter((route) =>
        route.name === 'connections' || route.name === 'attendance' ? true : isTabVisible(route)
      );
    }

    return tabRoutes.filter(isTabVisible);
  }, [descriptors, isConsumerBar, tabRoutes]);

  const isSalesUser = user?.role === 'sales';
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const lastFetchedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSalesUser || !user?.id) {
      setActiveOrdersCount(0);
      lastFetchedUserRef.current = null;
      return;
    }
    if (lastFetchedUserRef.current === user.id) return;

    let cancelled = false;
    const task = setTimeout(() => {
      void (async () => {
        try {
          const { listOrders } = await import('@/src/services/firestoreService');
          const orders = await listOrders('sales', user.id);
          if (cancelled) return;
          lastFetchedUserRef.current = user.id;
          setActiveOrdersCount(
            orders.filter((order) => order.status !== 'delivered' && (order.cardStatus ?? 'active') !== 'closed').length
          );
        } catch {
          if (!cancelled) setActiveOrdersCount(0);
        }
      })();
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(task);
    };
  }, [isSalesUser, user?.id]);

  const ordersBadgeLabel = activeOrdersCount > 99 ? '99+' : activeOrdersCount > 0 ? String(activeOrdersCount) : '';

  const newOrderHref = isSalesBar
    ? appRoutes.sales.newOrder
    : appRoutes.newOrder;

  const items: NavItem[] = visibleRoutes.map((route: any) => ({ type: 'route', route }) as RouteItem);
  const activeIndex = items.findIndex((item) => item.route.name === activeRoute?.name);

  // Animated sliding center value for the active pill indicator
  // Capsule width = 360, horizontal padding 8 → inner = 344
  // 5 tabs at 68 wide each. Pill width = 60. Inner offset per tab = (68 - 60) / 2 = 4.
  // Capsule target offset = 8 + index * 68 + 4
  const TAB_WIDTH = 68;
  const PILL_WIDTH = 60;
  const animCenterX = useRef(new Animated.Value(8 + Math.max(0, activeIndex) * TAB_WIDTH + 4)).current;

  useEffect(() => {
    if (activeIndex !== -1) {
      const targetX = 8 + activeIndex * TAB_WIDTH + (TAB_WIDTH - PILL_WIDTH) / 2;
      Animated.spring(animCenterX, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 160,
        friction: 9,
      }).start();
    }
  }, [activeIndex, animCenterX]);

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

  const surface = 'rgba(18, 18, 22, 0.94)';
  const hairline = 'rgba(255, 255, 255, 0.12)';
  const pillBg = 'rgba(255, 255, 255, 0.12)';

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.capsuleBar, { backgroundColor: surface, borderColor: hairline }]}>
        {/* Animated Sliding Background Pill */}
        {activeIndex !== -1 && (
          <Animated.View
            style={[
              styles.slidingActivePill,
              { backgroundColor: pillBg },
              {
                width: PILL_WIDTH,
                height: 44,
                transform: [{ translateX: animCenterX }],
              },
            ]}
          />
        )}

        {items.map((item) => {
          const route = item.route;
          const isActive = activeRoute?.name === route.name;
          const isLegacyAttendance = route.name === 'attendance';
          const muted = isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.42)';

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                HapticTap.selection();
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.iconContainer}>
                {route.name === 'index' ? (
                  <Ionicons name={isActive ? 'home' : 'home-outline'} size={21} color={muted} />
                ) : route.name === 'connections' || isLegacyAttendance ? (
                  <Ionicons name={isActive ? 'people' : 'people-outline'} size={21} color={muted} />
                ) : route.name === 'share' ? (
                  <Ionicons name={isActive ? 'qr-code' : 'qr-code-outline'} size={21} color={muted} />
                ) : route.name === 'profile' ? (
                  <Ionicons name={isActive ? 'person' : 'person-outline'} size={21} color={muted} />
                ) : route.name === 'settings' ? (
                  <Ionicons name={isActive ? 'settings-sharp' : 'settings-outline'} size={21} color={muted} />
                ) : null}
              </View>
            </Pressable>
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
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  capsuleBar: {
    width: 360,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  tabItem: {
    width: 68,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slidingActivePill: {
    position: 'absolute',
    top: 6,
    borderRadius: 22,
    zIndex: 1,
  },
});
