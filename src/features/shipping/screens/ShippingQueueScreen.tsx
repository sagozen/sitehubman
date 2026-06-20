import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppEmptyState } from '@/src/components/AppState';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { listOrdersReadyToShip, markOrderDelivered, markOrderShipped } from '@/src/services/productionService';
import { Order } from '@/src/types/models';

export default function ShippingQueueScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingNote, setTrackingNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await listOrdersReadyToShip(user?.branch));
    } finally {
      setLoading(false);
    }
  }, [user?.branch]);

  useEffect(() => {
    void load();
  }, [load]);

  function openShipForm(order: Order) {
    setShippingId(order.id);
    setCarrier(order.carrier ?? '');
    setTrackingNumber(order.trackingNumber ?? '');
    setTrackingNote(order.trackingNote ?? '');
  }

  async function handleShip(order: Order) {
    if (order.status === 'shipped') {
      try {
        await markOrderDelivered(order.id, user?.id);
        setShippingId(null);
        await load();
      } catch (err) {
        Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again.');
      }
      return;
    }

    if (shippingId !== order.id) {
      openShipForm(order);
      return;
    }

    if (!carrier.trim() && !trackingNumber.trim()) {
      Alert.alert('Tracking required', 'Enter a carrier name or tracking number before marking shipped.');
      return;
    }

    try {
      await markOrderShipped(
        order.id,
        {
          carrier: carrier.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          trackingNote: trackingNote.trim() || undefined,
        },
        user?.id
      );
      setShippingId(null);
      setCarrier('');
      setTrackingNumber('');
      setTrackingNote('');
      await load();
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppText style={styles.title}>Shipping</AppText>
        <AppText style={styles.sub}>Add tracking, then mark shipped</AppText>
      </View>
      <IosScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <AppText tone="muted">Loading…</AppText>
        ) : orders.length === 0 ? (
          <AppEmptyState
            role="sales"
            iconName="Truck"
            title="Nothing to ship"
            description="Orders appear here after QA inspector approval."
          />
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <AppText style={styles.cardTitle}>{order.customerName}</AppText>
              <AppText style={styles.cardMeta}>
                {order.deliveryAddress || 'No address'} · {order.status.replace(/_/g, ' ')}
              </AppText>
              {order.trackingNumber ? (
                <AppText style={styles.tracking}>
                  {order.carrier ? `${order.carrier} · ` : ''}
                  {order.trackingNumber}
                </AppText>
              ) : null}

              {shippingId === order.id && order.status !== 'shipped' ? (
                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    placeholder="Carrier (e.g. J&T, Kerry)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={carrier}
                    onChangeText={setCarrier}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Tracking number"
                    placeholderTextColor={theme.colors.textMuted}
                    value={trackingNumber}
                    onChangeText={setTrackingNumber}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Note (optional)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={trackingNote}
                    onChangeText={setTrackingNote}
                  />
                </View>
              ) : null}

              <Pressable style={styles.shipBtn} onPress={() => void handleShip(order)}>
                <AppIcon name="Truck" size={16} color="#fff" />
                <AppText style={styles.shipBtnText}>
                  {order.status === 'shipped'
                    ? 'Mark delivered'
                    : shippingId === order.id
                      ? 'Confirm shipped'
                      : 'Add tracking & ship'}
                </AppText>
              </Pressable>
            </View>
          ))
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary },
  sub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  body: { padding: 16, paddingBottom: 80, gap: 10 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardMeta: { marginTop: 4, fontSize: 12, color: theme.colors.textMuted },
  tracking: { marginTop: 6, fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  form: { marginTop: 10, gap: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  shipBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shipBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
