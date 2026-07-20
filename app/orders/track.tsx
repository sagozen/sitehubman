import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, useWindowDimensions, Animated, type TextStyle, type ViewStyle } from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { OrderTimeline } from '@/src/components/OrderTimeline';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerOrders } from '@/src/hooks/useCustomerOrders';
import { initiatePayment } from '@/src/services/paymentService';
import { getAuthErrorMessage } from '@/src/services/authService';
import { productTypeOptions } from '@/src/constants/options';
import type { Order } from '@/src/types/models';
import { BoxBoldDuotone, Card2BoldDuotone, WalletBoldDuotone, StarsBoldDuotone } from '@solar-icons/react-native';

// Dynamic laser sweep overlay simulating machine production
function LaserEngraveOverlay({ width, height }: { width: number; height: number }) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: height - 4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [height]);

  return (
    <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden', borderRadius: 16 }]} pointerEvents="none">
      {/* Production tint */}
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,24,39,0.2)' }} />
      {/* Neon sweep laser beam */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: '#38BDF8',
          ...createShadow({ color: '#38BDF8', offset: { width: 0, height: 0 }, opacity: 0.9, radius: 10, elevation: 0 }),
          transform: [{ translateY: sweep }],
        }}
      />
      {/* Pulsing production status label */}
      <View style={styles.laserLabelBox}>
        <StarsBoldDuotone size={10} color="#38BDF8" />
        <AppText style={styles.laserLabelText}>CNC ENGRAVER LIVE</AppText>
      </View>
    </View>
  );
}

