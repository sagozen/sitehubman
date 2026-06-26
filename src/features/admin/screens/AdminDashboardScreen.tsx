import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
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
import { usePreferences } from '@/src/hooks/usePreferences';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { fetchAdminOrderStats, fetchTodayOrderCount } from '@/src/services/adminStatsService';

const MENU: {
  title: string;
  desc: string;
  icon: AppIconName;
  iconColor: string;
  route: string;
}[] = [
  { title: 'Users', desc: 'Customer, sales, and owner accounts', icon: 'User', iconColor: '#000000', route: '/admin/users' },
  { title: 'Orders', desc: 'All customer and sales orders', icon: 'ClipboardList', iconColor: theme.colors.primary, route: '/admin/orders' },
  { title: 'Products', desc: 'Live card prices and catalog', icon: 'Package', iconColor: '#AF52DE', route: '/admin/products' },
  { title: 'Settings', desc: 'Branches, defaults, and app config', icon: 'Settings', iconColor: '#8E8E93', route: '/admin/settings' },
];

export default function AdminDashboardScreen() {
  const { user, signOutUser } = useAuth();
  const { isAdmin } = useRoleFlags();
  const { colors } = usePreferences();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, pending: 0, todayOrders: 0 });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [summary, todayOrders] = await Promise.all([fetchAdminOrderStats(), fetchTodayOrderCount()]);
        setStats({
          orders: summary.totalOrders,
          revenue: summary.revenueUsdEstimate,
          pending: summary.inProduction,
          todayOrders,
        });
      } catch {
        // Keep the dashboard usable offline or before indexes are ready.
      }
    }
    void load();
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign out.';
      Alert.alert('Error', message);
      setSigningOut(false);
    }
  }

  if (!isAdmin) return <Redirect href="/auth/login" />;

  const displayName = user?.displayName?.trim() || 'Super Admin';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <View style={styles.topCopy}>
          <AppText variant="caption" tone="muted" weight="medium">
            Super Admin
          </AppText>
          <AppText variant="h2" weight="bold" numberOfLines={1} style={{ color: colors.typographyColor }}>
            {displayName}
          </AppText>
          {user?.email ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {user.email}
            </AppText>
          ) : null}
        </View>
        <AppAvatar name={displayName} role="admin" size={40} />
        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          onPress={handleSignOut}
          disabled={signingOut}
          hitSlop={8}
          style={({ pressed }) => [
            styles.signOutBtn,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.75 },
          ]}
        >
          <AppIcon name="LogOut" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Overview" compact />
        <SettingsGroup compact>
          <ProfileStatsGrid>
            <ProfileStatCell compact index={0} total={4} label="Orders" value={String(stats.orders)} icon="ClipboardList" />
            <ProfileStatCell compact index={1} total={4} label="Revenue" value={`$${stats.revenue}`} icon="Wallet" tone={theme.colors.success} />
            <ProfileStatCell compact index={2} total={4} label="Active" value={String(stats.pending)} icon="Clock" tone="#FF9500" />
            <ProfileStatCell compact index={3} total={4} label="Today" value={String(stats.todayOrders)} icon="Calendar" tone={colors.primary} />
          </ProfileStatsGrid>
        </SettingsGroup>

        <SettingsSection title="Management" compact />
        <SettingsGroup compact>
          {MENU.map((item, index) => (
            <SettingsRow
              key={item.title}
              compact
              icon={item.icon}
              iconColor={item.iconColor}
              iconBackgroundColor={`${item.iconColor}1A`}
              title={item.title}
              subtitle={item.desc}
              onPress={() => router.push(item.route as never)}
              isLast={index === MENU.length - 1}
            />
          ))}
        </SettingsGroup>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  topCopy: { flex: 1, gap: 2 },
  signOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.control,
  },
  scroll: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
});
