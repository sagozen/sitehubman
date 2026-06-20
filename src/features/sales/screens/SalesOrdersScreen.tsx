/**
 * SalesOrdersScreen — Super wow edition.
 * Animated segment pill, urgency scores, Apple-quality grouped list.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable,
  StyleSheet, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { AppEmptyState } from '@/src/components/AppState';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  SalesCompactHero,
  salesCompactHeroStyles,
} from '@/src/features/sales/components/SalesCompactHero';
import { SalesSegment, salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { appRoutes } from '@/src/constants/navigation';
import { orderStatusOptions, productTypeOptions } from '@/src/constants/options';
import { formatOrderTotal } from '@/src/utils/orderPricing';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useOrders } from '@/src/hooks/useOrders';
import { useSearchQuery } from '@/src/hooks/useSearchQuery';
import { getAuthErrorMessage } from '@/src/services/authService';
import { SalesProductionApprovalModal } from '@/src/features/sales/components/SalesProductionApprovalModal';
import { confirmSalesProductionApproval } from '@/src/services/salesOrderApprovalService';
import { Order, SalesPaymentConfirmation } from '@/src/types/models';
import { isPhysicalFulfillment, needsSalesApproval } from '@/src/utils/orderProduction';

// ─── Filter types ─────────────────────────────────────────────────────────────

type OrderFilterKey = 'all'|'guest'|'customer'|'manual'|'bulk'|'physical_approval'|'ecard';
type SegmentLabel   = 'All'|'Guest'|'Customer'|'Manual'|'Bulk'|'Approval'|'eCard';

const SEG_TO_FILTER: Record<SegmentLabel, OrderFilterKey> = {
  All:'all', Guest:'guest', Customer:'customer', Manual:'manual',
  Bulk:'bulk', Approval:'physical_approval', eCard:'ecard',
};
const FILTER_TO_SEG: Record<OrderFilterKey, SegmentLabel> = {
  all:'All', guest:'Guest', customer:'Customer', manual:'Manual',
  bulk:'Bulk', physical_approval:'Approval', ecard:'eCard',
};
const SEGMENTS: SegmentLabel[] = ['All','Guest','Customer','Manual','Bulk','Approval','eCard'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusPill(order: Order) {
  if (['delivered','ready_to_ship'].includes(order.status))
    return { label:'Done',    color: salesUi.green,  bg: salesUi.greenSoft  };
  if (['draft','pending_payment','payment_submitted'].includes(order.status))
    return { label:'Pending', color: salesUi.accent, bg: salesUi.orangeSoft };
  if (['payment_rejected','qa_failed','cancelled'].includes(order.status))
    return { label:'Failed',  color: salesUi.red,    bg: salesUi.redSoft    };
  return   { label:'Active',  color: salesUi.blue,   bg: salesUi.blueSoft   };
}

function urgencyScore(order: Order): 'high'|'medium'|'low' {
  if (order.priority === 'urgent') return 'high';
  const days = (Date.now() - new Date(order.createdAt).getTime()) / 86_400_000;
  if (days > 3) return 'high';
  if (days > 1) return 'medium';
  return 'low';
}

function matchesFilter(order: Order, filter: OrderFilterKey) {
  if (filter === 'all') return true;
  if (filter === 'guest')    return order.orderSource === 'guest';
  if (filter === 'customer') return order.orderSource === 'customer';
  if (filter === 'manual')   return order.orderSource === 'manual';
  if (filter === 'bulk')     return order.orderSource === 'bulk';
  if (filter === 'physical_approval') return needsSalesApproval(order);
  if (filter === 'ecard') return !isPhysicalFulfillment(order);
  return true;
}

function matchesQuery(order: Order, query: string) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  const sl = orderStatusOptions.find((o) => o.value === order.status)?.label ?? order.status;
  const loose = (s: string) => s.toLowerCase().includes(q);
  return (
    loose(order.id) || loose(order.customerName ?? '') ||
    loose(order.phone ?? '') || loose(order.cardCode ?? '') ||
    loose(order.status ?? '') || loose(sl)
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({
  order, approving, onApprove,
}: {
  order: Order; approving: boolean; onApprove: (o: Order) => void;
}) {
  const product     = productTypeOptions.find((p) => p.value === order.productType);
  const productName = product?.label ?? order.productType?.replace(/_/g,' ') ?? 'Card';
  const pill        = statusPill(order);
  const showApprove = needsSalesApproval(order);
  const urgency     = showApprove ? urgencyScore(order) : null;

  const urgencyColor = urgency === 'high' ? salesUi.red : urgency === 'medium' ? salesUi.accent : salesUi.green;
  const urgencyBg    = urgency === 'high' ? salesUi.redSoft : urgency === 'medium' ? salesUi.orangeSoft : salesUi.greenSoft;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card, pressed && styles.cardPressed,
        showApprove && styles.cardNeedsAction,
      ]}
      onPress={() => router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })}
    >
      {/* Coloured left bar */}
      <View style={[styles.accentBar, { backgroundColor: pill.color }]} />

      <View style={styles.cardBody}>
        {/* Row 1: ID + name + pill + amount */}
        <View style={styles.cardTop}>
          <View style={styles.cardCopy}>
            <AppText style={styles.overline}>
              {order.orderNumber ?? `#${order.id.slice(0,6).toUpperCase()}`}
            </AppText>
            <AppText style={styles.customerName} numberOfLines={1}>
              {order.customerName}
            </AppText>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.pill, { backgroundColor: pill.bg }]}>
              <AppText style={[styles.pillText, { color: pill.color }]}>{pill.label}</AppText>
            </View>
            <AppText style={styles.amount}>{formatOrderTotal(order)}</AppText>
          </View>
        </View>

        {/* Row 2: meta + urgency badge */}
        <View style={styles.cardMeta}>
          <AppText style={styles.metaText} numberOfLines={1}>
            {productName} · {order.paymentStatus}
          </AppText>
          {urgency ? (
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyBg }]}>
              <AppIcon name="AlertCircle" size={10} color={urgencyColor} />
              <AppText style={[styles.urgencyText, { color: urgencyColor }]}>
                {urgency === 'high' ? 'Urgent' : urgency === 'medium' ? 'Review' : 'Approve'}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Approve button */}
        {showApprove ? (
          <Pressable
            style={[styles.approveBtn, approving && styles.approveBtnBusy]}
            disabled={approving}
            onPress={(e) => { e.stopPropagation(); onApprove(order); }}
          >
            <AppIcon name="CheckCircle" size={14} color="#fff" />
            <AppText style={styles.approveBtnText}>
              {approving ? 'Approving…' : 'Approve for Production'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SalesOrdersScreen() {
  const { user }            = useAuth();
  const { unreadCount }     = useNotifications();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const { input, setInput, query, submitSearch, clearSearch } = useSearchQuery();
  const [filter, setFilter]           = useState<OrderFilterKey>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalOrder, setApprovalOrder] = useState<Order | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(
    () => orders.filter((o) => matchesFilter(o, filter) && matchesQuery(o, query)),
    [filter, orders, query],
  );
  const segment = FILTER_TO_SEG[filter];

  // Count badges per segment for the hero
  const approvalCount = useMemo(() => orders.filter(needsSalesApproval).length, [orders]);

  function openApproval(order: Order) {
    if (!user?.id || approvingId) return;
    setApprovalOrder(order);
  }

  async function handleConfirmApproval(confirmation: SalesPaymentConfirmation) {
    if (!user?.id || !approvalOrder) return;
    setApprovingId(approvalOrder.id);
    try {
      await confirmSalesProductionApproval(approvalOrder.id, confirmation, user.id);
      await refresh();
      setApprovalOrder(null);
      Alert.alert('Sent to printer', 'Payment recorded and production job queued.');
    } catch (error) {
      Alert.alert('Approval failed', getAuthErrorMessage(error));
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <GlassSafeScreen>
      <IosScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <SalesCompactHero
          statusLabel="Orders"
          headline={`${orders.length} total`}
          caption={approvalCount > 0 ? `${approvalCount} need approval` : 'Track customer orders and delivery'}
          onNotifications={() => router.push(appRoutes.sales.notifications)}
          unreadCount={unreadCount}
          footerMeta={`${filtered.length} showing · ${segment}`}
          footerPill={query ? 'Filtered' : undefined}
        >
          {/* Search bar */}
          <View style={salesCompactHeroStyles.searchWrap}>
            <AppIcon name="Search" size={16} color={salesUi.muted} />
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={submitSearch}
              placeholder="Name, order ID, status…"
              placeholderTextColor={salesUi.muted}
              returnKeyType="search"
              style={salesCompactHeroStyles.searchInput}
            />
            {input.length > 0 ? (
              <Pressable onPress={clearSearch} hitSlop={8}>
                <AppIcon name="X" size={14} color={salesUi.muted} />
              </Pressable>
            ) : null}
          </View>
        </SalesCompactHero>

        {/* ── Segment ── */}
        <SalesSegment
          items={SEGMENTS}
          active={segment}
          onChange={(label) => setFilter(SEG_TO_FILTER[label])}
        />

        {/* ── List header ── */}
        <View style={styles.listHeader}>
          <AppText style={styles.listTitle}>Order list</AppText>
          <View style={styles.countBadge}>
            <AppText style={styles.countText}>{filtered.length}</AppText>
          </View>
        </View>

        {/* ── Content ── */}
        {isLoading && filtered.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={salesUi.accent} />
            <AppText style={styles.loadingText}>Loading orders…</AppText>
          </View>
        ) : filtered.length === 0 ? (
          <AppEmptyState
            role="sales" iconName="ClipboardList"
            title={query ? 'No matching orders' : 'No orders yet'}
            description={
              query
                ? `No results for "${query}". Try a different keyword.`
                : 'Create the first customer order from this sales account.'
            }
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                approving={approvingId === order.id}
                onApprove={openApproval}
              />
            ))}
          </View>
        )}
      </IosScrollView>

      <SalesProductionApprovalModal
        visible={Boolean(approvalOrder)}
        order={approvalOrder}
        busy={Boolean(approvingId)}
        onClose={() => setApprovalOrder(null)}
        onConfirm={handleConfirmApproval}
      />
    </GlassSafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },

  listHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 22, paddingBottom: 12, paddingHorizontal: 2,
  },
  listTitle: { fontSize: 22, fontWeight: '700', color: salesUi.text, letterSpacing: 0.35 },
  countBadge: {
    minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 8,
    backgroundColor: salesUi.orangeSoft, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,149,0,0.2)',
  },
  countText: { fontSize: 12, fontWeight: '700', color: salesUi.accent },

  list: { gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: salesUi.surface, borderRadius: salesUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth, borderColor: salesUi.border,
    overflow: 'hidden', ...salesUi.shadow,
  },
  cardPressed: { opacity: 0.86 },
  cardNeedsAction: { borderColor: 'rgba(255,149,0,0.35)' },
  accentBar: { width: 3 },
  cardBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 13 },

  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10,
  },
  cardCopy: { flex: 1, minWidth: 0 },
  overline: {
    fontSize: 10, fontWeight: '700', color: salesUi.muted,
    letterSpacing: 0.4, marginBottom: 3,
  },
  customerName: { fontSize: 16, fontWeight: '700', color: salesUi.text },
  cardRight: { alignItems: 'flex-end', gap: 5 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '700' },
  amount: { fontSize: 16, fontWeight: '700', color: salesUi.accent, letterSpacing: -0.3 },

  cardMeta: {
    marginTop: 8, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  metaText: { flex: 1, fontSize: 12, fontWeight: '500', color: salesUi.muted },
  urgencyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  urgencyText: { fontSize: 10, fontWeight: '700' },

  approveBtn: {
    marginTop: 10, alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: salesUi.accent, borderRadius: salesUi.radiusSm,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  approveBtnBusy: { opacity: 0.6 },
  approveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  loadingWrap: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, fontWeight: '500', color: salesUi.muted },
});
