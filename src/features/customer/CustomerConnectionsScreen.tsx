import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { appRoutes } from '@/src/constants/navigation';
import type { ConnectionsHubId } from '@/src/constants/connectionsFlowIcons';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { theme } from '@/src/constants/theme';
import {
  ConnectionsFlatTabs,
  ConnectionsListGroup,
  ConnectionsListRow,
  ConnectionsToggleRow,
  type ConnectionsTheme,
} from '@/src/features/customer/components/ConnectionsChrome';
import { printerUi } from '@/src/features/printer/components/PrinterScreenUi';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerConnections } from '@/src/hooks/useCustomerConnections';
import { CUSTOMER_TRIAL_DAYS } from '@/src/constants/customerTrial';
import { trialDaysRemaining } from '@/src/services/customerTrialService';
import { formatRelative } from '@/src/services/customerConnectionsService';
import { iosDesign } from '@/src/design-system/ios';

function useConnectionsTheme(): ConnectionsTheme {
  const { colors, isDark } = useAppTheme();
  return useMemo(
    () => ({
      background: colors.background,
      surface: colors.surface,
      surfaceGlass: colors.surfaceGlass,
      border: colors.border,
      textPrimary: colors.textPrimary,
      textMuted: colors.textMuted,
      primary: colors.primary,
      primarySoft: colors.primarySoft,
      systemBlue: colors.systemBlue,
      danger: theme.colors.danger,
      success: theme.status.success,
      isDark,
    }),
    [colors, isDark],
  );
}

