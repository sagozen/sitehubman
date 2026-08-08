import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { CommentLoader } from '@/src/components/CommentLoader';
import { AppHeaderV2 } from '@/src/components/AppHeaderV2';
import { OrderCardV2 } from '@/src/components/OrderCardV2';
import { OrderTimelineV2 } from '@/src/components/OrderTimelineV2';
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
  if (['production_approved', 'printer_assigned', 'printing', 'nfc_writing', 'nfc_verification', 'qa_pending', 'qa_failed'].includes(status))
    return { label: 'In Production', color: '#FF9500', bg: '#FFF3E0' };
  if (['shipped', 'ready_to_ship'].includes(status))
    return { label: 'Shipped', color: '#34C759', bg: '#EAFAEF' };
  if (status === 'delivered')
    return { label: 'Delivered', color: '#007AFF', bg: '#EAF2FF' };
  if (['draft', 'pending_payment', 'payment_submitted', 'payment_verified'].includes(status))
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
      ? 'Paid'
      : order?.paymentStatus === 'pending_payment'
        ? 'Awaiting payment'
        : order?.paymentStatus === 'under_review'
          ? 'Under review'
          : 'Payment due';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <AppHeaderV2
          title="Track Order"
          showBack={true}
          onBackPress={() => router.back()}
          rightComponent={<AppIcon name="Truck" size={28} color={BRAND} />}
        />

        {loading ? (
          <View style={styles.center}>
            <CommentLoader size={52} color={BRAND} bubbleColor="#FFFFFF" count={2} />
            <AppText style={styles.loadingText}>Loading order...</AppText>
          </View>
        ) : !order ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <AppIcon name="Package" size={36} color="#FFFFFF" />
            </View>
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
            <OrderCardV2
              orderId={order.orderNumber ?? order.id.slice(0, 8)}
              date={new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              amount={order.amount ?? 0}
              status={
                order.status === 'delivered' ? 'delivered' :
                order.status === 'shipped' ? 'shipped' :
                ['draft', 'pending_payment'].includes(order.status) ? 'pending' : 'processing'
              }
              itemCount={order.quantity ?? 1}
            />

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
              <OrderTimelineV2 
                status={order.status}
                paymentStatus={order.paymentStatus}
              />
            </View>
          </>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', minHeight: '100vh' as any, backgroundColor: '#050507' },
  content: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0 },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#A1A1AA' },
  wallCard: {
    width: '100%',
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  wallTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  wallSub: { fontSize: 13, fontWeight: '600', color: '#A1A1AA', textAlign: 'center', lineHeight: 18 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  emptyCard: {
    width: '100%',
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(37,150,190,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  emptySub: { fontSize: 13, fontWeight: '600', color: '#A1A1AA', textAlign: 'center', lineHeight: 18 },
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
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderLeft: { gap: 4 },
  orderNum: { fontSize: 13, fontWeight: '800', color: '#A1A1AA', letterSpacing: 0 },
  orderProduct: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0 },
  orderDate: { fontSize: 12, fontWeight: '600', color: '#71717A' },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  amount: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, fontWeight: '600', color: '#D4D4D8' },
  timelineCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
