/**
 * QaQueueScreen — minimal Apple-style inbox.
 * One list, one action per row. No boxes, no stats, no timeline pills.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { useAuth } from '@/src/hooks/useAuth';
import { useLiveOrders } from '@/src/hooks/useLiveOrders';
import { getPrinterJobByOrderId } from '@/src/services/firestoreService';
import {
  submitQaDecision,
  subscribeOrdersAwaitingQa,
} from '@/src/services/productionService';
import type { Order } from '@/src/types/models';

const INK = '#0A0A0F';
const MUTED = '#8E8E93';
const TEAL = '#0BAEB6';
const HAIRLINE = 'rgba(60,60,67,0.10)';

export default function QaQueueScreen() {
  const { user } = useAuth();
  const subscribe = useMemo(() => subscribeOrdersAwaitingQa, []);
  const { orders, loading } = useLiveOrders(subscribe, [subscribe]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const decide = useCallback(
    async (order: Order, decision: 'pass' | 'fail') => {
      if (busyId) return;
      setBusyId(order.id);
      try {
        const job = await getPrinterJobByOrderId(order.id);
        if (!job) {
          Alert.alert('No job', 'Printer job not found for this order.');
          return;
        }
        await submitQaDecision(order.id, job.id, decision, decision === 'fail' ? 'Visual QA failed' : undefined);
      } catch (err) {
        Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again.');
      } finally {
        setBusyId(null);
      }
    },
    [busyId],
  );

  return (
    <GlassSafeScreen>
      <View style={s.header}>
        <AppText style={s.title}>QA</AppText>
        <AppText style={s.subtitle}>
          {orders.length === 0 ? 'Nothing to inspect' : `${orders.length} to inspect`}
        </AppText>
      </View>

      <IosScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {loading && orders.length === 0 ? (
          <AppText style={s.muted}>Loading…</AppText>
        ) : orders.length === 0 ? (
          <View style={s.empty}>
            <AppText style={s.emptyTitle}>Queue is clear</AppText>
            <AppText style={s.emptySub}>
              New jobs land here as the printer finishes encoding.
            </AppText>
          </View>
        ) : (
          <View>
            {orders.map((order) => (
              <QaRow
                key={order.id}
                order={order}
                busy={busyId === order.id}
                onPass={() => void decide(order, 'pass')}
                onFail={() => void decide(order, 'fail')}
              />
            ))}
          </View>
        )}
      </IosScrollView>
    </GlassSafeScreen>
  );
}

const QaRow = memo(function QaRow({
  order, busy, onPass, onFail,
}: {
  order: Order;
  busy: boolean;
  onPass: () => void;
  onFail: () => void;
}) {
  return (
    <View style={s.row}>
      <Pressable
        style={({ pressed }) => [s.rowMain, pressed && { opacity: 0.6 }]}
        onPress={() => Alert.alert(order.customerName, `Order ${order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}`)}
      >
        <View style={[s.dot, { backgroundColor: TEAL }]} />
        <View style={s.body}>
          <AppText style={s.name} numberOfLines={1}>{order.customerName}</AppText>
          <AppText style={s.meta} numberOfLines={1}>
            {order.orderNumber ?? `#${order.id.slice(0, 6).toUpperCase()}`} · {order.quantity}× {order.productType.replace(/_/g, ' ')}
          </AppText>
        </View>
      </Pressable>
      <View style={s.actions}>
        <Pressable
          style={({ pressed }) => [s.failBtn, pressed && { opacity: 0.7 }, busy && { opacity: 0.4 }]}
          onPress={onFail}
          disabled={busy}
        >
          <AppText style={s.failText}>Fail</AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.passBtn, pressed && { opacity: 0.7 }, busy && { opacity: 0.4 }]}
          onPress={onPass}
          disabled={busy}
        >
          <AppText style={s.passText}>{busy ? '…' : 'Pass'}</AppText>
        </Pressable>
      </View>
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

  actions: { flexDirection: 'row', gap: 6 },
  failBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,59,48,0.10)' },
  failText: { fontSize: 12, fontWeight: '700', color: '#FF3B30', letterSpacing: 0.2 },
  passBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: INK },
  passText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});