export function CustomerConnectionsScreen() {
  const { user } = useAuth();
  const ui = useConnectionsTheme();
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refresh, toggleChannel, revokeDevice } =
    useCustomerConnections(user);
  const [activeTab, setActiveTab] = useState<ConnectionsHubId>('nfc');

  const publicUrl = data?.profiles[0]?.slug ? buildSlugProfileUrl(data.profiles[0].slug!) : null;

  async function handleShareProfile() {
    if (!publicUrl) {
      Alert.alert('Publish your profile', 'Edit your bio and publish a public slug first.');
      return;
    }
    await Share.share({ message: `My NFC profile: ${publicUrl}`, url: publicUrl });
  }

  async function handleExportContact() {
    if (!user) return;
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${user.displayName || 'NFC Profile'}`,
      user.email ? `EMAIL:${user.email}` : '',
      user.phone ? `TEL:${user.phone}` : '',
      publicUrl ? `URL:${publicUrl}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');
    await Share.share({ message: vcard, title: 'Contact card' });
  }

  function handleSecurity(action: 'password' | '2fa' | 'sessions') {
    if (action === 'password') {
      Alert.alert('Change password', 'Use Forgot password on the login screen.');
      return;
    }
    if (action === '2fa') {
      Alert.alert('Two-factor authentication', '2FA setup is coming soon.');
      return;
    }
    Alert.alert('Active sessions', 'See the Devices tab.');
  }

  function renderListRows(): ReactNode[] {
    if (!data) return [];

    const rows: React.ReactNode[] = [];

    if (activeTab === 'nfc') {
      if (data.cards.length === 0) {
        rows.push(
          <ConnectionsListRow
            key="nfc-empty"
            icon="Nfc"
            title="No cards linked"
            subtitle="Design and order a card, then connect the chip"
            last={false}
          />,
        );
      } else {
        data.cards.forEach((card, index) => {
          rows.push(
            <ConnectionsListRow
              key={card.id}
              icon="Nfc"
              title={card.name}
              subtitle={`${card.cardId} · ${formatRelative(card.lastTapAt)}`}
              value={card.status === 'active' ? 'Active' : card.status === 'lost' ? 'Lost' : 'Off'}
              onPress={
                card.publicSlug
                  ? () => router.push(`/c/${encodeURIComponent(card.publicSlug!)}`)
                  : undefined
              }
              last={false}
            />,
          );
        });
      }
      rows.push(
        <ConnectionsListRow
          key="nfc-connect"
          icon="Plus"
          title="Connect NFC card"
          onPress={() => router.push('/activate-card')}
          last
        />,
      );
      return rows;
    }

    if (activeTab === 'profiles') {
      data.profiles.forEach((profile) => {
        rows.push(
          <ConnectionsListRow
            key={profile.id}
            icon={profile.type === 'team' ? 'Users' : profile.type === 'business' ? 'Target' : 'User'}
            title={profile.title}
            subtitle={profile.subtitle}
            value={`${profile.views} views`}
            onPress={() =>
              profile.slug ? router.push(`/public/${profile.slug}`) : router.push('/edit-bio')
            }
            last={false}
          />,
        );
      });
      rows.push(
        <ConnectionsListRow key="bio-edit" icon="User" title="Edit public bio" onPress={() => router.push('/edit-bio')} last />,
      );
      return rows;
    }

    if (activeTab === 'social') {
      data.socialChannels.forEach((channel) => {
        const hasValue = Boolean(channel.value.trim());
        rows.push(
          <ConnectionsToggleRow
            key={channel.id}
            icon={channel.icon}
            title={channel.label}
            subtitle={hasValue ? channel.value : 'Add in Edit Bio'}
            enabled={channel.enabled && hasValue}
            disabled={!hasValue}
            onToggle={(next) => void toggleChannel(channel.id, next)}
            last={false}
          />,
        );
      });
      rows.push(
        <ConnectionsListRow key="social-edit" icon="Share" title="Edit channels" onPress={() => router.push('/edit-bio')} last />,
      );
      return rows;
    }

    if (activeTab === 'devices') {
      if (data.devices.length === 0) {
        rows.push(
          <ConnectionsListRow
            key="devices-empty"
            icon="ScanLine"
            title="No other sessions"
            subtitle="Devices appear here when signed in"
            last
          />,
        );
        return rows;
      }
      data.devices.forEach((device, index) => {
        rows.push(
          <ConnectionsListRow
            key={device.id}
            icon={device.kind === 'browser' ? 'ScanLine' : 'Nfc'}
            title={device.label}
            subtitle={`${device.platform.toUpperCase()} · ${formatRelative(device.lastActiveAt)}`}
            value={device.isCurrent ? 'Here' : 'Remove'}
            destructive={!device.isCurrent}
            onPress={device.isCurrent ? undefined : () => void revokeDevice(device.id)}
            last={index === data.devices.length - 1}
          />,
        );
      });
      return rows;
    }

    if (activeTab === 'analytics') {
      rows.push(
        <ConnectionsListRow key="a-nfc" icon="Nfc" title="NFC taps" value={`${data.analytics.totalNfcTaps}`} last={false} />,
        <ConnectionsListRow key="a-qr" icon="QrCode" title="QR scans" value={`${data.analytics.totalQrScans}`} last={false} />,
        <ConnectionsListRow key="a-views" icon="Eye" title="Profile views" value={`${data.analytics.totalProfileViews}`} last={false} />,
        <ConnectionsListRow key="a-visitors" icon="Users" title="Visitors" value={`${data.analytics.uniqueVisitors}`} last={false} />,
        <ConnectionsListRow
          key="a-last"
          icon="Clock"
          title="Last activity"
          value={formatRelative(data.analytics.lastActivityAt)}
          last={false}
        />,
        <ConnectionsListRow
          key="a-full"
          icon="Eye"
          title="Full analytics"
          onPress={() => router.push(appRoutes.guestAnalytics)}
          last
        />,
      );
      return rows;
    }

    rows.push(
      <ConnectionsListRow key="s-pw" icon="Shield" title="Change password" onPress={() => handleSecurity('password')} last={false} />,
      <ConnectionsListRow key="s-2fa" icon="ShieldCheck" title="Two-factor auth" onPress={() => handleSecurity('2fa')} last={false} />,
    );
    if (data.loginHistory.length === 0) {
      rows.push(
        <ConnectionsListRow key="s-hist" icon="History" title="Login history" onPress={() => handleSecurity('sessions')} last />,
      );
    } else {
      data.loginHistory.forEach((entry, index) => {
        rows.push(
          <ConnectionsListRow
            key={entry.id}
            icon="Nfc"
            title={entry.device}
            subtitle={`${entry.location} · ${formatRelative(entry.at)}`}
            last={index === data.loginHistory.length - 1}
          />,
        );
      });
    }
    return rows;
  }

  function handlePrimaryAction() {
    switch (activeTab) {
      case 'nfc':
        router.push('/activate-card');
        break;
      case 'profiles':
      case 'social':
        router.push('/edit-bio');
        break;
      case 'analytics':
        router.push(appRoutes.guestAnalytics);
        break;
      case 'devices':
        void refresh();
        break;
      case 'security':
        handleSecurity('password');
        break;
      default:
        break;
    }
  }

  const primaryLabel =
    activeTab === 'nfc'
      ? 'Connect card'
      : activeTab === 'profiles' || activeTab === 'social'
        ? 'Edit bio'
        : activeTab === 'analytics'
          ? 'Full analytics'
          : activeTab === 'devices'
            ? 'Refresh'
            : 'Security';

  const listRows = renderListRows();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText style={styles.title}>Connections</AppText>
      </View>

      <ConnectionsFlatTabs active={activeTab} onChange={setActiveTab} />

      <IosScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={ui.primary} />
        }
      >
        {data?.trialEndsAt && trialDaysRemaining(data.trialEndsAt) > 0 ? (
          <AppText style={styles.trialBanner}>
            Trial · {trialDaysRemaining(data.trialEndsAt)} day{trialDaysRemaining(data.trialEndsAt) === 1 ? '' : 's'} left
          </AppText>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={printerUi.accent} />
            <AppText style={styles.muted}>Loading…</AppText>
          </View>
        ) : null}

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

        {!loading && data && listRows.length > 0 ? (
          <ConnectionsListGroup>{listRows}</ConnectionsListGroup>
        ) : null}

        {!loading && data ? (
          <View style={styles.links}>
            <Pressable onPress={() => void handleShareProfile()}>
              <AppText style={styles.link}>Share profile</AppText>
            </Pressable>
            <AppText style={styles.linkDot}>·</AppText>
            <Pressable onPress={() => void handleExportContact()}>
              <AppText style={styles.link}>Export vCard</AppText>
            </Pressable>
            <AppText style={styles.linkDot}>·</AppText>
            <Pressable onPress={() => router.push(appRoutes.guestDesign)}>
              <AppText style={styles.link}>Design card</AppText>
            </Pressable>
            <AppText style={styles.linkDot}>·</AppText>
            <Pressable onPress={() => router.push(appRoutes.accountOrders)}>
              <AppText style={styles.link}>Orders</AppText>
            </Pressable>
          </View>
        ) : null}
      </IosScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) + 85 }]}>
        <Pressable
          onPress={handlePrimaryAction}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        >
          <AppText style={styles.primaryBtnText}>{primaryLabel}</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: printerUi.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: printerUi.text,
    letterSpacing: -0.6,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 88,
    gap: 10,
  },
  trialBanner: {
    fontSize: 12,
    fontWeight: '700',
    color: printerUi.accent,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    paddingVertical: iosDesign.spacing.lg,
  },
  muted: {
    color: printerUi.muted,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontWeight: '700',
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
    color: printerUi.accent,
  },
  linkDot: {
    fontSize: 12,
    color: printerUi.muted,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: printerUi.bg,
  },
  primaryBtn: {
    height: 48,
    borderRadius: printerUi.radiusSm,
    backgroundColor: printerUi.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: {
    opacity: 0.88,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
