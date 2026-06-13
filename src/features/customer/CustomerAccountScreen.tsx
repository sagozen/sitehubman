import { IosScrollView } from '@/src/components/IosScrollView';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { CommentLoader } from '@/src/components/CommentLoader';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { OrderTimeline } from '@/src/components/OrderTimeline';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { usePaginatedOrders } from '@/src/hooks/usePaginatedOrders';
import {
  createCustomerReorder,
  freezeOrderCard,
  unfreezeOrderCard,
} from '@/src/services/firestoreService';
import { initiatePayment } from '@/src/services/paymentService';
import { getAuthErrorMessage } from '@/src/services/authService';
import { isPaymentVerified } from '@/src/services/paymentVerificationService';
import type { Order } from '@/src/types/models';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const BRAND_DARK = '#1A7FAA';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';

// ─── Order status ─────────────────────────────────────────────────────────────
function orderStatus(s: string): { label: string; color: string; bg: string } {
  if (['printing', 'nfc_writing', 'nfc_verification', 'qa_pending', 'ready_to_print'].includes(s))
    return { label: 'In Production', color: '#F59E0B', bg: '#FFF3E0' };
  if (['shipped', 'ready_to_ship', 'ready'].includes(s))
    return { label: 'Shipped', color: '#10B981', bg: '#ECFDF5' };
  if (s === 'delivered') return { label: 'Delivered', color: '#3B82F6', bg: '#EFF6FF' };
  if (['new', 'design'].includes(s)) return { label: 'Processing', color: BRAND, bg: '#E6F5FB' };
  return { label: 'Pending', color: MUTED, bg: '#F3F4F6' };
}

// ─── Quick nav buttons ────────────────────────────────────────────────────────
const QUICK: { icon: AppIconName; label: string; route: string; color: string }[] = [
  { icon: 'CreditCard', label: 'Design', route: appRoutes.guestDesign, color: BRAND },
  { icon: 'Users', label: 'Connections', route: appRoutes.customerConnections, color: '#7C3AED' },
  { icon: 'Package', label: 'Track', route: appRoutes.guestTrackOrder, color: '#F59E0B' },
  { icon: 'PenLine', label: 'Edit Bio', route: '/edit-bio', color: '#10B981' },
];

