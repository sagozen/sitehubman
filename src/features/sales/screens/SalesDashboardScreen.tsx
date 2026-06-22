/**
 * SalesDashboardScreen — Performance-optimised Apple-quality dashboard.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { memo, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { AppIcon } from '@/src/components/AppIcon';
import { AppEmptyState, AppLoadingState } from '@/src/components/AppState';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { productTypeOptions } from '@/src/constants/options';
import { SalesBulkUpload } from '@/src/features/sales/components/SalesBulkUpload';
import { SalesGreetingHero } from '@/src/features/sales/components/SalesGreetingHero';
import { SalesKPIStrip } from '@/src/features/sales/components/SalesKPIStrip';
import { SalesActivityFeed } from '@/src/features/sales/components/SalesActivityFeed';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useOrders } from '@/src/hooks/useOrders';
import { isPaymentVerified } from '@/src/services/paymentVerificationService';
import { Order } from '@/src/types/models';
import { needsSalesApproval } from '@/src/utils/orderProduction';
import { getOrderTotalUsd } from '@/src/utils/orderPricing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function orderAmount(order: Order): number {
  return getOrderTotalUsd(order);
}

type NfcKind = 'pending' | 'verified' | 'failed' | 'none';

function nfcKind(order: Order): NfcKind {
  if (order.nfcEnabled === false) return 'none';
  if (['delivered', 'ready_to_ship', 'nfc_verification'].includes(order.status)) return 'verified';
  if ((order.cardStatus ?? 'active') === 'closed') return 'failed';
  return 'pending';
}

function isPending(order: Order): boolean {
  return ['draft', 'pending_payment', 'payment_submitted'].includes(order.status);
}

function urgencyScore(order: Order): 'high' | 'medium' | 'low' {
  if (order.priority === 'urgent') return 'high';
  const ageDays = (Date.now() - new Date(order.createdAt).getTime()) / 86_400_000;
  if (ageDays > 3) return 'high';
  if (ageDays > 1) return 'medium';
  return 'low';
}

// ─── RequestTile ──────────────────────────────────────────────────────────────

function RequestTile({
  label, count, icon, accent, tint, onPress,
}: {
  label: string; count: number;
  icon: 'User' | 'CircleUserRound' | 'PenLine' | 'Users';
  accent: string; tint: string; onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tilePressable, pressed && { opacity: 0.82 }]}
    >
      <View style={styles.tileCard}>
        <View style={styles.tileTop}>
          <View style={[styles.tileIcon, { backgroundColor: tint }]}>
            <AppIcon name={icon} size={18} color={accent} />
          </View>
          <View style={[styles.tileDot, count > 0 && { backgroundColor: salesUi.green }]} />
        </View>
        <AppText style={styles.tileCount}>{count}</AppText>
        <AppText style={styles.tileLabel} numberOfLines={1}>{label}</AppText>
      </View>
    </Pressable>
  );
}

// ─── OrderCard (pipeline) ─────────────────────────────────────────────────────

const PipelineOrderCard = memo(function PipelineOrderCard({ order }: { order: Order }) {
  const product = productTypeOptions.find((p) => p.value === order.productType);
  const productLabel = product?.label ?? order.productType?.replace(/_/g, ' ') ?? 'card';
  const nfc = nfcKind(order);
  const verified = isPaymentVerified(order);
  const urgency = needsSalesApproval(order) ? urgencyScore(order) : null;

  const urgencyColor = urgency === 'high' ? salesUi.red : urgency === 'medium' ? salesUi.accent : salesUi.green;
  const urgencyBg    = urgency === 'high' ? salesUi.redSoft : urgency === 'medium' ? salesUi.orangeSoft : salesUi.greenSoft;

  let pillColor = salesUi.blue; let pillBg = salesUi.blueSoft;
  if (['delivered','ready_to_ship'].includes(order.status)) { pillColor = salesUi.green; pillBg = salesUi.greenSoft; }
  else if (isPending(order)) { pillColor = salesUi.accent; pillBg = salesUi.orangeSoft; }

  return (
    <Pressable
      style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed]}
      onPress={() => router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })}
    >
      <View style={[styles.orderBar, { backgroundColor: pillColor }]} />
      <View style={styles.orderBody}>
        <View style={styles.orderRow}>
          <View style={styles.orderLeft}>
            <AppText style={styles.orderNumber}>
              {order.orderNumber ?? `#${order.id.slice(0,6).toUpperCase()}`}
            </AppText>
            <AppText style={styles.orderName} numberOfLines={1}>{order.customerName}</AppText>
          </View>
          <View style={styles.orderRight}>
            <AppText style={styles.orderAmount}>${orderAmount(order).toFixed(2)}</AppText>
            <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
              <AppText style={[styles.statusText, { color: pillColor }]}>
                {['delivered','ready_to_ship'].includes(order.status) ? 'Done' : isPending(order) ? 'Pending' : 'Active'}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.orderMeta}>
          <AppText style={styles.orderMetaText} numberOfLines={1}>
            {productLabel.toLowerCase()} · {order.cardCode}
            {!verified ? ' · awaiting pay' : ''}
          </AppText>
          <View style={styles.orderBadges}>
            {nfc !== 'none' ? (
              <View style={[styles.nfcBadge, {
                backgroundColor: nfc === 'verified' ? salesUi.greenSoft : nfc === 'failed' ? salesUi.redSoft : salesUi.orangeSoft
              }]}>
                <AppIcon name={nfc === 'verified' ? 'BadgeCheck' : nfc === 'failed' ? 'X' : 'Nfc'} size={10}
                  color={nfc === 'verified' ? salesUi.green : nfc === 'failed' ? salesUi.red : salesUi.accent} />
                <AppText style={[styles.nfcText, { color: nfc === 'verified' ? salesUi.green : nfc === 'failed' ? salesUi.red : salesUi.accent }]}>
                  {nfc === 'verified' ? 'NFC ✓' : nfc === 'failed' ? 'NFC ✗' : 'NFC'}
                </AppText>
              </View>
            ) : null}
            {urgency ? (
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyBg }]}>
                <AppIcon name="AlertCircle" size={9} color={urgencyColor} />
                <AppText style={[styles.urgencyText, { color: urgencyColor }]}>
                  {urgency === 'high' ? 'Urgent' : urgency === 'medium' ? 'Review' : 'Approve'}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

const SectionHeader = memo(function SectionHeader({ title, link, onPress }: { title: string; link?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {link ? (
        <Pressable onPress={onPress} hitSlop={12}>
          <AppText style={styles.sectionLink}>{link}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SalesDashboardScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const { unreadCount } = useNotifications();

  useEffect(() => { refresh(); }, [refresh]);

  const unpaidOrders = useMemo(() => orders.filter((o) => !isPaymentVerified(o)), [orders]);
  const paidOrders   = useMemo(() => orders.filter((o) => isPaymentVerified(o)), [orders]);
  const unrealized   = useMemo(() => unpaidOrders.reduce((s, o) => s + orderAmount(o), 0), [unpaidOrders]);
  const realized     = useMemo(() => paidOrders.reduce((s, o) => s + orderAmount(o), 0), [paidOrders]);
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== 'delivered' && (o.cardStatus ?? 'active') !== 'closed'),
    [orders],
  );
  const pipeline       = useMemo(() => activeOrders.slice(0, 12), [activeOrders]);
  const ordersToday    = useMemo(() => {
    const t = new Date().toDateString();
    return orders.filter((o) => new Date(o.createdAt).toDateString() === t).length;
  }, [orders]);
  const deliveredTotal = useMemo(() => orders.filter((o) => o.status === 'delivered').length, [orders]);
  const pendingApproval    = useMemo(() => orders.filter(needsSalesApproval), [orders]);
  const guestRequests      = useMemo(() => orders.filter((o) => o.orderSource === 'guest'    && isPending(o)), [orders]);
  const customerRequests   = useMemo(() => orders.filter((o) => o.orderSource === 'customer' && isPending(o)), [orders]);
  const manualRequests     = useMemo(() => orders.filter((o) => o.orderSource === 'manual'   && isPending(o)), [orders]);
  const bulkRequests       = useMemo(() => orders.filter((o) => o.orderSource === 'bulk'     && isPending(o)), [orders]);
  const avgOrderValue      = orders.length > 0 ? (orders.reduce((s, o) => s + orderAmount(o), 0) / orders.length) : 0;
  const conversionRate     = orders.length > 0 ? Math.round((deliveredTotal / orders.length) * 100) : 0;

  return (
    <GlassSafeScreen>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Greeting Hero ── */}
        <SalesGreetingHero
          displayName={user?.displayName ?? 'Sales'}
          totalRealized={realized}
          totalUnrealized={unrealized}
          paidCount={paidOrders.length}
          unpaidCount={unpaidOrders.length}
          quickActions={[
            { icon: 'Plus', label: 'New Order', onPress: () => router.push(appRoutes.sales.newOrder) },
            { icon: 'ClipboardList', label: 'Orders', onPress: () => router.push(appRoutes.sales.orders), badge: pendingApproval.length },
            { icon: 'Bell', label: 'Alerts', onPress: () => router.push(appRoutes.sales.notifications), badge: unreadCount },
          ]}
        />

        {/* ── KPI Strip ── */}
        <SectionHeader title="Performance" />
        <SalesKPIStrip items={[
          { label: 'Revenue', value: `$${realized.toFixed(0)}`, icon: 'DollarSign', tone: 'green',
            trend: realized > 0 ? 'up' : 'flat', trendLabel: `${paidOrders.length} paid`, onPress: () => router.push(appRoutes.sales.payouts) },
          { label: 'Pipeline', value: `$${unrealized.toFixed(0)}`, icon: 'TrendingUp', tone: 'orange',
            sub: `${unpaidOrders.length} unpaid`, onPress: () => router.push(appRoutes.sales.orders) },
          { label: 'Orders Today', value: String(ordersToday), icon: 'Calendar', tone: 'blue',
            sub: `${orders.length} total` },
          { label: 'Avg Value', value: `$${avgOrderValue.toFixed(0)}`, icon: 'BarChart2', tone: 'purple' },
          { label: 'Conversion', value: `${conversionRate}%`, icon: 'Target', tone: conversionRate >= 50 ? 'green' : 'orange',
            trendLabel: `${deliveredTotal} delivered` },
        ]} />

        {/* ── New Requests ── */}
        <SectionHeader title="New requests" link="Review all" onPress={() => router.push(appRoutes.sales.orders)} />
        <View style={styles.tileGrid}>
          <RequestTile label="Guest"    count={guestRequests.length}    icon="User"           accent={salesUi.blue}   tint={salesUi.blueSoft}   onPress={() => router.push(appRoutes.sales.orders)} />
          <RequestTile label="Customer" count={customerRequests.length} icon="CircleUserRound" accent={salesUi.green}  tint={salesUi.greenSoft}  onPress={() => router.push(appRoutes.sales.orders)} />
          <RequestTile label="Manual"   count={manualRequests.length}   icon="PenLine"        accent={salesUi.accent} tint={salesUi.orangeSoft} onPress={() => router.push(appRoutes.sales.orders)} />
          <RequestTile label="Bulk"     count={bulkRequests.length}     icon="Users"          accent={salesUi.purple} tint={salesUi.purpleSoft} onPress={() => router.push(appRoutes.sales.orders)} />
        </View>

        {/* ── Approval Banner ── */}
        {pendingApproval.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.approvalBanner, pressed && { opacity: 0.88 }]}
            onPress={() => router.push(appRoutes.sales.orders)}
          >
            <View style={styles.approvalLeft}>
              <View style={styles.approvalIcon}>
                <AppIcon name="AlertCircle" size={18} color={salesUi.accent} />
              </View>
              <View>
                <AppText style={styles.approvalTitle}>
                  {pendingApproval.length} order{pendingApproval.length === 1 ? '' : 's'} need approval
                </AppText>
                <AppText style={styles.approvalSub}>Review payment · Approve for production</AppText>
              </View>
            </View>
            <AppIcon name="ChevronRight" size={16} color={salesUi.accent} />
          </Pressable>
        ) : null}

        {/* ── Recent Activity ── */}
        {orders.length > 0 ? (
          <>
            <SectionHeader title="Recent activity" link="See pipeline" onPress={() => router.push(appRoutes.sales.orders)} />
            <SalesActivityFeed orders={orders} max={5} />
          </>
        ) : null}

        {/* ── Pipeline ── */}
        <SectionHeader title="Pipeline" link="See all" onPress={() => router.push(appRoutes.sales.orders)} />
        {isLoading ? (
          <AppLoadingState title="Loading pipeline…" role="sales" />
        ) : pipeline.length === 0 ? (
          <AppEmptyState
            title="No active orders"
            description="Create a new order to start the sales workflow."
            iconName="ClipboardList"
            role="sales"
          />
        ) : (
          <View style={styles.pipelineList}>
            {pipeline.map((order) => (
              <PipelineOrderCard key={order.id} order={order} />
            ))}
          </View>
        )}

        {/* ── Bulk Upload ── */}
        <SalesBulkUpload />

      </IosScrollView>

      {/* ── FAB: New Order ── */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push(appRoutes.sales.newOrder)}
      >
        <AppIcon name="Plus" size={26} color="#fff" />
      </Pressable>
    </GlassSafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 24, paddingBottom: 12,
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: salesUi.text, letterSpacing: 0.35 },
  sectionLink:  { fontSize: 15, fontWeight: '500', color: salesUi.blue },

  // Tiles
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tilePressable: { width: '47.5%' },
  tileCard: {
    backgroundColor: salesUi.surface, borderRadius: salesUi.radiusMd, padding: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: salesUi.border, minHeight: 96, gap: 5,
    ...salesUi.shadow,
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  tileIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: salesUi.border },
  tileCount: { fontSize: 26, fontWeight: '700', color: salesUi.text, letterSpacing: -0.5 },
  tileLabel: { fontSize: 12, fontWeight: '600', color: salesUi.muted },

  // Approval banner
  approvalBanner: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, backgroundColor: salesUi.orangeSoft, borderRadius: salesUi.radiusMd, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.3)', ...salesUi.shadow,
  },
  approvalLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  approvalIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,149,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  approvalTitle: { fontSize: 14, fontWeight: '700', color: salesUi.text },
  approvalSub:   { fontSize: 11, fontWeight: '500', color: salesUi.textSecondary, marginTop: 2 },

  // Pipeline
  pipelineList: { gap: 10 },
  orderCard: {
    flexDirection: 'row', alignItems: 'stretch', backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd, borderWidth: StyleSheet.hairlineWidth, borderColor: salesUi.border,
    overflow: 'hidden', ...salesUi.shadow,
  },
  orderCardPressed: { opacity: 0.86 },
  orderBar: { width: 3 },
  orderBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 6 },
  orderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  orderLeft: { flex: 1, minWidth: 0 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderNumber: { fontSize: 10, fontWeight: '700', color: salesUi.muted, letterSpacing: 0.4, marginBottom: 2 },
  orderName:   { fontSize: 15, fontWeight: '700', color: salesUi.text },
  orderAmount: { fontSize: 17, fontWeight: '700', color: salesUi.accent, letterSpacing: -0.3 },
  statusPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText:  { fontSize: 10, fontWeight: '700' },
  orderMeta:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  orderMetaText: { flex: 1, fontSize: 12, fontWeight: '400', color: salesUi.muted },
  orderBadges: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nfcBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 },
  nfcText:     { fontSize: 9, fontWeight: '700' },
  urgencyBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 },
  urgencyText: { fontSize: 9, fontWeight: '700' },

  // FAB
  fab: {
    position: 'absolute', bottom: 100, right: 22,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: salesUi.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: salesUi.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 6,
  },
  fabPressed: { transform: [{ scale: 0.93 }], opacity: 0.9 },
});
