/**
 * LiquidTabBar — Apple HIG-compliant tab bar.
 *
 * Apple HIG rules applied:
 * - Tab bar height: 49pt + safe area bottom
 * - Icon size: 24pt (Apple standard tab bar icon)
 * - Label: Caption 2 (10pt) — Apple tab bar standard
 * - Active tint: system blue (#0A84FF dark / #007AFF light)
 * - Inactive tint: labelSecondary (rgba(235,235,245,0.60) dark)
 * - Background: systemBackground with blur (glassmorphism per Apple HIG)
 * - Touch target: each tab is full height (44pt+ tap area)
 * - Haptic: .selection on every tab press
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, Animated } from 'react-native';
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

// ─── Apple HIG Tab Bar Constants ────────────────────────────────────────────
const TAB_BAR_HEIGHT = 49;                        // Apple HIG: 49pt tab bar
const TAB_ICON_SIZE  = 24;                        // Apple HIG: 24pt icons
const TAB_LABEL_SIZE = 10;                        // Apple HIG: 10pt labels

const SALES_ICON_MAP: Record<string, string> = {
  index:   'Home',
  orders:  'ClipboardList',
  payouts: 'Wallet',
  me:      'User',
};

// ─── Sales Tab Bar ───────────────────────────────────────────────────────────
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
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.94 : 1 }] }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
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
    bottom: 0,
    left: 0,
    right: 0,
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
    minHeight: 44,   // Apple HIG minimum touch target
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
    top: 2,
    right: 4,
    zIndex: 10,
    minWidth: 16,
    height: 16,
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

// ─── Main component ──────────────────────────────────────────────────────────
interface Props {
  state: any;
  navigation: any;
  descriptors?: Record<string, any>;
}
type RouteItem = { type: 'route'; route: any };
type NavItem = RouteItem;
const CONSUMER_TAB_ORDER = ['index', 'connections', 'share', 'profile', 'settings'] as const;

export function LiquidTabBar({ state, navigation, descriptors }: Props) {
  const { isDark } = usePreferences();
  const { user }   = useAuth();
  const insets     = useSafeAreaInsets();
  const tabRoutes  = state.routes;
  const activeRoute = tabRoutes[state.index];

  const activeOptions    = descriptors?.[activeRoute?.key]?.options ?? {};
  const isLegacyConn     = activeRoute?.name === 'attendance';
  const shouldHide       = !isLegacyConn && (activeOptions.href === null || activeOptions.tabBarStyle?.display === 'none');

  const isSalesBar = tabRoutes.some((r: any) => r.name === 'orders') && tabRoutes.some((r: any) => r.name === 'payouts');
  const isConsumerBar = !isSalesBar && tabRoutes.some((r: any) => r.name === 'index') && tabRoutes.some((r: any) => r.name === 'profile') && tabRoutes.some((r: any) => r.name === 'settings');

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
  const newOrderHref = isSalesBar ? appRoutes.sales.newOrder : appRoutes.newOrder;
  const items: NavItem[] = visibleRoutes.map((route: any) => ({ type: 'route', route }) as RouteItem);
  const activeIndex = items.findIndex((item) => item.route.name === activeRoute?.name);

  // Active indicator animation
  const TAB_W = 68; const PILL_W = 60;
  const animCenterX = useRef(new Animated.Value(8 + Math.max(0, activeIndex) * TAB_W + 4)).current;
  useEffect(() => {
    if (activeIndex !== -1) {
      Animated.spring(animCenterX, {
        toValue: 8 + activeIndex * TAB_W + (TAB_W - PILL_W) / 2,
        useNativeDriver: true,
        tension: 160, friction: 9,
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

  // Apple HIG dark tab bar colors
  const activeTint   = isDark ? '#0A84FF' : '#007AFF';            // system blue
  const inactiveTint = isDark ? 'rgba(235,235,245,0.60)' : 'rgba(60,60,67,0.60)'; // labelSecondary
  const barBg        = isDark ? 'rgba(28,28,30,0.94)' : 'rgba(255,255,255,0.92)';
  const barBorder    = isDark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.18)';

  // Bottom safe area + 49pt Apple standard
  const tabBarHeight = TAB_BAR_HEIGHT + Math.max(insets.bottom, 0);

  return (
    <View style={[styles.floatingDockWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[
        styles.floatingDock,
        { backgroundColor: barBg, borderColor: barBorder },
      ]}>
        {items.map((item) => {
          const route    = item.route;
          const isActive = activeRoute?.name === route.name;
          const color    = isActive ? activeTint : inactiveTint;

          let iconName: any = 'home-outline';
          let labelText = 'Home';

          if (route.name === 'index') {
            iconName  = isActive ? 'home' : 'home-outline';
            labelText = 'Home';
          } else if (route.name === 'connections' || route.name === 'attendance') {
            iconName  = isActive ? 'people' : 'people-outline';
            labelText = 'Contacts';
          } else if (route.name === 'share') {
            iconName  = isActive ? 'radio' : 'radio-outline';
            labelText = 'Beam';
          } else if (route.name === 'profile') {
            iconName  = isActive ? 'person' : 'person-outline';
            labelText = 'Bio';
          } else if (route.name === 'settings') {
            iconName  = isActive ? 'settings-sharp' : 'settings-outline';
            labelText = 'Settings';
          }

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                HapticTap.selection();
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => [
                styles.dockTabItem,
                pressed && { opacity: 0.65 },
              ]}
              accessibilityRole="tab"
              accessibilityLabel={labelText}
              accessibilityState={{ selected: isActive }}
              hitSlop={0}
            >
              <View style={styles.dockTabInner}>
                <Ionicons name={iconName} size={TAB_ICON_SIZE} color={color} />
                <AppText style={[styles.dockTabLabel, { color }]} weight={isActive ? 'semibold' : 'regular'}>
                  {labelText}
                </AppText>
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
  floatingDockWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none' as any,
    zIndex: 100,
  },
  floatingDock: {
    width: '92%',
    maxWidth: 360,
    // Apple HIG: 49pt tab bar height
    height: TAB_BAR_HEIGHT + 5,
    borderRadius: Math.round((TAB_BAR_HEIGHT + 5) / 2),
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    ...createShadow({ color: '#000000', offset: { width: 0, height: 8 }, opacity: 0.25, radius: 16, elevation: 12 }),
  },
  dockTabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // Ensures Apple 44pt minimum tap area
    minHeight: 44,
  },
  dockTabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dockTabLabel: {
    // Apple HIG: 10pt tab bar label
    fontSize: TAB_LABEL_SIZE,
    lineHeight: 13,
    letterSpacing: 0,
  },
});
