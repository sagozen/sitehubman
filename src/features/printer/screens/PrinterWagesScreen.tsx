/**
 * PrinterWagesScreen — Apple Stocks / Wallet-style earnings dashboard.
 * Dark hero card, period picker, stats band, payout list.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { memo, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import {
  PrinterInfoRow,
  PrinterScreenHeader,
  PrinterStatsBand,
  PrinterSegment,
  PrinterSurfaceCard,
  printerUi,
} from '@/src/features/printer/components/PrinterScreenUi';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import type { PrinterJob } from '@/src/types/models';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Period = 'Today' | 'Week' | 'Month';

function filterByPeriod(jobs: PrinterJob[], period: Period): PrinterJob[] {
  const now = new Date();
  const tod  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const wk   = new Date(tod); wk.setDate(wk.getDate() - 7);
  const mo   = new Date(tod); mo.setDate(mo.getDate() - 30);
  return jobs.filter((j) => {
    const d = new Date(j.createdAt);
    if (Number.isNaN(d.getTime())) return period === 'Month';
    if (period === 'Today') return d >= tod;
    if (period === 'Week')  return d >= wk;
    return d >= mo;
  });
}

function jobEarned(job: PrinterJob): number {
  return job.cardsPrinted * job.perCardBonus + job.perOrderBonus;
}

function stageColor(stage: PrinterJob['stage']): string {
  if (stage === 'completed' || stage === 'ready_to_ship') return printerUi.green;
  if (stage === 'quality_check' || stage === 'nfc_encoding') return printerUi.accent;
  if (stage === 'failed') return printerUi.red;
  return printerUi.orange;
}

function stageLabel(stage: PrinterJob['stage']): string {
  const map: Partial<Record<PrinterJob['stage'], string>> = {
    completed: 'Done', ready_to_ship: 'Ready', quality_check: 'QA',
    nfc_encoding: 'NFC', printing: 'Print', received: 'Queued',
    failed: 'Failed', reprint: 'Reprint',
  };
  return map[stage] ?? stage;
}

// ─── JobRow ───────────────────────────────────────────────────────────────────

const JobEarningRow = memo(function JobEarningRow({
  job, isLast,
}: {
  job: PrinterJob;
  isLast: boolean;
}) {
  const earned = jobEarned(job);
  const color  = stageColor(job.stage);
  const label  = stageLabel(job.stage);
  const date   = new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <View style={[earnRow.wrap, isLast && earnRow.last]}>
      {/* Icon */}
      <View style={[earnRow.icon, { backgroundColor: color + '18' }]}>
        <AppIcon name="Printer" size={15} color={color} />
      </View>
      {/* Info */}
      <View style={earnRow.info}>
        <AppText style={earnRow.jobId} numberOfLines={1}>
          Job #{String(job.queueNumber).slice(-4)}
        </AppText>
        <AppText style={earnRow.meta}>
          {job.cardsPrinted} card{job.cardsPrinted === 1 ? '' : 's'} · {date}
        </AppText>
      </View>
      {/* Right */}
      <View style={earnRow.right}>
        <AppText style={[earnRow.amount, { color }]}>
          ${earned.toFixed(2)}
        </AppText>
        <View style={[earnRow.pill, { backgroundColor: color + '18' }]}>
          <AppText style={[earnRow.pillText, { color }]}>{label}</AppText>
        </View>
      </View>
    </View>
  );
});

const earnRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  last: { borderBottomWidth: 0 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  jobId: { fontSize: 14, fontWeight: '700', color: printerUi.text },
  meta:  { fontSize: 12, fontWeight: '500', color: printerUi.muted },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '700' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WagesScreen() {
  const { jobs } = usePrinterJobs();
  const [period, setPeriod] = useState<Period>('Week');

  const completed = useMemo(
    () => jobs.filter((j) => ['completed', 'ready_to_ship', 'quality_check'].includes(j.stage)),
    [jobs],
  );
  const filtered     = useMemo(() => filterByPeriod(completed, period), [completed, period]);
  const totalCards   = useMemo(() => filtered.reduce((s, j) => s + j.cardsPrinted, 0), [filtered]);
  const totalWage    = useMemo(() => filtered.reduce((s, j) => s + jobEarned(j), 0), [filtered]);
  const cardEarnings = useMemo(() => filtered.reduce((s, j) => s + j.cardsPrinted * j.perCardBonus, 0), [filtered]);
  const bonusTotal   = useMemo(() => filtered.reduce((s, j) => s + j.perOrderBonus, 0), [filtered]);
  const qaBonus      = Math.max(0, totalWage - cardEarnings - bonusTotal);
  const avgPerCard   = totalCards > 0 ? totalWage / totalCards : 0;
  const readyPayout  = filtered.some((j) => j.salaryStatus !== 'paid');
  const recentJobs   = filtered.slice(0, 10);

  return (
    <GlassSafeScreen>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Editorial header */}
        <PrinterScreenHeader title="Wages" sub="Earnings and payouts" />

        {/* Dark hero card — Apple Wallet style */}
        <View style={styles.heroCard}>
          {/* Glow orb */}
          <View style={styles.heroGlow} />
          <View style={styles.heroGlow2} />

          <View style={styles.heroTop}>
            <View style={styles.heroPeriodBadge}>
              <View style={styles.heroPeriodDot} />
              <AppText style={styles.heroPeriodText}>{period}</AppText>
            </View>
            {readyPayout ? (
              <View style={styles.heroReadyBadge}>
                <AppIcon name="Wallet" size={11} color={printerUi.green} />
                <AppText style={styles.heroReadyText}>Payout ready</AppText>
              </View>
            ) : null}
          </View>

          <AppText style={styles.heroLabel}>Total earnings</AppText>
          <AppText style={styles.heroAmount}>${totalWage.toFixed(2)}</AppText>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <AppText style={styles.heroStatValue}>{totalCards}</AppText>
              <AppText style={styles.heroStatLabel}>Cards</AppText>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <AppText style={styles.heroStatValue}>{filtered.length}</AppText>
              <AppText style={styles.heroStatLabel}>Jobs</AppText>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <AppText style={styles.heroStatValue}>${avgPerCard.toFixed(2)}</AppText>
              <AppText style={styles.heroStatLabel}>Per card</AppText>
            </View>
          </View>
        </View>

        {/* Period picker */}
        <PrinterSegment
          items={['Today', 'Week', 'Month']}
          active={period}
          onChange={setPeriod}
        />

        {/* Stats band */}
        <PrinterSurfaceCard style={styles.statsCard}>
          <PrinterStatsBand
            embedded
            title={`${period} breakdown`}
            items={[
              { icon: 'CreditCard',      value: String(totalCards),       label: 'Cards',    tone: 'blue'   },
              { icon: 'BadgeCheck',      value: String(filtered.length),  label: 'Jobs',     tone: 'green'  },
              { icon: 'TrendingUp',      value: `$${avgPerCard.toFixed(2)}`, label: 'Avg/Card', tone: 'orange' },
            ]}
          />
          <View style={styles.divider} />
          <PrinterInfoRow icon="CreditCard"   title="Card printing"   value={`$${cardEarnings.toFixed(2)}`} />
          <PrinterInfoRow icon="BadgeCheck"   title="QA verification" value={`$${qaBonus.toFixed(2)}`} />
          <PrinterInfoRow icon="Wallet"       title="Bonus"           value={`$${bonusTotal.toFixed(2)}`} />
          <PrinterInfoRow icon="DollarSign"   title="Total"           value={`$${totalWage.toFixed(2)}`} last />
        </PrinterSurfaceCard>

        {/* Recent jobs */}
        {recentJobs.length > 0 ? (
          <PrinterSurfaceCard style={styles.jobsCard}>
            <View style={styles.jobsHeader}>
              <AppText style={styles.jobsTitle}>Recent jobs</AppText>
              <AppText style={styles.jobsCount}>{recentJobs.length}</AppText>
            </View>
            {recentJobs.map((job, index) => (
              <JobEarningRow
                key={job.id}
                job={job}
                isLast={index === recentJobs.length - 1}
              />
            ))}
          </PrinterSurfaceCard>
        ) : null}

        {/* Payout CTA */}
        <Pressable
          style={({ pressed }) => [styles.payoutBtn, pressed && styles.payoutBtnPressed]}
          onPress={() => Alert.alert('Payout', 'Your manager will process the payout after reviewing this period.')}
        >
          <AppIcon name="Wallet" size={18} color="#fff" />
          <AppText style={styles.payoutBtnText}>Request Payout</AppText>
        </Pressable>

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
    gap: 14,
  },

  // Hero card
  heroCard: {
    borderRadius: 22,
    backgroundColor: printerUi.dark,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
    ...printerUi.shadowDark,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,122,255,0.18)',
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroPeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroPeriodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: printerUi.accent,
  },
  heroPeriodText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  heroReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(52,199,89,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,199,89,0.3)',
  },
  heroReadyText: {
    fontSize: 11,
    fontWeight: '700',
    color: printerUi.green,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  heroAmount: {
    fontSize: 46,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    marginTop: 2,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: printerUi.radiusSm,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroStatItem: { flex: 1, alignItems: 'center', gap: 3 },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Cards
  statsCard: { overflow: 'hidden' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: printerUi.border,
    marginHorizontal: 16,
  },
  jobsCard: {},
  jobsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  jobsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: printerUi.text,
  },
  jobsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: printerUi.muted,
  },

  // Payout button
  payoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.green,
    shadowColor: printerUi.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  payoutBtnPressed: { opacity: 0.85 },
  payoutBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
