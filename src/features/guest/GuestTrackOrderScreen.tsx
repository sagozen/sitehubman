import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { CommentLoader } from '@/src/components/CommentLoader';
import { OrderTimeline } from '@/src/components/OrderTimeline';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { productTypeOptions } from '@/src/constants/options';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { auth } from '@/src/services/firebaseClient';
import { getOrder } from '@/src/services/firestoreService';
import { loadGuestLastOrderId } from '@/src/services/guestDraftService';
import { getAuthErrorMessage } from '@/src/services/authService';
import { initiatePayment } from '@/src/services/paymentService';
import type { Order } from '@/src/types/models';
import { canTrackOwnOrders, isLocalOnlyGuest } from '@/src/utils/guestSession';

const BRAND = '#2596BE';

function statusInfo(status: string): { label: string; color: string; bg: string } {
  if (['printing', 'nfc_writing', 'nfc_verification', 'qa_pending', 'ready_to_print'].includes(status))
    return { label: 'In Production', color: '#FF9500', bg: '#FFF3E0' };
  if (['shipped', 'ready_to_ship', 'ready'].includes(status))
    return { label: 'Shipped', color: '#34C759', bg: '#EAFAEF' };
  if (status === 'delivered')
    return { label: 'Delivered', color: '#007AFF', bg: '#EAF2FF' };
  if (['new', 'design'].includes(status))
    return { label: 'Processing', color: BRAND, bg: '#E6F5FB' };
  return { label: 'Pending', color: '#8E8E93', bg: '#F2F2F7' };
}

export function GuestTrackOrderScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const hasFirebaseUser = Boolean(auth.currentUser);
  const canTrack = canTrackOwnOrders(user, hasFirebaseUser);

  const loadOrder = useCallback(async () => {
    if (!canTrack) {
      setOrder(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const orderId =
      (typeof params.orderId === 'string' ? params.orderId : params.orderId?.[0]) ??
      (await loadGuestLastOrderId()) ??
      null;
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }
    try {
      setOrder(await getOrder(orderId));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [canTrack, params.orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function handleCompletePayment(orderToPay: Order) {
    if (orderToPay.paymentIntentId) {
      router.push(`/payment/${orderToPay.paymentIntentId}` as Href);
      return;
    }
    setPaymentBusy(true);
    try {
      const method =
        orderToPay.paymentMethod && orderToPay.paymentMethod !== 'later_manual'
          ? orderToPay.paymentMethod
          : 'khqr';
      const intent = await initiatePayment(orderToPay.id, method);
      router.push(`/payment/${intent.intentId}` as Href);
    } catch (err) {
      Alert.alert('Payment unavailable', getAuthErrorMessage(err));
    } finally {
      setPaymentBusy(false);
    }
  }

  if (!canTrack && isLocalOnlyGuest(user)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <IosScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <AppIcon name="ChevronLeft" size={22} color="#1C1C1E" />
            </Pressable>
            <AppText style={styles.title}>Track Order</AppText>
          </View>
          <View style={styles.wallCard}>
            <AppIcon name="Package" size={52} color={BRAND} />
            <AppText style={styles.wallTitle}>Sign in to track</AppText>
            <AppText style={styles.wallSub}>
              Use &quot;Continue as guest&quot; at checkout so your order is saved. Then return here to follow
              production and shipping.
            </AppText>
            <AppButton label="Sign in" onPress={() => router.push(appRoutes.login)} />
            <AppButton
              label="Design your card"
              variant="outline"
              onPress={() => router.push(appRoutes.guestDesign)}
            />
          </View>
        </IosScrollView>
      </SafeAreaView>
    );
  }

  const st = order ? statusInfo(order.status) : null;
  const productLabel = order
    ? productTypeOptions.find((p) => p.value === order.productType)?.label ?? order.productType
    : null;
  const paymentLabel =
    order?.paymentStatus === 'paid' || order?.paymentStatus === 'paid_verified'
      ? 'Paid ✓'
      : order?.paymentStatus === 'pending_payment'
        ? 'Awaiting payment'
        : order?.paymentStatus === 'under_review'
          ? 'Under review'
          : 'Payment due';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={22} color="#1C1C1E" />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>Track Order</AppText>
            <AppText style={styles.subtitle}>Production & delivery updates</AppText>
          </View>
          <AppIcon name="Truck" size={28} color={BRAND} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <CommentLoader size={52} color={BRAND} bubbleColor="#FFFFFF" />
            <AppText style={styles.loadingText}>Loading order...</AppText>
          </View>
        ) : !order ? (
          <View style={styles.emptyCard}>
            <AppIcon name="Package" size={48} color="#D1D5DB" />
            <AppText style={styles.emptyTitle}>No orders yet</AppText>
            <AppText style={styles.emptySub}>
              Place an order from Design your card, then return here to follow production and delivery.
            </AppText>
            <AppButton label="Design your card" onPress={() => router.push(appRoutes.guestDesign)} />
          </View>
        ) : (
          <>
            {/* Card preview */}
            <View style={styles.cardWrap}>
              <NfcGlobalCardFace
                fullName={order.customerName}
                title={order.jobTitle || undefined}
                company={order.company || undefined}
                phone={order.phone || undefined}
                email={order.email || undefined}
              />
            </View>

            {/* Order info */}
            <View style={styles.orderCard}>
              <View style={styles.orderRow}>
                <View style={styles.orderLeft}>
                  <AppText style={styles.orderNum}>{order.orderNumber ?? order.id.slice(0, 8)}</AppText>
                  <AppText style={styles.orderProduct}>
                    {productLabel} × {order.quantity}
                  </AppText>
                  <AppText style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </AppText>
                </View>
                <View>
                  {st ? (
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <AppText style={[styles.statusText, { color: st.color }]}>{st.label}</AppText>
                    </View>
                  ) : null}
                  <AppText style={styles.amount}>
                    {order.currency ?? 'USD'}{' '}
                    {order.amount != null ? order.amount.toLocaleString() : '—'}
                  </AppText>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <AppIcon name="Wallet" size={16} color={BRAND} />
                <AppText style={styles.metaText}>{paymentLabel}</AppText>
              </View>
              {order.trackingNumber ? (
                <View style={styles.metaRow}>
                  <AppIcon name="Truck" size={16} color={BRAND} />
                  <AppText style={styles.metaText}>
                    {[order.carrier, order.trackingNumber].filter(Boolean).join(' · ')}
                  </AppText>
                </View>
              ) : null}
            </View>

            {order.paymentStatus !== 'paid' && order.paymentMethod !== 'cash_on_delivery' ? (
              <AppButton
                label={paymentBusy ? 'Opening payment...' : 'Complete payment'}
                iconName="CreditCard"
                loading={paymentBusy}
                disabled={paymentBusy}
                onPress={() => void handleCompletePayment(order)}
              />
            ) : null}

            <View style={styles.timelineCard}>
              <AppText style={styles.sectionLabel}>Order timeline</AppText>
              <OrderTimeline order={order} compact />
            </View>
          </>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 20, gap: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  wallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  wallTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  wallSub: { fontSize: 13, fontWeight: '500', color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  emptySub: { fontSize: 13, fontWeight: '500', color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  cardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 8,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderLeft: { gap: 4 },
  orderNum: { fontSize: 13, fontWeight: '800', color: '#8E8E93', letterSpacing: 0.4 },
  orderProduct: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  orderDate: { fontSize: 12, fontWeight: '500', color: '#C7C7CC' },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  amount: { fontSize: 15, fontWeight: '800', color: '#1C1C1E', textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, fontWeight: '600', color: '#3C3C43' },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
