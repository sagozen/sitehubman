/**
 * SalesPayoutsScreen — premium Binance-inspired dark payout dashboard.
 * Style: Binance dark theme, black and gold palette, luxury fintech aesthetic.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppEmptyState } from '@/src/components/AppState';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { usePayouts } from '@/src/hooks/usePayouts';
import type { Payout } from '@/src/types/models';
import { AppIcon } from '@/src/components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';

type Period = 'Today' | 'Week' | 'Month';

// ─── Tokens (Light Theme Payouts Pro) ────────────────────────────────────────
const BG                  = '#F8FAFC';
const SURFACE             = 'rgba(255, 255, 255, 0.86)';
const SURFACE_LIGHT       = '#F1F5F9';
const BORDER              = 'rgba(15,23,42,0.06)';
const INK                 = '#020617';
const MUTED               = '#64748B';
const DIM                 = '#94A3B8';
const GREEN               = '#10B981';
const GREEN_DIM           = '#ECFDF3';
const RED                 = '#EF4444';

const GOLD_PRIMARY        = '#0E7490'; // Dark Aqua Blue instead of Gold
const GOLD_PRIMARY_DIM    = '#EAF3FF';
const GOLD_SECONDARY      = '#0891B2';

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
    <View style={styles.bg}>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingTop: 8, paddingBottom: 16 }}>
          <AppText style={{ fontSize: 10, fontWeight: '900', color: GOLD_PRIMARY, letterSpacing: 1 }}>NFC GLOBAL SALES</AppText>
          <AppText style={styles.title}>Payouts</AppText>
        </View>

        {/* Big number Hero container with Glass Gradient */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(241, 245, 249, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.hero}>
            <AppText style={styles.heroLabel}>
              {period} commission
              {pendingCount > 0 ? <AppText style={styles.heroPending}> · {pendingCount} pending</AppText> : null}
            </AppText>
            <AppText style={styles.heroAmount}>${total.toFixed(2)}</AppText>
            <View style={styles.heroMetaRow}>
              <AppIcon name="BadgeCheck" size={14} color={GREEN} />
              <AppText style={styles.heroSub}>{delivered} order{delivered === 1 ? '' : 's'} delivered</AppText>
            </View>
          </View>
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

        {/* Stats Row Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <AppText style={styles.statLabel}>Paid out</AppText>
            <AppText style={[styles.statValue, { color: GREEN }]} numberOfLines={1}>${paidAmt.toFixed(2)}</AppText>
          </View>
          <View style={styles.statCard}>
            <AppText style={styles.statLabel}>Awaiting</AppText>
            <AppText style={[styles.statValue, { color: GOLD_PRIMARY }]} numberOfLines={1}>${pendingAmt.toFixed(2)}</AppText>
          </View>
        </View>

        {/* Section label */}
        <AppText style={styles.sectionLabel}>Recent payouts</AppText>

        {/* List */}
        {filtered.length === 0 ? (
          <AppEmptyState role="sales" iconName="Wallet" title="No payouts" description="Payouts for this period will appear here." />
        ) : (
          <View style={styles.listWrap}>
            {filtered.slice(0, 10).map((payout, i) => {
              const label = payout.periodLabel || `Payout ${payout.id.slice(0, 6).toUpperCase()}`;
              const isPaid = payout.status === 'paid';
              const isLast = i === Math.min(filtered.length, 10) - 1;
              return (
                <View key={payout.id} style={[payRow.wrap, isLast && payRow.last]}>
                  <View style={payRow.iconShell}>
                    <AppIcon name="Wallet" size={18} color={isPaid ? GREEN : GOLD_PRIMARY} />
                  </View>
                  <View style={payRow.left}>
                    <AppText style={payRow.name} numberOfLines={1}>{label}</AppText>
                    <AppText style={payRow.date}>{new Date(payout.createdAt).toLocaleDateString()}</AppText>
                  </View>
                  <View style={payRow.right}>
                    <AppText style={payRow.amount}>
                      ${payout.amount.toFixed(2)}
                    </AppText>
                    <View style={[payRow.statusPill, { backgroundColor: isPaid ? GREEN_DIM : GOLD_PRIMARY_DIM }]}>
                      <AppText style={[payRow.status, { color: isPaid ? GREEN : GOLD_PRIMARY }]}>
                        {isPaid ? 'Paid' : 'Pending'}
                      </AppText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </IosScrollView>
    </View>
  );
}

const payRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, gap: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  last: { borderBottomWidth: 0 },
  iconShell: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: SURFACE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  left: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: INK },
  date: { fontSize: 11, color: MUTED },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 16, fontWeight: '800', color: INK, letterSpacing: -0.3 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  status: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 },
});

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },
  blob: { position: 'absolute', opacity: 0.8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: '900', color: INK, letterSpacing: -0.6, fontFamily: 'Inter_900Black' },

  heroWrap: {
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
    marginBottom: 20,
    backgroundColor: SURFACE,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05, shadowRadius: 24, elevation: 1,
  },
  hero: { padding: 22, gap: 6 },
  heroLabel: { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  heroPending: { color: GOLD_PRIMARY },
  heroAmount: { fontSize: 46, fontWeight: '900', color: INK, letterSpacing: -2, marginTop: 4 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  heroSub: { fontSize: 12, fontWeight: '600', color: MUTED },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodPill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  periodPillActive: { backgroundColor: GOLD_PRIMARY, borderColor: GOLD_PRIMARY },
  periodText: { fontSize: 13, fontWeight: '700', color: MUTED },
  periodTextActive: { color: '#FFFFFF' },

  statsRow: {
    flexDirection: 'row', gap: 12, marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 4,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03, shadowRadius: 16, elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  listWrap: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04, shadowRadius: 20, elevation: 1,
  },
});
