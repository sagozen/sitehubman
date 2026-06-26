import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import {
  ProfileStatCell,
  ProfileStatsGrid,
  SettingsGroup,
  SettingsRow,
  SettingsSection,
} from '@/src/components/SettingsGroup';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useOrders } from '@/src/hooks/useOrders';
import { getRoleLabel, getRoleScopeSummary } from '@/src/utils/roleCapabilities';

function formatDate(value?: string) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SalesProfileScreen() {
  const { user, signOutUser } = useAuth();
  const { orders, isLoading, error } = useOrders('sales', user?.id ?? '');
  const { bioPage } = useBioPage(user?.id ?? '');
  const [signingOut, setSigningOut] = useState(false);

  const stats = useMemo(() => {
    const total = orders.length;
    const needsAction = orders.filter((order) =>
      ['pending_payment', 'payment_verified', 'payment_rejected'].includes(order.status)
    ).length;
    const active = orders.filter((order) =>
      !['delivered', 'cancelled'].includes(order.status)
    ).length;
    const delivered = orders.filter((order) => order.status === 'delivered').length;

    return { total, needsAction, active, delivered };
  }, [orders]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch (signOutError) {
      const message = signOutError instanceof Error ? signOutError.message : 'Unable to sign out.';
      Alert.alert('Error', message);
      setSigningOut(false);
    }
  }

  const displayName = user?.displayName?.trim() || 'Sales Rep';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText style={styles.kicker}>Sales Account</AppText>
            <AppText style={styles.title} numberOfLines={1}>
              {displayName}
            </AppText>
            <AppText style={styles.subtitle} numberOfLines={1}>
              {user?.email || 'No email on file'}
            </AppText>
          </View>
          <AppAvatar
            name={displayName}
            role="sales"
            size={56}
            source={bioPage?.photoUrl ? { uri: bioPage.photoUrl } : undefined}
          />
        </View>

        <SettingsSection title="Overview" compact />
        <SettingsGroup compact>
          <ProfileStatsGrid>
            <ProfileStatCell compact index={0} total={4} label="Orders" value={String(stats.total)} icon="ClipboardList" />
            <ProfileStatCell compact index={1} total={4} label="Active" value={String(stats.active)} icon="Clock" tone={theme.colors.primary} />
            <ProfileStatCell compact index={2} total={4} label="Action" value={String(stats.needsAction)} icon="Bell" tone={theme.colors.warning} />
            <ProfileStatCell compact index={3} total={4} label="Delivered" value={String(stats.delivered)} icon="ShieldCheck" tone={theme.colors.success} />
          </ProfileStatsGrid>
        </SettingsGroup>

        <SettingsSection title="Account" compact />
        <SettingsGroup compact>
          <SettingsRow
            compact
            icon="ShieldCheck"
            title="Access"
            value={getRoleScopeSummary(user?.role)}
            showChevron={false}
          />
          <SettingsRow
            compact
            icon="User"
            title="Role"
            value={getRoleLabel(user?.role)}
            showChevron={false}
          />
          <SettingsRow
            compact
            icon="Home"
            title="Branch"
            value={user?.branch || 'Default branch'}
            showChevron={false}
          />
          <SettingsRow
            compact
            icon="CalendarDays"
            title="Member Since"
            value={formatDate(user?.createdAt)}
            showChevron={false}
            isLast
          />
        </SettingsGroup>

        <SettingsSection title="Shortcuts" compact />
        <SettingsGroup compact>
          <SettingsRow
            compact
            icon="ClipboardList"
            title="My Orders"
            subtitle="View and manage assigned customer orders."
            onPress={() => router.push(appRoutes.sales.orders)}
          />
          <SettingsRow
            compact
            icon="Wallet"
            title="My Earnings"
            subtitle="Track sales commission and payout history."
            onPress={() => router.push(appRoutes.sales.payouts)}
          />
          <SettingsRow
            compact
            icon="Settings"
            title="Settings"
            subtitle="Language, theme, and account options."
            onPress={() => router.push(appRoutes.sales.settings)}
          />
          <SettingsRow
            compact
            icon="LogOut"
            title={signingOut ? 'Signing out...' : 'Sign Out'}
            subtitle="End the current session."
            onPress={() => void handleSignOut()}
            destructive
            disabled={signingOut}
            isLast
          />
        </SettingsGroup>

        <SettingsSection title="Recent Activity" compact />
        {isLoading ? (
          <View style={styles.stateCard}>
            <AppText tone="muted">Loading account activity...</AppText>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <AppText style={styles.errorText}>{error}</AppText>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.stateCard}>
            <AppText tone="muted">No recent account activity yet.</AppText>
          </View>
        ) : (
          <SettingsGroup compact>
            {orders.slice(0, 5).map((order, index) => (
              <SettingsRow
                key={order.id}
                compact
                icon="Clock"
                title={order.customerName || 'Customer order'}
                subtitle={`${order.productType.replace('_', ' ')} x ${order.quantity}`}
                value={order.status.replace('_', ' ')}
                showChevron={false}
                isLast={index === Math.min(orders.length, 5) - 1}
              />
            ))}
          </SettingsGroup>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scroll: {
    paddingTop: theme.spacing.sm,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  stateCard: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    ...theme.shadows.control,
  },
  errorText: {
    color: theme.colors.danger,
  },
});
