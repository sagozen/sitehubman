import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';
import { MetricCard } from '@/src/components/MetricCard';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { GuestHomeScreen } from '@/src/features/guest/GuestHomeScreen';
import { CustomerAccountScreen } from '@/src/features/customer/CustomerAccountScreen';

export function HomeScreen() {
  const { user } = useAuth();
  const { role, isSales, isPrinter, isCustomer, isGuest } = useRoleFlags();
  const { jobs } = usePrinterJobs();
  const { orders, isLoading: ordersLoading, error: ordersError, refresh } = useOrders(role, user?.id ?? '');

  // Guest → guest home with hero banner (drives sign-up)
  if (isGuest) return <GuestHomeScreen />;

  // Customer → dedicated premium home (NFC card + bio + orders)
  if (isCustomer) return <CustomerAccountScreen />;

  // Sales / Printer → keep original operational dashboard
  const queueCount = isSales
    ? orders.filter((o) => o.status !== 'delivered').length
    : jobs.filter((j) => j.stage !== 'completed').length;
  const completedToday = jobs.filter((j) => j.stage === 'completed').length;
  const pendingOrders = orders.filter(
    (o) => o.status !== 'delivered' && (o.cardStatus ?? 'active') !== 'closed',
  ).length;

  const dashboardLabel = isSales ? 'Sales Dashboard' : 'Printer Dashboard';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="caption" tone="muted" style={styles.greeting}>
          {dashboardLabel}
        </AppText>
        <AppText variant="h1">
          {getGreeting()}, {firstName(user?.displayName)}
        </AppText>
      </View>

      {ordersError ? (
        <AppCard>
          <AppText variant="body" tone="muted">{ordersError}</AppText>
          <AppButton label="Retry" variant="ghost" onPress={refresh} />
        </AppCard>
      ) : null}

      {isSales ? (
        <>
          <View style={styles.metricsRow}>
            <MetricCard label="Open Orders" value={ordersLoading ? '...' : `${pendingOrders}`} highlight="Sales" />
            <MetricCard label="In Queue" value={`${queueCount}`} />
          </View>

          <AppCard style={styles.actionCard}>
            <View style={styles.actionCardInner}>
              <SquircleIconTile name="ClipboardList" sizeKey="md" />
              <View style={styles.actionText}>
                <AppText variant="h2">New Order</AppText>
                <AppText variant="caption" tone="muted">Capture customer request instantly</AppText>
              </View>
            </View>
            <AppButton label="Create Order" onPress={() => router.push('/new-order')} />
          </AppCard>

          <AppCard style={styles.actionCard}>
            <View style={styles.actionCardInner}>
              <SquircleIconTile name="Wallet" sizeKey="md" />
              <View style={styles.actionText}>
                <AppText variant="h2">My Payouts</AppText>
                <AppText variant="caption" tone="muted">Commission and payout history</AppText>
              </View>
            </View>
            <AppButton label="View Payouts" variant="ghost" onPress={() => router.push('/sales/payouts')} />
          </AppCard>
        </>
      ) : null}

      {isPrinter ? (
        <>
          <View style={styles.metricsRow}>
            <MetricCard label="In Queue" value={`${queueCount}`} highlight="Live" />
            <MetricCard label="Done Today" value={`${completedToday}`} />
          </View>

          <AppCard style={styles.actionCard}>
            <View style={styles.actionCardInner}>
              <SquircleIconTile name="Printer" sizeKey="md" />
              <View style={styles.actionText}>
                <AppText variant="h2">Printer Queue</AppText>
                <AppText variant="caption" tone="muted">Manage NFC programming pipeline</AppText>
              </View>
            </View>
            <AppButton label="Open Queue" onPress={() => router.push('/printer/queue')} />
          </AppCard>

          <View style={styles.row}>
            <AppButton label="NFC Write" fullWidth={false} style={styles.halfButton} onPress={() => router.push('/printer/scan')} />
            <AppButton label="QA Video" fullWidth={false} variant="secondary" style={styles.halfButton} onPress={() => router.push('/printer/queue')} />
          </View>

          <AppCard style={styles.actionCard}>
            <View style={styles.actionCardInner}>
              <SquircleIconTile name="BadgeDollarSign" sizeKey="md" />
              <View style={styles.actionText}>
                <AppText variant="h2">My Salary</AppText>
                <AppText variant="caption" tone="muted">QA throughput and earnings</AppText>
              </View>
            </View>
            <AppButton label="View Salary" variant="ghost" onPress={() => router.push('/printer/wages')} />
          </AppCard>
        </>
      ) : null}
    </ScreenContainer>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || 'there';
}

const styles = StyleSheet.create({
  header: { gap: theme.spacing.xxs, marginBottom: theme.spacing.xs },
  greeting: { textTransform: 'uppercase', letterSpacing: 0 },
  metricsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  actionCard: { gap: theme.spacing.md },
  actionCardInner: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  actionText: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  halfButton: { flex: 1 },
});
