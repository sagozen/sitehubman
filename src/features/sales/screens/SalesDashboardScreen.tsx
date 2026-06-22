/**
 * SalesDashboardScreen
 * Design ref: dark canvas + white floating cards + big editorial text.
 * Sales accent: #FF9500 orange.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { memo, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppEmptyState, AppLoadingState } from '@/src/components/AppState';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { productTypeOptions } from '@/src/constants/options';
import { SalesBulkUpload } from '@/src/features/sales/components/SalesBulkUpload';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useOrders } from '@/src/hooks/useOrders';
import { isPaymentVerified } from '@/src/services/paymentVerificationService';
import type { Order } from '@/src/types/models';
import { needsSalesApproval } from '@/src/utils/orderProduction';
import { getOrderTotalUsd } from '@/src/utils/orderPricing';

// ─── Tokens ──────────────────────────────────────────────────────────────────

const C = {
  accent:    '#FF9500',
  accentDim: 'rgba(255,149,0,0.18)',
  bg1:       '#0D1F12',
  bg2:       '#1A3320',
  card:      '#FFFFFF',
  cardText:  '#111111',
  cardMuted: '#888888',
  white:     '#FFFFFF',
  whiteDim:  'rgba(255,255,255,0.55)',
  pill:      '#1E2E1E',
  pillBorder:'rgba(255,255,255,0.08)',
  green:     '#34C759',
  red:       '#FF3B30',
  blue:      '#007AFF',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) { return v.toFixed(2); }
function isPending(o: Order) {
  return ['draft','pending_payment','payment_submitted'].includes(o.status);
}
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

type SourceKey = 'guest'|'customer'|'manual'|'bulk';
const SOURCE_LABELS: Record<SourceKey,string> = {
  guest:'Guest', customer:'Customer', manual:'Manual', bulk:'Bulk',
};

// ─── OrderCard — white floating card ─────────────────────────────────────────

const OrderCard = memo(function OrderCard({ order }: { order: Order }) {
  const product  = productTypeOptions.find(p => p.value === order.productType);
  const label    = product?.label ?? order.productType?.replace(/_/g,' ') ?? 'Card';
  const verified = isPaymentVerified(order);
  const needs    = needsSalesApproval(order);
  const amount   = getOrderTotalUsd(order);

  let dotColor = C.blue;
  if (['delivered','ready_to_ship'].includes(order.status)) dotColor = C.green;
  else if (isPending(order)) dotColor = C.accent;
  else if (['payment_rejected','qa_failed','cancelled'].includes(order.status)) dotColor = C.red;

  return (
    <Pressable
      style={({ pressed }) => [oc.wrap, pressed && { opacity: 0.88 }]}
      onPress={() => router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })}
    >
      {/* Status bar */}
      <View style={[oc.bar, { backgroundColor: dotColor }]} />

      <View style={oc.body}>
        {/* Row 1 */}
        <View style={oc.row}>
          <AppText style={oc.name} numberOfLines={1}>{order.customerName}</AppText>
          <AppText style={[oc.amount, !verified && oc.amountMuted]}>${fmt(amount)}</AppText>
        </View>
        {/* Row 2 */}
        <View style={oc.row}>
          <AppText style={oc.meta} numberOfLines={1}>
            {order.orderNumber ?? `#${order.id.slice(0,6).toUpperCase()}`} · {label}
            {!verified ? ' · unpaid' : ''}
          </AppText>
          {needs ? (
            <View style={oc.approvePill}>
              <AppText style={oc.approveText}>Approve →</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const oc = StyleSheet.create({
  wrap: {
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
  },
  bar: { height: 3, width: '100%' },
  body: { padding: 16, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: C.cardText },
  amount: { fontSize: 16, fontWeight: '700', color: C.cardText },
  amountMuted: { color: C.cardMuted },
  meta: { flex: 1, fontSize: 13, color: C.cardMuted },
  approvePill: {
    backgroundColor: C.accentDim,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.accent,
  },
  approveText: { fontSize: 11, fontWeight: '800', color: C.accent },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SalesDashboardScreen() {
  const { user }             = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const { unreadCount }      = useNotifications();

  useEffect(() => { refresh(); }, [refresh]);

  const unpaid   = useMemo(() => orders.filter(o => !isPaymentVerified(o)), [orders]);
  const paid     = useMemo(() => orders.filter(o => isPaymentVerified(o)), [orders]);
  const unrealized = useMemo(() => unpaid.reduce((s,o) => s + getOrderTotalUsd(o), 0), [unpaid]);
  const realized   = useMemo(() => paid.reduce((s,o) => s + getOrderTotalUsd(o), 0), [paid]);
  const active     = useMemo(
    () => orders.filter(o => o.status !== 'delivered' && (o.cardStatus ?? 'active') !== 'closed'),
    [orders],
  );
  const pipeline       = useMemo(() => active.slice(0, 12), [active]);
  const pendingApproval = useMemo(() => orders.filter(needsSalesApproval), [orders]);
  const today          = useMemo(() => {
    const t = new Date().toDateString();
    return orders.filter(o => new Date(o.createdAt).toDateString() === t).length;
  }, [orders]);

  const firstName  = (user?.displayName ?? 'Sales').split(' ')[0];
  const totalPipe  = realized + unrealized;

  // Source category counts
  const srcCounts = useMemo(() => ({
    guest:    orders.filter(o => o.orderSource === 'guest'    && isPending(o)).length,
    customer: orders.filter(o => o.orderSource === 'customer' && isPending(o)).length,
    manual:   orders.filter(o => o.orderSource === 'manual'   && isPending(o)).length,
    bulk:     orders.filter(o => o.orderSource === 'bulk'     && isPending(o)).length,
  }), [orders]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[C.bg1, C.bg2, C.bg1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top','left','right']}>
        <IosScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Top row: name + bell ── */}
          <View style={s.topRow}>
            <View style={s.avatarCircle}>
              <AppText style={s.avatarLetter}>{firstName[0]?.toUpperCase() ?? 'S'}</AppText>
            </View>
            <View style={s.topCenter}>
              <AppText style={s.greeting}>{getGreeting()}</AppText>
              <AppText style={s.topName}>{firstName}</AppText>
            </View>
            <Pressable
              style={({ pressed }) => [s.iconCircle, pressed && { opacity: 0.7 }]}
              onPress={() => router.push(appRoutes.sales.newOrder)}
            >
              <AppIcon name="Plus" size={22} color={C.white} />
            </Pressable>
          </View>

          {/* ── Hero banner — white card on dark ── */}
          <View style={s.heroBanner}>
            <View style={s.heroLeft}>
              <AppText style={s.heroTitle}>Pipeline</AppText>
              <AppText style={s.heroAmount}>${fmt(totalPipe)}</AppText>
              <Pressable
                style={({ pressed }) => [s.heroBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.push(appRoutes.sales.orders)}
              >
                <AppText style={s.heroBtnText}>View orders</AppText>
              </Pressable>
            </View>
            <View style={s.heroRight}>
              <View style={s.heroStatItem}>
                <AppText style={s.heroStatVal}>${fmt(realized)}</AppText>
                <AppText style={s.heroStatLabel}>Earned</AppText>
              </View>
              <View style={s.heroStatItem}>
                <AppText style={s.heroStatVal}>{today}</AppText>
                <AppText style={s.heroStatLabel}>Today</AppText>
              </View>
            </View>
          </View>

          {/* ── Approval alert ── */}
          {pendingApproval.length > 0 ? (
            <Pressable
              style={({ pressed }) => [s.alertBanner, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(appRoutes.sales.orders)}
            >
              <AppText style={s.alertNum}>{pendingApproval.length}</AppText>
              <View>
                <AppText style={s.alertTitle}>Need approval</AppText>
                <AppText style={s.alertSub}>Tap to review →</AppText>
              </View>
            </Pressable>
          ) : null}

          {/* ── Sources ── */}
          <View style={s.sectionRow}>
            <AppText style={s.sectionTitle}>Sources</AppText>
            <Pressable hitSlop={12} onPress={() => router.push(appRoutes.sales.orders)}>
              <AppText style={s.seeAll}>See all</AppText>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sourceScroll}>
            {(Object.keys(srcCounts) as SourceKey[]).map(key => (
              <Pressable
                key={key}
                style={({ pressed }) => [s.sourcePill, pressed && { opacity: 0.75 }]}
                onPress={() => router.push(appRoutes.sales.orders)}
              >
                <AppText style={s.sourcePillCount}>{srcCounts[key]}</AppText>
                <AppText style={s.sourcePillLabel}>{SOURCE_LABELS[key]}</AppText>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Pipeline ── */}
          <View style={s.sectionRow}>
            <AppText style={s.sectionTitle}>Pipeline</AppText>
            {active.length > 0 ? (
              <Pressable hitSlop={12} onPress={() => router.push(appRoutes.sales.orders)}>
                <AppText style={s.seeAll}>See all {active.length}</AppText>
              </Pressable>
            ) : null}
          </View>

          {isLoading ? (
            <AppLoadingState title="Loading…" role="sales" />
          ) : pipeline.length === 0 ? (
            <AppEmptyState
              title="No active orders"
              description="Create a new order to get started."
              iconName="ClipboardList"
              role="sales"
            />
          ) : (
            pipeline.map(o => <OrderCard key={o.id} order={o} />)
          )}

          <SalesBulkUpload />

        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },

  // Top row
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: '#fff' },
  topCenter: { flex: 1, gap: 1 },
  greeting: { fontSize: 12, color: C.whiteDim, fontWeight: '400' },
  topName: { fontSize: 18, fontWeight: '700', color: C.white },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.pill,
    borderWidth: 1, borderColor: C.pillBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero banner — white card
  heroBanner: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroLeft: { flex: 1, gap: 8 },
  heroTitle: { fontSize: 12, fontWeight: '600', color: C.cardMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmount: { fontSize: 36, fontWeight: '800', color: C.cardText, letterSpacing: -1 },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: C.cardText,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  heroBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },
  heroRight: { gap: 16, paddingLeft: 16, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'rgba(0,0,0,0.12)' },
  heroStatItem: { alignItems: 'flex-end', gap: 2 },
  heroStatVal: { fontSize: 18, fontWeight: '700', color: C.cardText },
  heroStatLabel: { fontSize: 11, color: C.cardMuted },

  // Alert
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.accentDim,
    borderRadius: 18, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.accent,
  },
  alertNum: { fontSize: 36, fontWeight: '800', color: C.accent, letterSpacing: -1 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: C.white },
  alertSub: { fontSize: 12, color: C.whiteDim, marginTop: 2 },

  // Sources
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: C.white },
  seeAll: { fontSize: 14, color: C.whiteDim, fontWeight: '500' },
  sourceScroll: { gap: 10, paddingBottom: 16 },
  sourcePill: {
    backgroundColor: C.pill,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
    borderWidth: 1, borderColor: C.pillBorder,
    alignItems: 'center', gap: 4, minWidth: 84,
  },
  sourcePillCount: { fontSize: 22, fontWeight: '800', color: C.white },
  sourcePillLabel: { fontSize: 12, color: C.whiteDim, fontWeight: '500' },
});
