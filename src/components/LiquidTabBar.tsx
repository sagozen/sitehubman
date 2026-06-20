import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { getLiquidTabIcon, LIQUID_TAB_ICON_SIZE } from '@/src/constants/liquidTabIcons';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePreferences } from '@/src/hooks/usePreferences';

interface Props {
  state: any;
  navigation: any;
  descriptors?: Record<string, any>;
}

type RouteItem = { type: 'route'; route: any };
type NavItem = RouteItem;

/** Guest + customer footer tabs — fixed order so Connections never drops off. */
const CONSUMER_TAB_ORDER = ['index', 'connections', 'share', 'profile', 'settings'] as const;

const DOCK_HEIGHT = 72;
const FAB_SIZE = theme.controlHeight.hero;

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
  return (
    <View style={styles.iconBadgeContainer}>
      {badgeLabel ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText} numberOfLines={1}>
            {badgeLabel}
          </AppText>
        </View>
      ) : null}
      <View style={styles.iconShell}>
        <Ionicons
          name={getLiquidTabIcon(routeName, active)}
          size={LIQUID_TAB_ICON_SIZE}
          color={active ? activeIconColor : inactiveIconColor}
        />
      </View>
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
  const activeOptions = descriptors?.[activeRoute?.key]?.options ?? {};
  const isLegacyConnectionsRoute = activeRoute?.name === 'attendance';
  const shouldHide =
    !isLegacyConnectionsRoute
    && (activeOptions.href === null || activeOptions.tabBarStyle?.display === 'none');

  const isSalesBar =
    tabRoutes.some((route: any) => route.name === 'orders') &&
    tabRoutes.some((route: any) => route.name === 'payouts');
  const isPrinterBar =
    tabRoutes.some((route: any) => route.name === 'queue') &&
    tabRoutes.some((route: any) => route.name === 'scan');
  const isConsumerBar =
    !isSalesBar &&
    !isPrinterBar &&
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
  const showFloatingAction = isSalesBar || isPrinterBar;
  const activeIconColor = colors.systemBlue;
  const inactiveIconColor = colors.textMuted;
  const activeLabelColor = colors.systemBlue;

  const isSalesUser = user?.role === 'sales';
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  useEffect(() => {
    if (!isSalesUser || !user?.id) {
      setActiveOrdersCount(0);
      return;
    }

    let cancelled = false;
    const task = setTimeout(() => {
      void (async () => {
        try {
          const { listOrders } = await import('@/src/services/firestoreService');
          const orders = await listOrders('sales', user.id);
          if (cancelled) return;
          setActiveOrdersCount(
            orders.filter((order) => order.status !== 'delivered' && (order.cardStatus ?? 'active') !== 'closed').length
          );
        } catch {
          if (!cancelled) setActiveOrdersCount(0);
        }
      })();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(task);
    };
  }, [isSalesUser, user?.id]);
  const ordersBadgeLabel = activeOrdersCount > 99 ? '99+' : activeOrdersCount > 0 ? String(activeOrdersCount) : '';

  const newOrderHref = isSalesBar
    ? appRoutes.sales.newOrder
    : isPrinterBar
      ? '/printer/scan'
      : appRoutes.newOrder;

  const items: NavItem[] = visibleRoutes.map((route: any) => ({ type: 'route', route }) as RouteItem);

  if (shouldHide) return null;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, theme.spacing.xs) }]}>
      {showFloatingAction ? (
        <View pointerEvents="none" style={styles.roleDockShapeWrap}>
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
          {items.map((item) => {
            const route = item.route;
            const isActive = activeRoute?.name === route.name;
            const label = routeLabel(route, descriptors);
            const showOrdersBadge = isSalesBar && route.name === 'orders' && activeOrdersCount > 0;
            const isShareTab = isConsumerBar && route.name === 'share';

            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={({ pressed }) => [styles.tabItem, isShareTab && styles.shareTabItem, pressed && styles.tabItemPressed]}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isActive }}
              >
                <View style={[styles.tabContent, isShareTab && styles.shareTabContent]}>
                  {isShareTab ? (
                    <View style={[styles.shareCenterButton, { backgroundColor: colors.systemBlue }, isActive && styles.shareCenterButtonActive]}>
                      <Ionicons name={getLiquidTabIcon(route.name, true)} size={25} color="#FFFFFF" />
                    </View>
                  ) : (
                    <>
                  {isActive ? (
                    <View
                      style={[
                        styles.glassPill,
                        {
                          backgroundColor: isDark ? 'rgba(10,132,255,0.16)' : 'rgba(0,122,255,0.10)',
                          borderColor: 'transparent',
                        },
                      ]}
                    >
                    </View>
                  ) : null}
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
            style={({ pressed }) => [pressed && styles.actionButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel={isPrinterBar ? 'Scan new job' : 'New sale'}
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
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
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 10,
  },
});
