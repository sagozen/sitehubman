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
          {/* Red badge */}
          {showBadge ? (
            <View style={st.badge}>
              <AppText style={st.badgeText}>{ordersBadgeLabel}</AppText>
            </View>
          ) : null}
          {/* Icon */}
          <AppIcon
            name={iconName}
            size={22}
            color={isActive ? '#2596BE' : '#8E8E93'}
          />
          {/* Label */}
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
        {/* Left tabs — Home, Orders */}
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

        {/* Right tabs — Payouts, Me */}
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
    ...createShadow({ color: '#000', offset: { width: 0, height: 4 }, opacity: 0.08, radius: 16, elevation: 8 }),
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
    backgroundColor: 'rgba(37, 150, 190, 0.08)', // soft active state
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#2596BE',
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: '#8E8E93',
  },
  fabWrap: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18, // Slightly raised above the bar
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2596BE',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#2596BE', offset: { width: 0, height: 4 }, opacity: 0.25, radius: 12, elevation: 8 }),
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

/** Guest + customer footer tabs — fixed order so Connections never drops off. */
const CONSUMER_TAB_ORDER = ['index', 'connections', 'share', 'profile', 'settings'] as const;

const DOCK_HEIGHT = 76;
const FAB_SIZE = theme.controlHeight.hero;

const TAB_ROUTE_ICON_MAP: Record<string, string> = {
  index: 'Home',
  connections: 'Users',
  attendance: 'Users',
  share: 'Share2',
  profile: 'User',
  settings: 'Sliders',
  orders: 'ClipboardList',
  customers: 'Users',
  payouts: 'Wallet',
  me: 'User',
  'new-order': 'Plus',
};

function TabIcon({
  routeName,
  active,
  activeIconColor,
  inactiveIconColor,
  badgeLabel,
}: {
  routeName: string;
  active: boolean;
  activeIconColor: string;
  inactiveIconColor: string;
  badgeLabel?: string;
}) {
  const iconName = TAB_ROUTE_ICON_MAP[routeName] || 'Home';
  const scale = useRef(new Animated.Value(active ? 1.15 : 1.0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.15 : 1.0,
      useNativeDriver: true,
      tension: 110,
      friction: 7,
    }).start();
  }, [active]);

  return (
    <View style={styles.iconBadgeContainer}>
      {badgeLabel ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText} numberOfLines={1}>
            {badgeLabel}
          </AppText>
        </View>
      ) : null}
      <Animated.View style={[styles.iconShell, { transform: [{ scale }] }]}>
        <AppIcon
          name={iconName}
          size={LIQUID_TAB_ICON_SIZE}
          color={active ? activeIconColor : inactiveIconColor}
          variant={active ? 'solar-bold' : 'solar-duotone'}
        />
      </Animated.View>
    </View>
  );
}

