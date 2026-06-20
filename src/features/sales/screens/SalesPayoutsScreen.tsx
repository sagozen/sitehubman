/**
 * SalesPayoutsScreen — Apple Stocks / Wallet style large display number hero.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { AppEmptyState } from '@/src/components/AppState';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { SalesCompactHero } from '@/src/features/sales/components/SalesCompactHero';
import {
  SalesInfoRow,
  SalesScreenHeader,
  SalesStatsBand,
  SalesSegment,
  SalesSurfaceCard,
  salesUi,
} from '@/src/features/sales/components/SalesScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { usePayouts } from '@/src/hooks/usePayouts';
import { Payout } from '@/src/types/models';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Period = 'Today' | 'Week' | 'Month';

function filterByPeriod(payouts: Payout[], period: Period) {
  const now = new Date();
  const tod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const wk  = new Date(tod); wk.setDate(wk.getDate() - 7);
  const mo  = new Date(tod); mo.setDate(mo.getDate() - 30);

  return payouts.filter((p) => {
    const d = new Date(p.createdAt);
    if (Number.isNaN(d.getTime())) return period === 'Month';
    if (period === 'Today') return d >= tod;
    if (period === 'Week')  return d >= wk;
    return d >= mo;
  });
}

function statusLabel(status: Payout['status']) {
  return status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : status;
}

function statusColor(status: Payout['status']): string {
  return status === 'paid' ? salesUi.green : salesUi.accent;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SalesPayoutsScreen() {
  const { user } = useAuth();
  const { payouts } = usePayouts(user?.id ?? '');
  const { orders, refresh } = useOrders('sales', user?.id ?? '');
  const [period, setPeriod] = useState<Period>('Week');

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => filterByPeriod(payouts, period), [payouts, period]);

  const totalCommission = filtered.reduce((s, p) => s + p.amount, 0);
  const pendingAmt      = filtered.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const paidAmt         = filtered.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingCount    = filtered.filter((p) => p.status === 'pending').length;
  const paidCount       = filtered.filter((p) => p.status === 'paid').length;
  const deliveredCount  = orders.filter((o) => o.status === 'delivered').length;

  return (
    <GlassSafeScreen>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Large editorial header */}
        <SalesScreenHeader title="Payouts" sub="Commission and earnings" />

        {/* Hero — Stocks-style display number */}
        <SalesCompactHero
          statusLabel={`This ${period}`}
          amount={`$${totalCommission.toFixed(2)}`}
          footerMeta={`${deliveredCount} order${deliveredCount === 1 ? '' : 's'} delivered`}
          footerPill={pendingCount > 0 ? `${pendingCount} pending` : undefined}
        />

        {/* Period picker */}
        <SalesSegment
          items={['Today', 'Week', 'Month']}
          active={period}
          onChange={setPeriod}
        />

        {/* Stats band */}
        <SalesSurfaceCard style={styles.statsCard}>
          <SalesStatsBand
            embedded
            title={`${period} commission`}
            items={[
              { icon: 'Clock',           value: `$${pendingAmt.toFixed(2)}`,  label: 'Awaiting', tone: 'orange' },
              { icon: 'Wallet',          value: `$${paidAmt.toFixed(2)}`,     label: 'Paid',     tone: 'green'  },
              { icon: 'BadgeDollarSign', value: String(paidCount),            label: 'Payouts',  tone: 'blue'   },
            ]}
          />
          <View style={styles.divider} />
          <SalesInfoRow icon="Clock"           title="Awaiting approval" value={`$${pendingAmt.toFixed(2)}`} />
          <SalesInfoRow icon="Wallet"          title="Paid out"          value={`$${paidAmt.toFixed(2)}`} />
          <SalesInfoRow icon="ClipboardList"   title="Total commission"  value={`$${totalCommission.toFixed(2)}`} last />
        </SalesSurfaceCard>

        {/* Recent payouts */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppEmptyState
              role="sales"
              iconName="Wallet"
              title="No payout records"
              description="Payouts in this period will appear here."
            />
          </View>
        ) : (
          <SalesSurfaceCard style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <AppText style={styles.recentTitle}>Recent payouts</AppText>
              <AppText style={styles.recentCount}>{Math.min(filtered.length, 8)}</AppText>
            </View>
            {filtered.slice(0, 8).map((payout, index) => {
              const isLast = index === Math.min(filtered.length, 8) - 1;
              const label  = payout.periodLabel || `Payout ${payout.id.slice(0, 6).toUpperCase()}`;
              const color  = statusColor(payout.status);
              const slabel = statusLabel(payout.status);

              return (
                <View key={payout.id} style={[styles.payoutRow, isLast && styles.payoutRowLast]}>
                  {/* Left icon */}
                  <View style={[styles.payoutIcon, { backgroundColor: payout.status === 'paid' ? salesUi.greenSoft : salesUi.orangeSoft }]}>
                    <AppIcon
                      name={payout.status === 'paid' ? 'CheckCircle' : 'Clock'}
                      size={15}
                      color={color}
                    />
                  </View>
                  {/* Label */}
                  <AppText style={styles.payoutLabel} numberOfLines={1}>
                    {label}
                  </AppText>
                  {/* Right */}
                  <View style={styles.payoutRight}>
                    <AppText style={[styles.payoutAmount, { color }]}>
                      ${payout.amount.toFixed(2)}
                    </AppText>
                    <View style={[styles.payoutPill, { backgroundColor: payout.status === 'paid' ? salesUi.greenSoft : salesUi.orangeSoft }]}>
                      <AppText style={[styles.payoutPillText, { color }]}>{slabel}</AppText>
                    </View>
                  </View>
                </View>
              );
            })}
          </SalesSurfaceCard>
        )}
      </IosScrollView>
    </GlassSafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 0,
  },

  statsCard: {
    marginTop: 14,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: salesUi.border,
    marginHorizontal: 16,
  },

  recentCard: { marginTop: 14 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: salesUi.text,
  },
  recentCount: {
    fontSize: 13,
    fontWeight: '600',
    color: salesUi.muted,
  },

  // Payout row (replaces SalesInfoRow for richer layout)
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: salesUi.border,
  },
  payoutRowLast: { borderBottomWidth: 0 },
  payoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: salesUi.text,
  },
  payoutRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  payoutPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  payoutPillText: {
    fontSize: 10,
    fontWeight: '700',
  },

  emptyWrap: { marginTop: 14 },
});
