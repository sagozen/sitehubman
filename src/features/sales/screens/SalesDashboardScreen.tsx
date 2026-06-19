import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GlassPressable } from '@/src/components/GlassPressable';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { GlassSurface } from '@/src/components/GlassSurface';
import { glassTheme } from '@/src/design-system/glass';
import { AppIcon } from '@/src/components/AppIcon';
import { AppEmptyState, AppLoadingState } from '@/src/components/AppState';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { productTypeOptions } from '@/src/constants/options';
import { SalesBulkUpload } from '@/src/features/sales/components/SalesBulkUpload';
import {
  SalesCompactHero,
  SalesHeroEarningsRow,
} from '@/src/features/sales/components/SalesCompactHero';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { productPhotoIds } from '@/src/constants/productPhotoCatalog';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useOrders } from '@/src/hooks/useOrders';
import { isPaymentVerified } from '@/src/services/paymentVerificationService';
import { Order } from '@/src/types/models';
import { needsSalesApproval } from '@/src/utils/orderProduction';

const ACCENT_ORANGE = '#FF9500';
function orderAmount(order: Order) {
  const product = productTypeOptions.find((item) => item.value === order.productType);
  return order.quantity * (product?.price ?? 6.99);
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type NfcBadgeKind = 'pending' | 'verified' | 'failed' | 'none';

function nfcBadgeKind(order: Order): NfcBadgeKind {
  if (order.nfcEnabled === false) return 'none';
  if (order.status === 'delivered' || order.status === 'ready_to_ship') return 'verified';
  if (order.status === 'nfc_verification') return 'verified';
  if ((order.cardStatus ?? 'active') === 'closed') return 'failed';
  return 'pending';
}

function RequestTile({
  label,
  count,
  icon,
  accent,
  tint,
}: {
  label: string;
  count: number;
  icon: 'User' | 'CircleUserRound' | 'PenLine' | 'Users';
  accent: string;
  tint: string;
}) {
  return (
    <GlassSurface
      intensity="subtle"
      borderRadius={glassTheme.radius.panel}
      style={styles.requestTileWrap}
      contentStyle={styles.requestTile}
    >
      <View style={styles.requestTileTop}>
        <View style={[styles.requestIconWrap, { backgroundColor: tint }]}>
          <AppIcon name={icon} size={18} color={accent} />
        </View>
        <View style={styles.requestStatusDot} />
      </View>
      <AppText style={styles.requestCount}>{count}</AppText>
      <AppText style={styles.requestLabel} numberOfLines={1}>{label}</AppText>
    </GlassSurface>
  );
}

function OrderCard({ order }: { order: Order }) {
  const product = productTypeOptions.find((item) => item.value === order.productType);
  const productLabel = product?.label ?? order.productType?.replace(/_/g, ' ') ?? 'card';
  const nfc = nfcBadgeKind(order);

  return (
    <GlassPressable
      style={styles.orderCardPress}
      onPress={() => router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })}
    >
      <GlassSurface intensity="medium" borderRadius={glassTheme.radius.card} elevated contentStyle={styles.orderCard}>
      <View style={styles.orderTop}>
        <View style={styles.orderLeft}>
          <AppText style={styles.orderId}>{order.orderNumber ?? `#${order.id.slice(0, 6).toUpperCase()}`}</AppText>
          <AppText style={styles.orderName} numberOfLines={1}>
            {order.customerName}
          </AppText>
        </View>
        <AppText style={styles.orderAmount}>${formatMoney(orderAmount(order))}</AppText>
      </View>
      <View style={styles.orderMeta}>
        <AppText style={styles.orderType} numberOfLines={1}>
          {productLabel.toLowerCase()} · {order.cardCode}
          {!isPaymentVerified(order) ? ' · awaiting payment' : ''}
        </AppText>
        {nfc !== 'none' ? (
          <View
            style={[
              styles.nfcBadge,
              nfc === 'verified' && styles.nfcVerified,
              nfc === 'pending' && styles.nfcPending,
              nfc === 'failed' && styles.nfcFailed,
            ]}
          >
            <AppIcon
              name={nfc === 'verified' ? 'BadgeCheck' : nfc === 'failed' ? 'X' : 'Nfc'}
              size={12}
              color={nfc === 'verified' ? '#34C759' : nfc === 'failed' ? '#FF3B30' : ACCENT_ORANGE}
            />
            <AppText
              style={[
                styles.nfcBadgeText,
                nfc === 'verified' && styles.nfcVerifiedText,
                nfc === 'pending' && styles.nfcPendingText,
                nfc === 'failed' && styles.nfcFailedText,
              ]}
            >
              {nfc === 'verified' ? 'NFC Verified' : nfc === 'failed' ? 'NFC Failed' : 'NFC Pending'}
            </AppText>
          </View>
        ) : null}
      </View>
      </GlassSurface>
    </GlassPressable>
  );
}