function LiquidGlassChrome({
  children,
  isDark,
  reduceTransparency,
  borderRadius,
  style,
  fallbackBackground,
}: {
  children: ReactNode;
  isDark: boolean;
  reduceTransparency: boolean;
  borderRadius: number;
  style?: object;
  fallbackBackground: string;
}) {
  const borderColor = isDark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.18)';
  const fill = isDark ? 'rgba(28,28,30,0.94)' : 'rgba(255,255,255,0.96)';
  void reduceTransparency;

  return (
    <View
      style={[
        { borderRadius, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor },
        { backgroundColor: fallbackBackground || fill },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function useReduceTransparency() {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let mounted = true;
    const accessibility = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceTransparencyEnabled?: () => Promise<boolean>;
    };

    if (typeof accessibility.isReduceTransparencyEnabled === 'function') {
      accessibility.isReduceTransparencyEnabled()
        .then((enabled) => {
          if (mounted) setReduceTransparency(enabled);
        })
        .catch(() => undefined);
    }

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceTransparencyChanged',
      setReduceTransparency
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reduceTransparency;
}

export function LiquidTabBar({ state, navigation, descriptors }: Props) {
  const { colors, isDark } = usePreferences();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const reduceTransparency = useReduceTransparency();
  const tabRoutes = state.routes;
  const activeRoute = tabRoutes[state.index];

  const [tabLayouts, setTabLayouts] = useState<Record<number, { x: number; w: number }>>({});
  const animCenterX = useRef(new Animated.Value(0)).current;
  const capsuleWidth = 52;
  const capsuleHeight = 40;
  const activeOptions = descriptors?.[activeRoute?.key]?.options ?? {};
  const isLegacyConnectionsRoute = activeRoute?.name === 'attendance';
  const shouldHide =
    !isLegacyConnectionsRoute
    && (activeOptions.href === null || activeOptions.tabBarStyle?.display === 'none');

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
        tabRoutes.find((route: any) => route.name === 'connections')
        ?? tabRoutes.find((route: any) => route.name === 'attendance');
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
  const showFloatingAction = isSalesBar;
  const activeIconColor = colors.systemBlue;
  const inactiveIconColor = colors.textMuted;
  const activeLabelColor = colors.systemBlue;

  const isSalesUser = user?.role === 'sales';
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  // Cache the last userId we fetched for, avoid re-fetching on every render
  const lastFetchedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSalesUser || !user?.id) {
      setActiveOrdersCount(0);
      lastFetchedUserRef.current = null;
      return;
    }
    // Don't re-fetch if userId hasn't changed
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
    }, 800); // increased debounce — tab bar badge is low priority

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

  useEffect(() => {
    const layout = tabLayouts[activeIndex];
    if (layout) {
      const targetCenterX = layout.x + layout.w / 2 - capsuleWidth / 2;
      Animated.spring(animCenterX, {
        toValue: targetCenterX,
        useNativeDriver: true,
        tension: 130,
        friction: 8,
      }).start();
    }
  }, [activeIndex, tabLayouts]);

  if (shouldHide) return null;

  // ── Premium sales bar — early return ─────────────────────────────────────
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

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, theme.spacing.xs) }]}>
      {showFloatingAction ? (
        <View style={[styles.roleDockShapeWrap, { pointerEvents: 'none' as any }]}>
          <LiquidGlassChrome
            isDark={isDark}
            reduceTransparency={reduceTransparency}
            borderRadius={999}
            fallbackBackground={colors.surface}
            style={styles.roleDockShape}
          >
            <View />
          </LiquidGlassChrome>
        </View>
      ) : null}
      <View style={[styles.dockShadow, styles.dockShadowFlex]}>
        <LiquidGlassChrome
          isDark={isDark}
          reduceTransparency={reduceTransparency}
          borderRadius={999}
          fallbackBackground={colors.surface}
          style={styles.bar}
        >
          {/* Sliding capsule background */}
          {activeIndex !== -1 && tabLayouts[activeIndex] ? (
            <Animated.View
              style={[
                styles.slidingPill,
                {
                  width: capsuleWidth,
                  height: capsuleHeight,
                  transform: [{ translateX: animCenterX }],
                  backgroundColor: isDark ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.08)',
                },
              ]}
            />
          ) : null}
          {items.map((item, index) => {
            const route = item.route;
            const isActive = activeRoute?.name === route.name;
            const label = routeLabel(route, descriptors);
            const showOrdersBadge = isSalesBar && route.name === 'orders' && activeOrdersCount > 0;
            const isShareTab = isConsumerBar && route.name === 'share';

            return (
              <Pressable
                key={route.key}
                onLayout={(e) => {
                  const { x, width: w } = e.nativeEvent.layout;
                  setTabLayouts((prev) => ({ ...prev, [index]: { x, w } }));
                }}
                onPress={() => {
                  HapticTap.selection();
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={({ pressed }) => [styles.tabItem, isShareTab && styles.shareTabItem, pressed && styles.tabItemPressed, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isActive }}
              >
                <View style={[styles.tabContent, isShareTab && styles.shareTabContent]}>
                  {isShareTab ? (
                    <View style={[styles.shareCenterButton, { backgroundColor: colors.systemBlue }, isActive && styles.shareCenterButtonActive]}>
                      <AppIcon name="QrCode" size={22} color="#FFFFFF" variant="solar-bold" />
                    </View>
                  ) : (
                    <>
                  <TabIcon
                    routeName={route.name}
                    active={isActive}
                    activeIconColor={activeIconColor}
                    inactiveIconColor={inactiveIconColor}
                    badgeLabel={showOrdersBadge ? ordersBadgeLabel : undefined}
                  />
                    </>
                  )}
                  <AppText
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                    style={[
                      styles.label,
                      isActive
                        ? [styles.labelActive, { color: isShareTab ? colors.textPrimary : activeLabelColor }]
                        : [styles.labelInactive, { color: colors.textMuted }],
                      isShareTab && styles.shareLabel,
                    ]}
                  >
                    {label}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </LiquidGlassChrome>
      </View>

      {showFloatingAction ? (
        <View style={styles.dockShadow}>
          <Pressable
            onPress={() => router.push(newOrderHref)}
            style={({ pressed }) => [pressed && styles.actionButtonPressed, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            accessibilityRole="button"
            accessibilityLabel="New sale"
          >
            <LiquidGlassChrome
              isDark={isDark}
              reduceTransparency={reduceTransparency}
              borderRadius={FAB_SIZE / 2}
              fallbackBackground={colors.surface}
              style={styles.fabGlass}
            >
              <View style={styles.fabIcon}>
                <Ionicons name="add" size={theme.iconSize.tab} color="#FFFFFF" />
              </View>
            </LiquidGlassChrome>
          </Pressable>
        </View>
      ) : null}
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
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: 'transparent',
  },
  roleDockShapeWrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    height: 88,
  },
  roleDockShape: {
    flex: 1,
  },
  dockShadow: {
    ...createShadow({ color: '#000000', offset: { width: 0, height: -2 }, opacity: 0.05, radius: 12, elevation: 8 }),
  },
  dockShadowFlex: {
    flex: 1,
  },
  bar: {
    minHeight: DOCK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  tabContent: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    zIndex: 2,
  },
  shareTabItem: {
    flex: 1.12,
  },
  shareTabContent: {
    gap: 1,
  },
  shareCenterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#007AFF', offset: { width: 0, height: 5 }, opacity: 0.22, radius: 12, elevation: 10 }),
  },
  shareCenterButtonActive: {
    transform: [{ scale: 1.02 }],
  },
  iconBadgeContainer: {
    position: 'relative',
    width: 36,
    height: 34,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
    zIndex: 2,
  },
  iconShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassPill: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 2,
    bottom: 2,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  slidingPill: {
    position: 'absolute',
    top: 18,
    borderRadius: 20,
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 2,
    zIndex: 3,
    minWidth: 18,
    minHeight: 18,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  badgeText: {
    color: theme.colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  label: {
    maxWidth: '100%',
    fontSize: 10,
    letterSpacing: 0,
    fontWeight: '500',
    lineHeight: 12,
  },
  labelActive: {
    fontWeight: '600',
  },
  labelInactive: {
    fontWeight: '500',
  },
  shareLabel: {
    marginTop: 0,
    fontWeight: '700',
  },
  actionButtonPressed: {
    opacity: 0.82,
  },
  fabGlass: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  fabIcon: {
    zIndex: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#111111', offset: { width: 0, height: 8 }, opacity: 0.24, radius: 16, elevation: 10 }),
  },
});
