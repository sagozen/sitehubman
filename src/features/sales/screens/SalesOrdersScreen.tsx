import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { AppEmptyState } from '@/src/components/AppState';
import { AppIcon } from '@/src/components/AppIcon';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';
import { AppText } from '@/src/components/AppText';
import {
  SalesCompactHero,
  salesCompactHeroStyles,
} from '@/src/features/sales/components/SalesCompactHero';
import { productPhotoIds } from '@/src/constants/productPhotoCatalog';
import { appRoutes } from '@/src/constants/navigation';
import { orderStatusOptions, productTypeOptions } from '@/src/constants/options';
import { formatOrderTotal } from '@/src/utils/orderPricing';
import { theme } from '@/src/constants/theme';
import { SalesSegment, salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useOrders } from '@/src/hooks/useOrders';
import { useSearchQuery } from '@/src/hooks/useSearchQuery';
import { getAuthErrorMessage } from '@/src/services/authService';
import { SalesProductionApprovalModal } from '@/src/features/sales/components/SalesProductionApprovalModal';
import { confirmSalesProductionApproval } from '@/src/services/salesOrderApprovalService';
import { Order, SalesPaymentConfirmation } from '@/src/types/models';
import { isPhysicalFulfillment, needsSalesApproval } from '@/src/utils/orderProduction';

const ACCENT_ORANGE = '#FF9500';

type OrderFilterKey = 'all' | 'guest' | 'customer' | 'manual' | 'bulk' | 'physical_approval' | 'ecard';
type SegmentLabel = 'All' | 'Guest' | 'Customer' | 'Manual' | 'Bulk' | 'Approval' | 'eCard';

const SEGMENT_TO_FILTER: Record<SegmentLabel, OrderFilterKey> = {
  All: 'all',
  Guest: 'guest',
  Customer: 'customer',
  Manual: 'manual',
  Bulk: 'bulk',
  Approval: 'physical_approval',
  eCard: 'ecard',
};

const FILTER_TO_SEGMENT: Record<OrderFilterKey, SegmentLabel> = {
  all: 'All',
  guest: 'Guest',
  customer: 'Customer',
  manual: 'Manual',
  bulk: 'Bulk',
  physical_approval: 'Approval',
  ecard: 'eCard',
};

const SEGMENT_ITEMS: SegmentLabel[] = ['All', 'Guest', 'Customer', 'Manual', 'Bulk', 'Approval', 'eCard'];

function moneyLabel(order: Order) {
  return formatOrderTotal(order);
}

function statusPill(order: Order) {
  if (order.status === 'delivered' || order.status === 'ready_to_ship') {
    return { label: 'Done', color: '#16A34A', bg: '#ECFDF3' };
  }
  if (order.status === 'draft' || order.status === 'pending_payment' || order.status === 'payment_submitted') {
    return { label: 'Pending', color: '#EA580C', bg: '#FFF7ED' };
  }
  return { label: 'Active', color: '#2563EB', bg: '#EFF6FF' };
}

function orderMatchesFilter(order: Order, filter: OrderFilterKey) {
  if (filter === 'all') return true;
  if (filter === 'guest') return order.orderSource === 'guest';
  if (filter === 'customer') return order.orderSource === 'customer';
  if (filter === 'manual') return order.orderSource === 'manual';
  if (filter === 'bulk') return order.orderSource === 'bulk';
  if (filter === 'physical_approval') return needsSalesApproval(order);
  if (filter === 'ecard') return !isPhysicalFulfillment(order);
  return true;
}

