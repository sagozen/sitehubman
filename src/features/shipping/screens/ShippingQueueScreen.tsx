/**
 * ShippingQueueScreen — minimal Apple-style inbox.
 * One list, one action per row. No boxes, no stats, no timeline pills.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { useAuth } from '@/src/hooks/useAuth';
import { useLiveOrders } from '@/src/hooks/useLiveOrders';
import {
  markOrderDelivered,
  markOrderShipped,
  subscribeShippingOrders,
} from '@/src/services/productionService';
import type { Order } from '@/src/types/models';

const INK = '#0A0A0F';
const MUTED = '#8E8E93';
const TEAL = '#0BAEB6';
const HAIRLINE = 'rgba(60,60,67,0.10)';

export default function ShippingQueueScreen() {
  const { user } = useAuth();
  const subscribe = useMemo(() => subscribeShippingOrders, []);
  const { orders, loading } = useLiveOrders(subscribe, [subscribe]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ship = useCallback(
    async (order: Order, carrier: string, tracking: string) => {
      if (!carrier.trim() && !tracking.trim()) {
        Alert.alert('Tracking required', 'Enter a carrier name or tracking number.');
        return;
      }
      setBusyId(order.id);
      try {
        await markOrderShipped(order.id, { carrier: carrier.trim() || undefined, trackingNumber: tracking.trim() || undefined }, user?.id);
      } catch (err) {
        Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again.');
      } finally {
        setBusyId(null);
      }
    },
    [user?.id],
  );

  const deliver = useCallback(
    async (order: Order) => {
      setBusyId(order.id);
      try {
        await markOrderDelivered(order.id, user?.id);
      } catch (err) {
        Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again.');
      } finally {
        setBusyId(null);
      }
    },
    [user?.id],
  );

  const readyCount = orders.filter((o) => o.status === 'ready_to_ship').length;

  return (
    <GlassSafeScreen>
      <View style={s.header}>
        <AppText style={s.title}>Shipping</AppText>
        <AppText style={s.subtitle}>
          {orders.length === 0 ? 'Nothing to ship' : `${readyCount} ready · ${orders.length - readyCount} in transit`}
        </AppText>
      </View>

      <IosScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {loading && orders.length === 0 ? (
          <AppText style={s.muted}>Loading…</AppText>
        ) : orders.length === 0 ? (
          <View style={s.empty}>
            <AppText style={s.emptyTitle}>Queue is clear</AppText>
            <AppText style={s.emptySub}>
              New orders land here once QA approves them.
            </AppText>
          </View>
        ) : (
          <View>
            {orders.map((order) => (
              <ShippingRow
                key={order.id}
                order={order}
                busy={busyId === order.id}
                onShip={ship}
                onDeliver={deliver}
              />
            ))}
          </View>
        )}
      </IosScrollView>
    </GlassSafeScreen>
  );
}

const ShippingRow = memo(function ShippingRow({
  order, busy, onShip, onDeliver,
}: {
  order: Order;
  busy: boolean;
  onShip: (order: Order, carrier: string, tracking: string) => Promise<void>;
  onDeliver: (order: Order) => Promise<void>;
}) {
  const isShipped = order.status === 'shipped';
  const [open, setOpen] = useState(false);
  const [carrier, setCarrier] = useState(order.carrier ?? '');
  const [tracking, setTracking] = useState(order.trackingNumber ?? '');

  return (
    <View style={s.row}>
      <View style={s.rowMain}>
        <View style={[s.dot, { backgroundColor: isShipped ? TEAL : '#FF9500' }]} />
        <View style={s.body}>
          <AppText style={s.name} numberOfLines={1}>{order.customerName}</AppText>
          <AppText style={s.meta} numberOfLines={1}>
            {isShipped
              ? `${order.carrier ?? 'No carrier'} · ${order.trackingNumber ?? 'No tracking'}`
              : (order.deliveryAddress || 'No address on file')}
          </AppText>
        </View>
      </View>

      {isShipped ? (
        <Pressable
          style={({ pressed }) => [s.deliverBtn, pressed && { opacity: 0.7 }, busy && { opacity: 0.4 }]}
          onPress={() => void onDeliver(order)}
          disabled={busy}
        >
          <AppText style={s.deliverText}>{busy ? '…' : 'Delivered'}</AppText>
        </Pressable>
      ) : open ? (
        <View style={s.formBlock}>
          <View style={s.formRow}>
            <TextInput
              style={s.input}
              placeholder="Carrier"
              placeholderTextColor={MUTED}
              value={carrier}
              onChangeText={setCarrier}
            />
            <TextInput
              style={s.input}
              placeholder="Tracking"
              placeholderTextColor={MUTED}
              value={tracking}
              onChangeText={setTracking}
            />
          </View>
          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setOpen(false)}
            >
              <AppText style={s.cancelText}>Cancel</AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.shipBtn, pressed && { opacity: 0.7 }, busy && { opacity: 0.4 }]}
              onPress={async () => { await onShip(order, carrier, tracking); setOpen(false); }}
              disabled={busy}
            >
              <AppText style={s.shipText}>{busy ? '…' : 'Ship'}</AppText>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [s.shipBtn, pressed && { opacity: 0.7 }]}
          onPress={() => setOpen(true)}
        >
          <AppText style={s.shipText}>Ship →</AppText>
        </Pressable>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', color: INK, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '500', color: MUTED, marginTop: 2 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },
  muted: { color: MUTED, fontSize: 13, textAlign: 'center', paddingTop: 40 },

  empty: { paddingTop: 80, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  emptySub: { fontSize: 13, fontWeight: '500', color: MUTED, textAlign: 'center', lineHeight: 18 },

  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
    gap: 10,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '600', color: INK },
  meta: { fontSize: 12, color: MUTED, marginTop: 1 },

  formBlock: { gap: 8 },
  formRow: { flexDirection: 'row', gap: 6 },
  input: {
    flex: 1, height: 38,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 10,
    paddingHorizontal: 12, fontSize: 14, color: INK,
  },
  actions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' },
  cancelText: { fontSize: 12, fontWeight: '700', color: INK, letterSpacing: 0.2 },
  shipBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: INK },
  shipText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  deliverBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: TEAL },
  deliverText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});