// ─── Order card ───────────────────────────────────────────────────────────────
function OrderCard({
  order,
  busyId,
  onFreeze,
  onReorder,
  onPayNow,
  onTrack,
  onReceipt,
}: {
  order: Order;
  busyId: string | null;
  onFreeze: (o: Order) => void;
  onReorder: (o: Order) => void;
  onPayNow: (o: Order) => void;
  onTrack: (o: Order) => void;
  onReceipt: (o: Order) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const st = orderStatus(order.status);
  const busy = busyId === order.id;
  const paid = isPaymentVerified(order);
  const shortId = order.orderNumber ?? order.id.slice(0, 8).toUpperCase();
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const amt = order.amount != null ? `$${order.amount.toFixed(0)}` : '—';

  return (
    <View style={oc.card}>
      {/* Header row */}
      <Pressable onPress={() => setExpanded((e) => !e)} style={oc.header}>
        <View style={oc.iconWrap}>
          <AppIcon name="CreditCard" size={20} color={BRAND} />
        </View>
        <View style={oc.info}>
          <AppText style={oc.id}>{shortId}</AppText>
          <AppText style={oc.meta}>
            {order.productType?.replace(/_/g, ' ')} × {order.quantity} · {date}
          </AppText>
        </View>
        <View style={oc.right}>
          <View style={[oc.badge, { backgroundColor: st.bg }]}>
            <AppText style={[oc.badgeT, { color: st.color }]}>{st.label}</AppText>
          </View>
          <AppText style={oc.amt}>{amt}</AppText>
        </View>
        <AppIcon name={expanded ? 'ChevronLeft' : 'ChevronRight'} size={16} color="#D1D5DB" />
      </Pressable>

      {/* Timeline */}
      {expanded ? (
        <View style={oc.timelineWrap}>
          <View style={oc.divider} />
          <OrderTimeline order={order} compact />
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={oc.actions}>
        <Pressable onPress={() => onTrack(order)} style={oc.actionBtn}>
          <AppIcon name="Package" size={14} color={BRAND} />
          <AppText style={[oc.actionT, { color: BRAND }]}>Track</AppText>
        </Pressable>
        <Pressable onPress={() => onReceipt(order)} style={oc.actionBtn}>
          <AppIcon name="FileText" size={14} color={MUTED} />
          <AppText style={[oc.actionT, { color: MUTED }]}>Receipt</AppText>
        </Pressable>
        {!paid && order.paymentMethod !== 'cash_on_delivery' ? (
          <Pressable onPress={() => onPayNow(order)} disabled={busy} style={[oc.actionBtn, oc.actionPay]}>
            <AppIcon name="Wallet" size={14} color="#FFFFFF" />
            <AppText style={[oc.actionT, { color: '#FFFFFF' }]}>Pay now</AppText>
          </Pressable>
        ) : null}
        <Pressable onPress={() => onFreeze(order)} disabled={busy} style={oc.actionBtn}>
          <AppIcon name={order.cardStatus === 'frozen' ? 'Nfc' : 'Snowflake'} size={14} color={MUTED} />
          <AppText style={[oc.actionT, { color: MUTED }]}>{order.cardStatus === 'frozen' ? 'Unfreeze' : 'Freeze'}</AppText>
        </Pressable>
        <Pressable onPress={() => onReorder(order)} disabled={busy} style={oc.actionBtn}>
          <AppIcon name="RefreshCw" size={14} color={MUTED} />
          <AppText style={[oc.actionT, { color: MUTED }]}>Reorder</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const oc = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EBF7FC', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 3 },
  id: { fontSize: 14, fontWeight: '800', color: INK2, fontFamily: 'Inter_800ExtraBold' },
  meta: { fontSize: 11, fontWeight: '500', color: MUTED },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeT: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  amt: { fontSize: 13, fontWeight: '800', color: INK2, fontFamily: 'Inter_800ExtraBold' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 16 },
  timelineWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.05)' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F5F5F7' },
  actionPay: { backgroundColor: BRAND },
  actionT: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export function CustomerAccountScreen() {
  const { user } = useAuth();
  const { orders, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = usePaginatedOrders('customer', user?.id ?? '');
  const [busyId, setBusyId] = useState<string | null>(null);

  const initial = (user?.displayName?.trim() || 'U')[0].toUpperCase();

  async function handleFreeze(order: Order) {
    setBusyId(order.id);
    try {
      if (order.cardStatus === 'frozen') {
        await unfreezeOrderCard(order.id, user?.id);
        Alert.alert('Card active', 'Your NFC profile is active again.');
      } else {
        await freezeOrderCard(order.id, 'Customer requested freeze', user?.id);
        Alert.alert('Card frozen', 'Your public profile is paused until you unfreeze.');
      }
      await refresh();
    } catch (err) {
      Alert.alert('Could not update', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReorder(order: Order) {
    setBusyId(order.id);
    try {
      const newId = await createCustomerReorder(order.id);
      Alert.alert('Reorder created', 'New unpaid order created. Complete payment to start production.', [
        { text: 'Track', onPress: () => router.push(`${appRoutes.guestTrackOrder}?orderId=${newId}`) },
        { text: 'OK' },
      ]);
      await refresh();
    } catch (err) {
      Alert.alert('Reorder failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePayNow(order: Order) {
    if (order.paymentIntentId) { router.push(`/payment/${order.paymentIntentId}` as Href); return; }
    setBusyId(order.id);
    try {
      const method = order.paymentMethod && order.paymentMethod !== 'later_manual' ? order.paymentMethod : 'khqr';
      const intent = await initiatePayment(order.id, method);
      router.push(`/payment/${intent.intentId}` as Href);
    } catch (err) {
      Alert.alert('Payment unavailable', getAuthErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HERO HEADER ── */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[BRAND_DARK, BRAND, '#4DB8D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroInner}>
            <View style={styles.heroLeft}>
              <View style={styles.avatar}>
                <AppText style={styles.avatarT}>{initial}</AppText>
              </View>
              <View style={styles.heroCopy}>
                <AppText style={styles.heroName}>{user?.displayName ?? 'My Account'}</AppText>
                <AppText style={styles.heroEmail} numberOfLines={1}>{user?.email ?? ''}</AppText>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/edit-bio')}
              style={({ pressed }) => [styles.heroBadge, pressed && { opacity: 0.8 }]}
            >
              <AppIcon name="PenLine" size={13} color="#FFFFFF" />
              <AppText style={styles.heroBadgeT}>Edit</AppText>
            </Pressable>
          </View>
        </View>

        {/* ── NFC CARD ── */}
        <View style={styles.cardWrap}>
          <NfcGlobalCardFace fullName={user?.displayName || undefined} />
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <Pressable
              key={q.label}
              onPress={() => router.push(q.route as any)}
              style={({ pressed }) => [styles.quickCell, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <AppIcon name={q.icon} size={26} color={q.color} />
              <AppText style={styles.quickLabel}>{q.label}</AppText>
            </Pressable>
          ))}
        </View>

        {/* ── ORDERS ── */}
        <View style={styles.sectionHead}>
          <AppText style={styles.sectionTitle}>My Orders</AppText>
          <Pressable onPress={() => void refresh()}>
            <AppIcon name="RefreshCw" size={18} color={MUTED} />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <AppIcon name="CircleAlert" size={24} color="#EF4444" />
            <AppText style={styles.errorT}>{error}</AppText>
            <Pressable onPress={() => void refresh()} style={styles.retryBtn}>
              <AppText style={styles.retryT}>Retry</AppText>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.center}>
            <CommentLoader size={48} color={BRAND} bubbleColor="#FFFFFF" />
            <AppText style={styles.loadingT}>Loading orders…</AppText>
          </View>
        ) : orders.length === 0 && !error ? (
          <View style={styles.emptyCard}>
            <AppIcon name="Package" size={48} color="#D1D5DB" />
            <AppText style={styles.emptyTitle}>No orders yet</AppText>
            <AppText style={styles.emptySub}>Design your NFC card and checkout — your orders will appear here.</AppText>
            <Pressable onPress={() => router.push(appRoutes.guestDesign as any)} style={styles.emptyBtn}>
              <AppText style={styles.emptyBtnT}>Design your card</AppText>
            </Pressable>
          </View>
        ) : null}

        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busyId={busyId}
            onFreeze={handleFreeze}
            onReorder={handleReorder}
            onPayNow={handlePayNow}
            onTrack={(o) => router.push(`${appRoutes.guestTrackOrder}?orderId=${o.id}` as Href)}
            onReceipt={(o) => router.push(`/order-receipt/${o.id}` as Href)}
          />
        ))}

        {hasMore ? (
          <Pressable
            onPress={() => void loadMore()}
            disabled={isLoadingMore}
            style={({ pressed }) => [styles.loadMoreBtn, pressed && styles.pressed]}
          >
            <AppText style={styles.loadMoreT}>
              {isLoadingMore ? 'Loading…' : 'Load more orders'}
            </AppText>
          </Pressable>
        ) : null}

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { gap: 16, paddingBottom: 120 },

  // Hero
  hero: {
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 16 },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  avatarT: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', fontFamily: 'Inter_900Black' },
  heroCopy: { gap: 3 },
  heroName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, fontFamily: 'Inter_800ExtraBold' },
  heroEmail: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)', maxWidth: 200, fontFamily: 'Inter_500Medium' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  heroBadgeT: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter_700Bold' },

  // Card
  cardWrap: { marginHorizontal: 18, borderRadius: 22, overflow: 'hidden', shadowColor: BRAND, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 10 },

  // Quick actions
  quickRow: { flexDirection: 'row', marginHorizontal: 18, backgroundColor: SURFACE, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4 },
  quickCell: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 7, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(0,0,0,0.05)' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  quickLabel: { fontSize: 10, fontWeight: '700', color: INK2, fontFamily: 'Inter_700Bold' },

  // Section
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.4, fontFamily: 'Inter_800ExtraBold' },

  // Error
  errorCard: { marginHorizontal: 18, backgroundColor: '#FEF2F2', borderRadius: 16, padding: 20, alignItems: 'center', gap: 10 },
  errorT: { fontSize: 14, fontWeight: '500', color: '#DC2626', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: SURFACE, borderRadius: 10 },
  retryT: { fontSize: 13, fontWeight: '700', color: '#DC2626', fontFamily: 'Inter_700Bold' },

  // Loading
  center: { alignItems: 'center', gap: 10, paddingVertical: 32, marginHorizontal: 18 },
  loadingT: { fontSize: 13, fontWeight: '500', color: MUTED },

  // Empty
  emptyCard: { marginHorizontal: 18, backgroundColor: SURFACE, borderRadius: 20, padding: 28, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: INK2, fontFamily: 'Inter_800ExtraBold' },
  emptySub: { fontSize: 13, fontWeight: '500', color: MUTED, textAlign: 'center', lineHeight: 18 },
  emptyBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: BRAND, borderRadius: 12 },
  emptyBtnT: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter_700Bold' },

  // Load more
  loadMoreBtn: { marginHorizontal: 18, height: 46, backgroundColor: SURFACE, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  loadMoreT: { fontSize: 14, fontWeight: '600', color: BRAND, fontFamily: 'Inter_600SemiBold' },
});