export default function SalesDashboardScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const { unreadCount } = useNotifications();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unpaidOrders = useMemo(
    () => orders.filter((order) => !isPaymentVerified(order)),
    [orders]
  );
  const paidOrders = useMemo(
    () => orders.filter((order) => isPaymentVerified(order)),
    [orders]
  );
  const unrealized = useMemo(
    () => unpaidOrders.reduce((sum, order) => sum + orderAmount(order), 0),
    [unpaidOrders]
  );
  const realized = useMemo(
    () => paidOrders.reduce((sum, order) => sum + orderAmount(order), 0),
    [paidOrders]
  );
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status !== 'delivered' && (order.cardStatus ?? 'active') !== 'closed'
      ),
    [orders]
  );
  const pipeline = useMemo(() => activeOrders.slice(0, 15), [activeOrders]);
  const ordersToday = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.createdAt).toDateString() === today).length;
  }, [orders]);

  const pendingApproval = useMemo(
    () => orders.filter((order) => needsSalesApproval(order)),
    [orders]
  );
  const guestRequests = useMemo(
    () => orders.filter((order) => order.orderSource === 'guest' && ['draft', 'pending_payment', 'payment_submitted'].includes(order.status)),
    [orders]
  );
  const customerRequests = useMemo(
    () => orders.filter((order) => order.orderSource === 'customer' && ['draft', 'pending_payment', 'payment_submitted'].includes(order.status)),
    [orders]
  );
  const manualRequests = useMemo(
    () => orders.filter((order) => order.orderSource === 'manual' && ['draft', 'pending_payment', 'payment_submitted'].includes(order.status)),
    [orders]
  );
  const bulkRequests = useMemo(
    () => orders.filter((order) => order.orderSource === 'bulk' && ['draft', 'pending_payment', 'payment_submitted'].includes(order.status)),
    [orders]
  );

  const recommendation =
    activeOrders.length > 0
      ? {
          title: `${activeOrders.length} active order${activeOrders.length === 1 ? '' : 's'}`,
          subtitle:
            unrealized > 0
              ? `${unpaidOrders.length} unpaid — customer completes KHQR/ABA; you approve for print when paid.`
              : 'Keep the pipeline moving to delivery.',
          route: appRoutes.sales.orders,
        }
      : {
          title: 'Ready for the next customer',
          subtitle: 'Create an order with fulfilment details in one flow.',
          route: appRoutes.sales.newOrder,
        };

  return (
    <GlassSafeScreen>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SalesCompactHero
          productPhotoId={productPhotoIds.salesDashboard}
          photoCacheKey="sales-dashboard-hero"
          headline={user?.displayName ?? 'Sales'}
          caption={formatToday()}
          onPress={() => router.push(appRoutes.sales.payouts)}
          onSearch={() => router.push(appRoutes.sales.orders)}
          onNotifications={() => router.push(appRoutes.sales.notifications)}
          unreadCount={unreadCount}
          footerMeta={`${ordersToday} order${ordersToday === 1 ? '' : 's'} today · View payouts`}
          footerPill={activeOrders.length > 0 ? `${activeOrders.length} active` : undefined}
        >
          <SalesHeroEarningsRow
            unrealized={`$${formatMoney(unrealized)}`}
            commission={`$${formatMoney(realized)}`}
            unrealizedCount={unpaidOrders.length}
            commissionCount={paidOrders.length}
          />
        </SalesCompactHero>
        <GlassPressable onPress={() => router.push(recommendation.route)} style={styles.recommendPress}>
          <GlassSurface intensity="medium" borderRadius={glassTheme.radius.card} elevated contentStyle={styles.recommendCard}>
            <View style={styles.recIcon}>
              <AppIcon name="ClipboardList" size={20} color={ACCENT_ORANGE} />
            </View>
            <View style={styles.recBody}>
              <AppText style={styles.recTop}>Recommended</AppText>
              <AppText style={styles.recTitle}>{recommendation.title}</AppText>
              <AppText style={styles.recSub} numberOfLines={1}>
                {recommendation.subtitle}
              </AppText>
            </View>
            <AppIcon name="ChevronRight" size={18} color="rgba(60,60,67,0.28)" />
          </GlassSurface>
        </GlassPressable>

        <View style={styles.sectionHeader}>
          <AppText style={styles.secTitle}>New requests</AppText>
          <Pressable onPress={() => router.push(appRoutes.sales.orders)} hitSlop={10}>
            <AppText style={styles.secLink}>Review all</AppText>
          </Pressable>
        </View>
        <View style={styles.requestGrid}>
          <RequestTile label="From guest" count={guestRequests.length} icon="User" accent="#007AFF" tint="#EFF6FF" />
          <RequestTile label="From customer" count={customerRequests.length} icon="CircleUserRound" accent="#34C759" tint="#ECFDF3" />
          <RequestTile label="Manual order" count={manualRequests.length} icon="PenLine" accent="#FF9500" tint="#FFF7ED" />
          <RequestTile label="Bulk company" count={bulkRequests.length} icon="Users" accent="#5856D6" tint="#F0EEFF" />
        </View>
        {pendingApproval.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.approveBanner, pressed && styles.pressed]}
            onPress={() => router.push(appRoutes.sales.orders)}
          >
            <AppText style={styles.approveBannerTitle}>
              {pendingApproval.length} physical order{pendingApproval.length === 1 ? '' : 's'} awaiting approval
            </AppText>
            <AppText style={styles.approveBannerSub}>Review design, payment, then approve for production</AppText>
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}>
          <AppText style={styles.secTitle}>Pipeline</AppText>
          <Pressable onPress={() => router.push(appRoutes.sales.orders)} hitSlop={10}>
            <AppText style={styles.secLink}>See all</AppText>
          </Pressable>
        </View>

        {isLoading ? (
          <AppLoadingState title="Loading pipeline..." role="sales" />
        ) : pipeline.length === 0 ? (
          <AppEmptyState
            title="No active orders"
            description="Create a new order to start the sales workflow."
            iconName="ClipboardList"
            role="sales"
          />
        ) : (
          <View style={styles.pipeline}>
            {pipeline.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}

        <SalesBulkUpload />
      </IosScrollView>
    </GlassSafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  recommendPress: {
    marginTop: 14,
  },
  recommendCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBody: { flex: 1, minWidth: 0 },
  recTop: {
    fontSize: 11,
    color: 'rgba(60,60,67,0.6)',
    marginBottom: 1,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0,
  },
  recSub: {
    fontSize: 11,
    color: 'rgba(60,60,67,0.6)',
    marginTop: 1,
  },
  pressed: { opacity: 0.88 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 10,
  },
  secTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0,
  },
  secLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  requestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 4,
  },
  requestTileWrap: {
    width: '48%',
  },
  requestTile: {
    minHeight: 88,
    padding: 12,
    gap: 4,
  },
  requestTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  requestStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  requestCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    letterSpacing: -0.3,
  },
  requestLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#86868B',
  },
  approveBanner: {
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    borderRadius: salesUi.radiusMd,
    backgroundColor: '#FFF7ED',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FF9500',
    gap: 4,
  },
  approveBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  approveBannerSub: {
    fontSize: 12,
    color: '#86868B',
  },
  pipeline: {
    gap: glassTheme.spacing.cardPad,
  },
  orderCardPress: {},
  orderCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  orderLeft: { flex: 1, minWidth: 0, paddingRight: 8 },
  orderId: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(60,60,67,0.6)',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  orderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT_ORANGE,
    letterSpacing: 0,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 9,
    gap: 8,
  },
  orderType: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(60,60,67,0.6)',
  },
  nfcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  nfcPending: { backgroundColor: '#FFF8F0' },
  nfcVerified: { backgroundColor: '#F0FFF5' },
  nfcFailed: { backgroundColor: '#FFF0F0' },
  nfcBadgeText: { fontSize: 11, fontWeight: '600' },
  nfcPendingText: { color: ACCENT_ORANGE },
  nfcVerifiedText: { color: '#34C759' },
  nfcFailedText: { color: '#FF3B30' },
});
