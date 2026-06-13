import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { getLiquidTabIcon, LIQUID_TAB_ICON_SIZE } from '@/src/constants/liquidTabIcons';
import { appRoutes } from '@/src/constants/navigation';
import { SNAP_TAP_BRAND } from '@/src/constants/snapTapBrand';
import { theme } from '@/src/constants/theme';
import { glassTheme } from '@/src/design-system/glass';
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
const CONSUMER_TAB_ORDER = ['index', 'connections', 'profile', 'settings'] as const;

const DOCK_BLUR = glassTheme.blur.dock;
const DOCK_HEIGHT = 72;
const FAB_SIZE = theme.controlHeight.hero;

type BlurTint = 'light' | 'dark' | 'default' | 'extraLight' | 'regular' | 'prominent';

function dockBlurTint(isDark: boolean): BlurTint {
  return isDark ? 'dark' : 'light';
}

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
        {active ? (
          <View style={styles.glowCircle} />
        ) : null}
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
  const borderColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.55)';
  const fill = isDark ? 'rgba(28,28,30,0.36)' : 'rgba(255,255,255,0.22)';

  return (
    <BlurView
      intensity={reduceTransparency ? 0 : DOCK_BLUR}
      tint={dockBlurTint(isDark) as BlurTint}
      style={[
        { borderRadius, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor },
        { backgroundColor: reduceTransparency ? fallbackBackground : fill },
        style,
      ]}
    >
      {!reduceTransparency ? (
        <View pointerEvents="none" style={[styles.glassOverlay, { borderRadius }]}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(120,120,128,0.28)', 'rgba(44,44,46,0.10)', 'rgba(18,18,20,0.32)']
                : ['rgba(255,255,255,0.62)', 'rgba(210,228,255,0.28)', 'rgba(255,255,255,0.38)']
            }
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']
                : ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']
            }
            locations={[0, 0.35, 1]}
            style={[styles.glassSpecular, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', isDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.06)']}
            locations={[0.55, 1]}
            style={styles.glassDepth}
          />
          <View style={[styles.glassInnerStroke, { borderRadius: borderRadius - 1, borderColor }]} />
          <View
            style={[
              styles.glassTopShine,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.95)' },
            ]}
          />
        </View>
      ) : null}
      {children}
    </BlurView>
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
  const activeIconColor = isSalesBar ? colors.textPrimary : SNAP_TAP_BRAND;
  const inactiveIconColor = colors.textMuted;
  const activeLabelColor = isSalesBar ? colors.textPrimary : SNAP_TAP_BRAND;

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

            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.tabContent}>
                  {isActive ? (
                    <View
                      style={[
                        styles.glassPill,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.12)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.15)',
                        },
                        Platform.select({
                          web: {
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                          } as any,
                          default: {},
                        }),
                      ]}
                    >
                      <View style={styles.tinyHighlight} />
                    </View>
                  ) : null}
                  <TabIcon
                    routeName={route.name}
                    active={isActive}
                    activeIconColor={activeIconColor}
                    inactiveIconColor={inactiveIconColor}
                    badgeLabel={showOrdersBadge ? ordersBadgeLabel : undefined}
                  />
                  <AppText
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                    style={[
                      styles.label,
                      isActive
                        ? [styles.labelActive, { color: activeLabelColor }]
                        : [styles.labelInactive, { color: colors.textMuted }],
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
                <Ionicons name="add" size={theme.iconSize.tab} color={colors.textPrimary} />
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
  dockShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 12,
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
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glassSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  glassDepth: {
    ...StyleSheet.absoluteFillObject,
  },
  glassInnerStroke: {
    ...StyleSheet.absoluteFillObject,
    margin: 1.5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  glassTopShine: {
    position: 'absolute',
    top: StyleSheet.hairlineWidth * 2,
    left: 28,
    right: 28,
    height: StyleSheet.hairlineWidth,
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
  glowCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 150, 190, 0.15)', // soft blue glow matching SNAP_TAP_BRAND
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
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
  tinyHighlight: {
    position: 'absolute',
    top: 1,
    left: '25%',
    right: '25%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
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
  actionButtonPressed: {
    opacity: 0.82,
  },
  fabGlass: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