export default function CustomerOrdersRoute() {
  const { user } = useAuth();
  const { orders, loading, error } = useCustomerOrders(user?.id, user?.email);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const { width } = useWindowDimensions();

  const cardWidth = Math.min(width - 48, 340);
  const cardHeight = cardWidth / 1.586;

  async function handleCompletePayment(orderToPay: Order) {
    if (orderToPay.paymentIntentId) {
      router.push(`/payment/${orderToPay.paymentIntentId}` as any);
      return;
    }
    setPaymentBusy(true);
    try {
      const method = orderToPay.paymentMethod && orderToPay.paymentMethod !== 'later_manual'
        ? orderToPay.paymentMethod
        : 'khqr';
      const intent = await initiatePayment(orderToPay.id, method);
      router.push(`/payment/${intent.intentId}` as any);
    } catch (err) {
      Alert.alert('Payment unavailable', getAuthErrorMessage(err));
    } finally {
      setPaymentBusy(false);
    }
  }

  function getStatusStyle(status: string) {
    if (['shipped', 'delivered'].includes(status)) return { color: '#059669', bg: 'rgba(5,150,105,0.08)', label: 'Shipped / Delivered' };
    if (['printing', 'nfc_writing', 'nfc_verification', 'qa_pending'].includes(status)) return { color: '#FF9500', bg: 'rgba(255,149,0,0.08)', label: 'In Production' };
    if (['pending_payment', 'draft'].includes(status)) return { color: '#2596BE', bg: 'rgba(37,150,190,0.08)', label: 'Processing' };
    return { color: '#6B7280', bg: '#F3F4F6', label: status };
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color="#111827" />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText style={styles.title}>Track Orders</AppText>
          <AppText style={styles.subtitle}>Live status of your NFC digital identity cards</AppText>
        </View>
        <BoxBoldDuotone size={28} color="#007AFF" />
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#007AFF" />
          <AppText style={styles.loadingText}>Loading orders...</AppText>
        </View>
      ) : error ? (
        <View style={styles.loadingCenter}>
          <AppText style={styles.errorText}>{error}</AppText>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <BoxBoldDuotone size={64} color="#D1D5DB" />
          <AppText style={styles.emptyTitle}>No orders found</AppText>
          <AppText style={styles.emptySub}>Order a premium physical card to begin tracking.</AppText>
          <AppButton label="Browse templates" onPress={() => router.push('/customer/templates')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {selectedOrder ? (
            /* Live tracking detail card */
            <View style={styles.detailContainer}>
              <Pressable style={styles.closeBtn} onPress={() => setSelectedOrder(null)}>
                <AppText style={styles.closeBtnText}>← Show All Orders</AppText>
              </Pressable>

              <View style={styles.previewContainer}>
                <View style={styles.previewShadow}>
                  <NfcGlobalCardFace
                    fullName={selectedOrder.customerName}
                    title={selectedOrder.jobTitle || 'Verified Member'}
                    company={selectedOrder.company || 'NFC Global'}
                    email={selectedOrder.email || undefined}
                    phone={selectedOrder.phone || undefined}
                    width={cardWidth}
                    height={cardHeight}
                  />
                  {/* Sweep active overlay if in production */}
                  {['printing', 'nfc_writing', 'nfc_verification', 'qa_pending'].includes(selectedOrder.status) ? (
                    <LaserEngraveOverlay width={cardWidth} height={cardHeight} />
                  ) : null}
                </View>
              </View>

              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <AppText style={styles.metaLabel}>ORDER NUMBER</AppText>
                    <AppText style={styles.metaValue}>{selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}</AppText>
                  </View>
                  <View style={styles.metaColRight}>
                    <AppText style={styles.metaLabel}>AMOUNT</AppText>
                    <AppText style={styles.metaValue}>{selectedOrder.currency || 'USD'} {selectedOrder.amount}</AppText>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.paymentInfoRow}>
                  <WalletBoldDuotone size={20} color="#007AFF" />
                  <AppText style={styles.paymentStatusText}>
                    Payment status: {selectedOrder.paymentStatus === 'paid' ? 'Paid ✓' : 'Awaiting payment'}
                  </AppText>
                </View>

                {selectedOrder.paymentStatus !== 'paid' && (
                  <AppButton
                    label="Complete Payment"
                    onPress={() => void handleCompletePayment(selectedOrder)}
                    loading={paymentBusy}
                    style={styles.payBtn}
                  />
                )}
              </View>

              <View style={styles.timelineBox}>
                <AppText style={styles.timelineHeader}>Production Timeline</AppText>
                <OrderTimeline order={selectedOrder} compact />
              </View>
            </View>
          ) : (
            /* List of orders */
            orders.map((ord) => {
              const statusStyle = getStatusStyle(ord.status);
              const pOpt = productTypeOptions.find((p) => p.value === ord.productType);
              return (
                <Pressable
                  key={ord.id}
                  style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed] as ViewStyle[]}
                  onPress={() => setSelectedOrder(ord)}
                >
                  <View style={styles.orderTop}>
                    <View style={styles.orderHead}>
                      <AppText style={styles.orderNo}>Order #{ord.orderNumber || ord.id.slice(0, 8)}</AppText>
                      <AppText style={styles.orderProduct}>{pOpt?.label || 'Custom NFC Card'}</AppText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <AppText style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</AppText>
                    </View>
                  </View>

                  <View style={styles.orderBottom}>
                    <AppText style={styles.orderAmt}>{ord.currency || 'USD'} {ord.amount}</AppText>
                    <AppText style={styles.trackT}>Details & Tracking →</AppText>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 } as ViewStyle,
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...createShadow({ color: '#000', offset: { width: 0, height: 2 }, opacity: 0.03, radius: 6, elevation: 2 }),
  } as ViewStyle,
  headerCopy: { flex: 1, gap: 1 } as ViewStyle,
  title: { fontSize: 26, fontWeight: '900', color: '#111827', letterSpacing: -0.6 } as TextStyle,
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93', lineHeight: 18 } as TextStyle,

  scroll: { padding: 20, gap: 18, paddingBottom: 60 } as ViewStyle,

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 100 } as ViewStyle,
  loadingText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' } as TextStyle,
  errorText: { fontSize: 14, fontWeight: '600', color: '#FF3B30' } as TextStyle,

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 24, gap: 14 } as ViewStyle,
  emptyTitle: { fontSize: 18, fontWeight: '850' as any, color: '#111827' } as TextStyle,
  emptySub: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textAlign: 'center', marginBottom: 8 } as TextStyle,

  // Detail view
  detailContainer: { gap: 20 } as ViewStyle,
  closeBtn: { paddingVertical: 10, paddingHorizontal: 2 } as ViewStyle,
  closeBtnText: { fontSize: 14, fontWeight: '800', color: '#007AFF' } as TextStyle,
  previewContainer: { alignItems: 'center', paddingVertical: 16 } as ViewStyle,
  previewShadow: { ...createShadow({ color: '#000000', offset: { width: 0, height: 16 }, opacity: 0.08, radius: 24, elevation: 8 }), position: 'relative' } as ViewStyle,

  // Laser engraver
  laserLabelBox: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(17,24,39,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 } as ViewStyle,
  laserLabelText: { fontSize: 9, fontWeight: '900', color: '#38BDF8', letterSpacing: 0.6 } as TextStyle,

  metaBox: { backgroundColor: '#F9FAFB', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', gap: 16 } as ViewStyle,
  metaRow: { flexDirection: 'row', justifyStyle: 'space-between', justifyContent: 'space-between' } as ViewStyle,
  metaCol: { gap: 3 } as ViewStyle,
  metaColRight: { gap: 3, alignItems: 'flex-end' } as ViewStyle,
  metaLabel: { fontSize: 10, fontWeight: '850' as any, color: '#8E8E93', letterSpacing: 0.8 } as TextStyle,
  metaValue: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: -0.4 } as TextStyle,
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' } as ViewStyle,
  paymentInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 } as ViewStyle,
  paymentStatusText: { fontSize: 14, fontWeight: '750' as any, color: '#111827' } as TextStyle,
  payBtn: { marginTop: 4 } as ViewStyle,

  timelineBox: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', padding: 20 } as ViewStyle,
  timelineHeader: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: -0.3, marginBottom: 16 } as TextStyle,

  // List view
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', padding: 18, gap: 16, ...createShadow({ color: '#000', offset: { width: 0, height: 4 }, opacity: 0.01, radius: 10, elevation: 2 }) } as ViewStyle,
  orderCardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] } as ViewStyle,
  orderTop: { flexDirection: 'row', justifyStyle: 'space-between', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 } as ViewStyle,
  orderHead: { gap: 3, flex: 1 } as ViewStyle,
  orderNo: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: -0.3 } as TextStyle,
  orderProduct: { fontSize: 12, fontWeight: '600', color: '#8E8E93' } as TextStyle,
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 } as ViewStyle,
  statusText: { fontSize: 11, fontWeight: '850' as any } as TextStyle,
  orderBottom: { flexDirection: 'row', justifyStyle: 'space-between', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  orderAmt: { fontSize: 17, fontWeight: '900', color: '#111827', letterSpacing: -0.4 } as TextStyle,
  trackT: { fontSize: 13, fontWeight: '800', color: '#007AFF' } as TextStyle,
});
