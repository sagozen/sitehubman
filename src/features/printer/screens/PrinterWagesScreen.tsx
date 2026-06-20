import { IosScrollView } from '@/src/components/IosScrollView';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { AppText } from '@/src/components/AppText';
import {
  PrinterInfoRow,
  PrinterScreenHeader,
  PrinterStatsBand,
  PrinterSegment,
  PrinterSurfaceCard,
  printerUi,
} from '@/src/features/printer/components/PrinterScreenUi';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { PrinterJob } from '@/src/types/models';

type Period = 'Today' | 'Week' | 'Month';

function filterByPeriod(jobs: PrinterJob[], period: Period) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(startOfToday);
  monthAgo.setDate(monthAgo.getDate() - 30);

  return jobs.filter((job) => {
    const d = new Date(job.createdAt);
    if (Number.isNaN(d.getTime())) return period === 'Month';
    if (period === 'Today') return d >= startOfToday;
    if (period === 'Week') return d >= weekAgo;
    return d >= monthAgo;
  });
}

function jobEarned(job: PrinterJob) {
  return job.cardsPrinted * job.perCardBonus + job.perOrderBonus;
}

export default function WagesScreen() {
  const { jobs } = usePrinterJobs();
  const [period, setPeriod] = useState<Period>('Week');

  const completed = useMemo(() => jobs.filter((job) => job.stage === 'completed'), [jobs]);
  const filtered = useMemo(() => filterByPeriod(completed, period), [completed, period]);

  const totalCards = useMemo(() => filtered.reduce((sum, job) => sum + job.cardsPrinted, 0), [filtered]);
  const totalWage = useMemo(() => filtered.reduce((sum, job) => sum + jobEarned(job), 0), [filtered]);
  const cardPrintedTotal = useMemo(
    () => filtered.reduce((sum, job) => sum + job.cardsPrinted * job.perCardBonus, 0),
    [filtered]
  );
  const bonusTotal = useMemo(() => filtered.reduce((sum, job) => sum + job.perOrderBonus, 0), [filtered]);
  const avgPerCard = totalCards > 0 ? totalWage / totalCards : 0;
  const verifiedCount = filtered.length;
  const readyPayout = filtered.some((job) => job.salaryStatus !== 'paid');

  return (
    <GlassSafeScreen>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PrinterScreenHeader title="Wages" sub="Earnings and payout" />

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <AppText style={styles.heroLabel} variant="caption" weight="bold" tone="inverse">This Week</AppText>
          <AppText style={styles.heroAmount} variant="display" weight="black" tone="inverse">${totalWage.toFixed(2)}</AppText>
          <View style={styles.heroFooter}>
            <AppText style={styles.heroMeta} variant="caption" weight="bold">{totalCards} cards completed</AppText>
            {readyPayout ? (
              <View style={styles.heroPill}>
                <AppText style={styles.heroPillText} variant="caption" weight="black" tone="inverse">Ready</AppText>
              </View>
            ) : null}
          </View>
        </View>

        <PrinterSegment items={['Today', 'Week', 'Month']} active={period} onChange={setPeriod} />

        <PrinterSurfaceCard style={styles.earningsCard}>
          <PrinterStatsBand
            embedded
            title={`${period} at a glance`}
            items={[
              { icon: 'CreditCard', value: String(totalCards), label: 'Cards', tone: 'blue' },
              { icon: 'BadgeCheck', value: String(verifiedCount), label: 'Verified', tone: 'green' },
              { icon: 'TrendingUp', value: `$${avgPerCard.toFixed(2)}`, label: 'Avg/Card', tone: 'orange' },
            ]}
          />
          <View style={styles.earningsDivider} />
          <PrinterInfoRow icon="CreditCard" title="Card Printed" value={`$${cardPrintedTotal.toFixed(2)}`} />
          <PrinterInfoRow icon="BadgeCheck" title="QA Verified" value={`$${(totalWage - cardPrintedTotal - bonusTotal).toFixed(2)}`} />
          <PrinterInfoRow icon="Wallet" title="Bonus" value={`$${bonusTotal.toFixed(2)}`} last />
        </PrinterSurfaceCard>

        <Pressable
          style={({ pressed }) => [styles.payoutBtn, pressed && styles.payoutBtnPressed]}
          onPress={() => Alert.alert('Payout', 'Payout request will be available soon.')}
        >
          <AppText style={styles.payoutBtnText} variant="body" weight="black" tone="inverse">Request Payout</AppText>
        </Pressable>
      </IosScrollView>
    </GlassSafeScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: printerUi.bg,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: printerUi.dark,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 4,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(96,165,250,0.2)',
  },
  heroLabel: {
    opacity: 0.7,
  },
  heroAmount: {
    marginTop: 4,
    letterSpacing: -1,
  },
  heroFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroMeta: {
    color: '#6EE7B7',
  },
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroPillText: {
    fontSize: 11,
  },
  earningsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  earningsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: printerUi.border,
    marginHorizontal: 14,
  },
  payoutBtn: {
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: printerUi.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  payoutBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  payoutBtnText: {
    fontSize: 15,
  },
});
