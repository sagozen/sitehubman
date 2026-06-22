/**
 * SalesPayoutsScreen — Stocks-app large number, clean list.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { AppEmptyState } from '@/src/components/AppState';
import { AppText } from '@/src/components/AppText';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { usePayouts } from '@/src/hooks/usePayouts';
import type { Payout } from '@/src/types/models';

type Period = 'Today' | 'Week' | 'Month';

function filterByPeriod(payouts: Payout[], p: Period): Payout[] {
  const now = new Date();
  const tod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const wk  = new Date(tod); wk.setDate(wk.getDate() - 7);
  const mo  = new Date(tod); mo.setDate(mo.getDate() - 30);
  return payouts.filter((x) => {
    const d = new Date(x.createdAt);
    if (Number.isNaN(d.getTime())) return p === 'Month';
    if (p === 'Today') return d >= tod;
    if (p === 'Week')  return d >= wk;
    return d >= mo;
  });
}

export default function SalesPayoutsScreen() {
  const { user }        = useAuth();
  const { payouts }     = usePayouts(user?.id ?? '');
  const { orders, refresh } = useOrders('sales', user?.id ?? '');
  const [period, setPeriod] = useState<Period>('Week');

  useEffect(() => { refresh(); }, [refresh]);

  const filtered     = useMemo(() => filterByPeriod(payouts, period), [payouts, period]);
  const total        = filtered.reduce((s, p) => s + p.amount, 0);
  const pendingAmt   = filtered.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const paidAmt      = filtered.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingCount = filtered.filter((p) => p.status === 'pending').length;
  const delivered    = orders.filter((o) => o.status === 'delivered').length;

  return (
    <GlassSafeScreen>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <AppText style={styles.title}>Payouts</AppText>

        {/* Big number */}
        <View style={styles.hero}>
          <AppText style={styles.heroLabel}>
            {period} commission
            {pendingCount > 0 ? <AppText style={styles.heroPending}> · {pendingCount} pending</AppText> : null}
          </AppText>
          <AppText style={styles.heroAmount}>${total.toFixed(2)}</AppText>
          <AppText style={styles.heroSub}>{delivered} order{delivered === 1 ? '' : 's'} delivered</AppText>
        </View>

        {/* Period pills */}
        <View style={styles.periodRow}>
          {(['Today', 'Week', 'Month'] as Period[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.periodPill, period === p && styles.periodPillActive]}
              onPress={() => setPeriod(p)}
            >
              <AppText style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</AppText>
            </Pressable>
          ))}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <AppText style={styles.statValue} numberOfLines={1}>${paidAmt.toFixed(2)}</AppText>
            <AppText style={styles.statLabel}>Paid out</AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <AppText style={[styles.statValue, { color: salesUi.accent }]} numberOfLines={1}>${pendingAmt.toFixed(2)}</AppText>
            <AppText style={styles.statLabel}>Awaiting</AppText>
          </View>
        </View>

        {/* Section label */}
        <AppText style={styles.sectionLabel}>Recent payouts</AppText>

        {/* List */}
        {filtered.length === 0 ? (
          <AppEmptyState role="sales" iconName="Wallet" title="No payouts" description="Payouts for this period will appear here." />
        ) : (
          <View>
            {filtered.slice(0, 10).map((payout, i) => {
              const label = payout.periodLabel || `Payout ${payout.id.slice(0, 6).toUpperCase()}`;
              const isPaid = payout.status === 'paid';
              const isLast = i === Math.min(filtered.length, 10) - 1;
              return (
                <View key={payout.id} style={[payRow.wrap, isLast && payRow.last]}>
                  <View style={payRow.left}>
                    <AppText style={payRow.name} numberOfLines={1}>{label}</AppText>
                    <AppText style={payRow.date}>{new Date(payout.createdAt).toLocaleDateString()}</AppText>
                  </View>
                  <View style={payRow.right}>
                    <AppText style={[payRow.amount, { color: isPaid ? salesUi.green : salesUi.accent }]}>
                      ${payout.amount.toFixed(2)}
                    </AppText>
                    <AppText style={[payRow.status, { color: isPaid ? salesUi.green : salesUi.accent }]}>
                      {isPaid ? 'Paid' : 'Pending'}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </IosScrollView>
    </GlassSafeScreen>
  );
}

const payRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: salesUi.border,
  },
  last: { borderBottomWidth: 0 },
  left: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: salesUi.text },
  date: { fontSize: 12, color: salesUi.muted },
  right: { alignItems: 'flex-end', gap: 3 },
  amount: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  status: { fontSize: 11, fontWeight: '700' },
});

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 },
  title: { fontSize: 32, fontWeight: '700', color: salesUi.text, letterSpacing: -0.5, marginBottom: 28 },

  hero: {
    gap: 4, paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: salesUi.border, marginBottom: 20,
  },
  heroLabel: { fontSize: 13, fontWeight: '500', color: salesUi.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroPending: { color: salesUi.accent },
  heroAmount: { fontSize: 46, fontWeight: '700', color: salesUi.text, letterSpacing: -2, marginTop: 4 },
  heroSub: { fontSize: 13, color: salesUi.muted },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodPill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, backgroundColor: salesUi.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: salesUi.border,
  },
  periodPillActive: { backgroundColor: salesUi.text, borderColor: salesUi.text },
  periodText: { fontSize: 13, fontWeight: '600', color: salesUi.muted },
  periodTextActive: { color: '#fff' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 24, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: salesUi.border, marginBottom: 24,
  },
  stat: { flex: 1, gap: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: salesUi.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: salesUi.muted },
  statDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: salesUi.border, marginHorizontal: 20 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: salesUi.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
});
