/**
 * SalesOrdersScreen — dark canvas, white cards, pill filter.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppEmptyState } from '@/src/components/AppState';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SalesProductionApprovalModal } from '@/src/features/sales/components/SalesProductionApprovalModal';
import { appRoutes } from '@/src/constants/navigation';
import { orderStatusOptions, productTypeOptions } from '@/src/constants/options';
import { formatOrderTotal } from '@/src/utils/orderPricing';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { useSearchQuery } from '@/src/hooks/useSearchQuery';
import { getAuthErrorMessage } from '@/src/services/authService';
import { confirmSalesProductionApproval } from '@/src/services/salesOrderApprovalService';
import type { Order, SalesPaymentConfirmation } from '@/src/types/models';
import { isPhysicalFulfillment, needsSalesApproval } from '@/src/utils/orderProduction';
import { isPaymentVerified } from '@/src/services/paymentVerificationService';

const C = {
  accent: '#FF9500', accentDim: 'rgba(255,149,0,0.18)',
  bg1: '#0D1F12', bg2: '#1A3320',
  card: '#FFFFFF', cardText: '#111111', cardMuted: '#888888',
  white: '#FFFFFF', whiteDim: 'rgba(255,255,255,0.55)',
  pill: '#1E2E1E', pillBorder: 'rgba(255,255,255,0.08)',
  green: '#34C759', red: '#FF3B30', blue: '#007AFF',
};

type Filter = 'all' | 'approval' | 'active' | 'done';
const FILTERS: Filter[] = ['all', 'approval', 'active', 'done'];
const FL: Record<Filter, string> = { all: 'All', approval: 'Approve', active: 'Active', done: 'Done' };

function matchF(o: Order, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'approval') return needsSalesApproval(o);
  if (f === 'done') return ['delivered','ready_to_ship'].includes(o.status);
  return !['delivered','cancelled','qa_failed','payment_rejected'].includes(o.status) && !needsSalesApproval(o);
}

function matchQ(o: Order, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  const sl = orderStatusOptions.find(x => x.value === o.status)?.label ?? o.status;
  return [o.id, o.customerName??'', o.phone??'', o.cardCode??'', o.status??'', sl].some(v => v.toLowerCase().includes(s));
}

function dotColor(o: Order): string {
  if (['delivered','ready_to_ship'].includes(o.status)) return C.green;
  if (['draft','pending_payment','payment_submitted'].includes(o.status)) return C.accent;
  if (['payment_rejected','qa_failed','cancelled'].includes(o.status)) return C.red;
  return C.blue;
}

function Card({ order, approving, onApprove }: { order: Order; approving: boolean; onApprove: (o: Order) => void }) {
  const product = productTypeOptions.find(p => p.value === order.productType);
  const productName = product?.label ?? order.productType?.replace(/_/g,' ') ?? 'Card';
  const showApprove = needsSalesApproval(order);
  const verified = isPaymentVerified(order);
  const dc = dotColor(order);

  return (
    <Pressable
      style={({ pressed }) => [card.wrap, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })}
    >
      <View style={[card.topBar, { backgroundColor: dc }]} />
      <View style={card.body}>
        <View style={card.row}>
          <AppText style={card.name} numberOfLines={1}>{order.customerName}</AppText>
          <AppText style={[card.amount, !verified && { color: C.cardMuted }]}>{formatOrderTotal(order)}</AppText>
        </View>
        <AppText style={card.meta} numberOfLines={1}>
          {order.orderNumber ?? `#${order.id.slice(0,6).toUpperCase()}`} · {productName}
          {!verified ? ' · unpaid' : ''}
        </AppText>
        {showApprove ? (
          <Pressable
            style={[card.btn, approving && { opacity: 0.5 }]}
            disabled={approving}
            onPress={e => { e.stopPropagation(); onApprove(order); }}
          >
            <AppText style={card.btnText}>{approving ? 'Approving…' : 'Approve for production →'}</AppText>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const card = StyleSheet.create({
  wrap: { backgroundColor: C.card, borderRadius: 20, overflow: 'hidden', marginBottom: 10 },
  topBar: { height: 3 },
  body: { padding: 16, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: C.cardText },
  amount: { fontSize: 15, fontWeight: '700', color: C.cardText },
  meta: { fontSize: 13, color: C.cardMuted },
  btn: { alignSelf: 'flex-start', marginTop: 4, backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});

export default function SalesOrdersScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const { input, setInput, query, submitSearch, clearSearch } = useSearchQuery();
  const [filter, setFilter] = useState<Filter>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalOrder, setApprovalOrder] = useState<Order | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => orders.filter(o => matchF(o, filter) && matchQ(o, query)), [filter, orders, query]);
  const approvalCount = useMemo(() => orders.filter(needsSalesApproval).length, [orders]);

  async function handleConfirm(c: SalesPaymentConfirmation) {
    if (!user?.id || !approvalOrder) return;
    setApprovingId(approvalOrder.id);
    try {
      await confirmSalesProductionApproval(approvalOrder.id, c, user.id);
      await refresh();
      setApprovalOrder(null);
      Alert.alert('Sent to printer', 'Order approved and queued.');
    } catch (err) { Alert.alert('Failed', getAuthErrorMessage(err)); }
    finally { setApprovingId(null); }
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[C.bg1, C.bg2, C.bg1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top','left','right']}>
        <IosScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <AppText style={s.title}>Orders</AppText>
            <View style={s.countBadge}>
              <AppText style={s.countText}>{orders.length}</AppText>
            </View>
          </View>

          {/* Search */}
          <View style={s.searchWrap}>
            <AppIcon name="Search" size={15} color={C.whiteDim} />
            <TextInput
              value={input} onChangeText={setInput} onSubmitEditing={submitSearch}
              placeholder="Name, order ID, status…"
              placeholderTextColor={C.whiteDim}
              returnKeyType="search"
              style={s.searchInput}
            />
            {input.length > 0 ? (
              <Pressable onPress={clearSearch} hitSlop={8}>
                <AppIcon name="X" size={14} color={C.whiteDim} />
              </Pressable>
            ) : null}
          </View>

          {/* Pill filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {FILTERS.map(f => (
              <Pressable key={f} style={[s.pill, filter === f && s.pillActive]} onPress={() => setFilter(f)}>
                <AppText style={[s.pillText, filter === f && s.pillTextActive]}>
                  {FL[f]}{f === 'approval' && approvalCount > 0 ? ` · ${approvalCount}` : ''}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>

          {/* Content */}
          {isLoading && filtered.length === 0 ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View>
          ) : filtered.length === 0 ? (
            <AppEmptyState role="sales" iconName="ClipboardList" title={query ? 'No results' : 'No orders'} description={query ? `Nothing for "${query}"` : 'Create a new order.'} />
          ) : (
            filtered.map(o => (
              <Card key={o.id} order={o} approving={approvingId === o.id}
                onApprove={o2 => { if (!approvingId) setApprovalOrder(o2); }} />
            ))
          )}
        </IosScrollView>
      </SafeAreaView>

      <SalesProductionApprovalModal
        visible={Boolean(approvalOrder)} order={approvalOrder}
        busy={Boolean(approvingId)}
        onClose={() => setApprovalOrder(null)} onConfirm={handleConfirm}
      />
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { fontSize: 34, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  countBadge: { backgroundColor: C.pill, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.pillBorder },
  countText: { fontSize: 14, fontWeight: '700', color: C.whiteDim },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.pill, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.pillBorder, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15, color: C.white, padding: 0 },
  filterRow: { gap: 8, paddingBottom: 16 },
  pill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: C.pill, borderWidth: 1, borderColor: C.pillBorder },
  pillActive: { backgroundColor: C.white, borderColor: C.white },
  pillText: { fontSize: 13, fontWeight: '600', color: C.whiteDim },
  pillTextActive: { color: C.cardText },
});