function OrderCard({
  order,
  approving,
  onApprove,
}: {
  order: Order;
  approving: boolean;
  onApprove: (order: Order) => void;
}) {
  const product = productTypeOptions.find((item) => item.value === order.productType);
  const productName = product?.label ?? order.productType?.replace(/_/g, ' ') ?? 'Card';
  const pill = statusPill(order);
  const showApprove = needsSalesApproval(order);

  return (
    <Pressable
      style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed]}
      onPress={() => router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })}
    >
      <SquircleIconTile name="ClipboardList" sizeKey="sm" iconColor={salesUi.accent} />
      <View style={styles.orderMain}>
        <View style={styles.orderTop}>
          <View style={styles.orderCopy}>
            <AppText style={styles.orderOverline}>ORDER #{order.id.slice(0, 6).toUpperCase()}</AppText>
            <AppText style={styles.orderName} numberOfLines={1}>
              {order.customerName}
            </AppText>
          </View>
          <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
            <AppText style={[styles.statusPillText, { color: pill.color }]}>{pill.label}</AppText>
          </View>
        </View>
        <View style={styles.orderBottom}>
          <AppText style={styles.orderMeta} numberOfLines={1}>
            {productName} · {order.paymentStatus}
          </AppText>
          <AppText style={styles.orderAmount}>{moneyLabel(order)}</AppText>
        </View>
        {showApprove ? (
          <Pressable
            style={[styles.approveBtn, approving && styles.approveBtnDisabled]}
            disabled={approving}
            onPress={(event) => {
              event.stopPropagation();
              onApprove(order);
            }}
          >
            <AppText style={styles.approveBtnText}>
              {approving ? 'Approving...' : 'Approve for Production'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function orderMatchesQuery(order: Order, query: string) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  const statusLabel = orderStatusOptions.find((o) => o.value === order.status)?.label ?? order.status;

  return (
    includesLoose(order.id, q)
    || includesLoose(order.id.slice(0, 8), q)
    || includesLoose(order.customerName ?? '', q)
    || includesLoose(order.phone ?? '', q)
    || includesLoose(order.cardCode ?? '', q)
    || includesLoose(order.status ?? '', q)
    || includesLoose(statusLabel, q)
  );
}

export default function SalesOrdersScreen() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const { input, setInput, query, submitSearch, clearSearch } = useSearchQuery();
  const [filter, setFilter] = useState<OrderFilterKey>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalOrder, setApprovalOrder] = useState<Order | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      return orderMatchesFilter(order, filter) && orderMatchesQuery(order, query);
    });
  }, [filter, orders, query]);

  const segment = FILTER_TO_SEGMENT[filter];

  function openApproval(order: Order) {
    if (!user?.id || approvingId) return;
    setApprovalOrder(order);
  }

  async function handleConfirmApproval(confirmation: SalesPaymentConfirmation) {
    if (!user?.id || !approvalOrder) return;
    setApprovingId(approvalOrder.id);
    try {
      const approved = await confirmSalesProductionApproval(approvalOrder.id, confirmation, user.id);
      await refresh();
      setApprovalOrder(null);
      if (approved) {
        Alert.alert('Sent to printer', 'Payment recorded and production job queued.');
      } else if (confirmation === 'hold') {
        Alert.alert('On hold', 'Order is on hold — no printer job yet.');
      } else if (confirmation === 'unpaid') {
        Alert.alert('Recorded', 'Payment status saved as unpaid — no printer job yet.');
      }
    } catch (error) {
      Alert.alert('Approval failed', getAuthErrorMessage(error));
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <GlassSafeScreen>
      <IosScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <SalesCompactHero
          productPhotoId={productPhotoIds.salesDashboard}
          photoCacheKey="sales-orders-hero"
          statusLabel="Orders"
          headline={`${orders.length} total`}
          caption="Track customer orders and delivery"
          onNotifications={() => router.push(appRoutes.sales.notifications)}
          unreadCount={unreadCount}
          footerMeta={`${filtered.length} showing in ${segment}`}
          footerPill={query ? 'Filtered' : undefined}
        >
          <View style={salesCompactHeroStyles.searchWrap}>
            <AppIcon name="Search" size={16} color="rgba(255,255,255,0.45)" />
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={submitSearch}
              placeholder="Search orders"
              placeholderTextColor="rgba(255,255,255,0.35)"
              returnKeyType="search"
              style={salesCompactHeroStyles.searchInput}
            />
            {input.length > 0 ? (
              <Pressable onPress={clearSearch} hitSlop={8}>
                <AppIcon name="X" size={14} color="rgba(255,255,255,0.45)" />
              </Pressable>
            ) : null}
          </View>
        </SalesCompactHero>

        <SalesSegment
          items={SEGMENT_ITEMS}
          active={segment}
          onChange={(label) => setFilter(SEGMENT_TO_FILTER[label])}
        />

        <View style={styles.listHeader}>
          <AppText style={styles.listTitle}>Order list</AppText>
          <AppText style={styles.listCount}>{filtered.length} visible</AppText>
        </View>

        {isLoading && filtered.length === 0 ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={salesUi.accent} />
            <AppText style={styles.loadingText}>Loading orders...</AppText>
          </View>
        ) : filtered.length === 0 ? (
          <AppEmptyState
            role="sales"
            iconName="ClipboardList"
            title={query ? 'No matching orders' : 'No orders yet'}
            description={
              query
                ? `No results for "${query}". Try a different keyword or switch filters.`
                : 'Create the first customer order from this sales account.'
            }
          />
        ) : (
          <View style={styles.orderList}>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: salesUi.bg,
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: salesUi.text,
  },
  listCount: {
    fontSize: 12,
    fontWeight: '700',
    color: salesUi.muted,
  },
  orderList: {
    gap: 10,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    ...salesUi.shadow,
  },
  orderCardPressed: {
    opacity: 0.88,
  },
  orderMain: {
    flex: 1,
    minWidth: 0,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderCopy: {
    flex: 1,
    minWidth: 0,
  },
  orderOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: salesUi.muted,
  },
  orderName: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: salesUi.text,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderBottom: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderMeta: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: salesUi.muted,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: ACCENT_ORANGE,
  },
  approveBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: salesUi.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  approveBtnDisabled: {
    opacity: 0.6,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stateWrap: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: salesUi.muted,
    fontWeight: '600',
  },
});
