import { IosScrollView } from '@/src/components/IosScrollView';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppearanceSegment } from '@/src/components/AppearanceSegment';
import { AppSelect } from '@/src/components/AppSelect';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { languageOptions, profileThemeOptions, typographyColorOptions } from '@/src/constants/options';
import {
  SettingsMessageBanner,
  type SettingsThemeColors,
} from '@/src/features/settings/components/SettingsChrome';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { UiPreferences } from '@/src/types/models';
import { getRoleLabel, getRoleScopeSummary } from '@/src/utils/roleCapabilities';

import { useMemo } from 'react';

const BRAND = '#2596BE';

type SavingKey = 'language' | 'colorMode' | 'profileTheme' | 'typographyColor' | 'reset' | 'signOut' | null;
type Message = { type: 'success' | 'error'; text: string } | null;

function useSettingsColors(colors: ReturnType<typeof useAppTheme>['colors']): SettingsThemeColors {
  return useMemo(
    () => ({
      background: colors.background,
      surface: colors.surface,
      surfaceSoft: colors.surfaceSoft,
      border: colors.border,
      textPrimary: colors.textPrimary,
      textMuted: colors.textMuted,
      primary: colors.primary,
      primarySoft: colors.primarySoft,
      systemBlue: colors.systemBlue,
      danger: theme.colors.danger,
    }),
    [colors]
  );
}

export function SettingsScreen() {
  const { signOutUser, user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { preferences, colors, resolvedColorMode, updatePreferences, resetPreferences, isReady } = useAppTheme();
  const styles = useStyles(colors);
  const ui = useSettingsColors(colors);
  const [savingKey, setSavingKey] = useState<SavingKey>(null);
  const [message, setMessage] = useState<Message>(null);

  const isBusy = savingKey !== null;
  const isSaving = (key: Exclude<SavingKey, null>) => savingKey === key;
  const roleLabel = getRoleLabel(user?.role);

  const languageLabel = languageOptions.find((o) => o.value === preferences.language)?.label ?? 'English';
  const profileThemeLabel = profileThemeOptions.find((o) => o.value === preferences.profileTheme)?.label ?? 'Aqua';
  const typographyLabel = typographyColorOptions.find((o) => o.value === preferences.typographyColor)?.label ?? 'Default';
  const appearanceLabel =
    preferences.colorMode === 'system' ? `System (${resolvedColorMode})` :
    preferences.colorMode === 'dark' ? 'Dark' : 'Light';

  async function savePreference(
    key: Exclude<SavingKey, 'reset' | 'signOut' | null>,
    next: Partial<UiPreferences>,
    label: string
  ) {
    if (!requireAccount(undefined, { message: 'Create an account to save settings.' })) return;
    if (!isReady || savingKey === key) return;
    setSavingKey(key);
    setMessage(null);
    try {
      await updatePreferences(next);
      setMessage({ type: 'success', text: `${label} saved.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save.' });
    } finally {
      setSavingKey(null);
    }
  }

  async function performReset() {
    if (!requireAccount(undefined, { message: 'Create an account to save settings.' })) return;
    if (isBusy) return;
    setSavingKey('reset');
    setMessage(null);
    try {
      await resetPreferences();
      setMessage({ type: 'success', text: 'Settings reset to defaults.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to reset.' });
    } finally {
      setSavingKey(null);
    }
  }

  function handleReset() {
    Alert.alert(
      'Reset settings?',
      'Language, appearance, theme, and text color will return to defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => void performReset() },
      ]
    );
  }

  async function performSignOut() {
    if (isBusy) return;
    setSavingKey('signOut');
    setMessage(null);
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to sign out.' });
      setSavingKey(null);
    }
  }

  const initial = (user?.displayName?.trim() || 'S')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <View style={styles.pageTitleWrap}>
            <AppText style={styles.pageTitle}>Settings</AppText>
            <AppText style={styles.pageSub}>
              {isGuest ? 'Preview your identity settings' : 'Your identity, preferences, and account'}
            </AppText>
          </View>
        </View>

        {/* Messages */}
        {isGuest ? (
          <SettingsMessageBanner colors={ui} tone="info">
            Guest mode — try light/dark and themes. Create an account to save to cloud.
          </SettingsMessageBanner>
        ) : null}
        {!isReady ? (
          <SettingsMessageBanner colors={ui}>Loading your saved preferences…</SettingsMessageBanner>
        ) : null}
        {message ? (
          <SettingsMessageBanner colors={ui} tone={message.type === 'error' ? 'error' : 'success'}>
            {message.text}
          </SettingsMessageBanner>
        ) : null}

        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initial}</AppText>
          </View>
          <View style={styles.accountCopy}>
            <View style={styles.nameRow}>
              <AppText style={styles.accountName} numberOfLines={1}>{user?.displayName ?? 'Guest User'}</AppText>
              {!isGuest ? <AppIcon name="BadgeCheck" size={18} color={BRAND} /> : null}
            </View>
            <AppText style={styles.accountEmail} numberOfLines={1}>{user?.email ?? 'Not signed in'}</AppText>
            <AppText style={styles.accountRole}>{roleLabel}</AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Essentials</AppText>
          <View style={styles.list}>
            <SettingsRow styles={styles} colors={colors} icon="CreditCard" title="Card studio" value="Design" onPress={() => router.push(appRoutes.studio as any)} />
            <SettingsRow styles={styles} colors={colors} icon="Users" title="Network" value="People" onPress={() => router.push(appRoutes.customerConnections)} />
            <SettingsRow styles={styles} colors={colors} icon="BarChart" title="Analysis" value="Signals" onPress={() => router.push(isGuest ? appRoutes.guestAnalytics : appRoutes.customerAnalysis)} />
            <SettingsRow styles={styles} colors={colors} icon="Package" title="Orders" value="Track" onPress={() => router.push(isGuest ? appRoutes.guestTrackOrder : appRoutes.customer.orders)} />
            <SettingsRow styles={styles} colors={colors} icon="Sparkles" title="Marketing Showcase" value="Premium" onPress={() => router.push('/promotional-preview')} last />
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Appearance</AppText>
          <View style={styles.list}>
          <View style={styles.appearanceBlock}>
            <View style={styles.appearanceHead}>
              <AppIcon name="Eye" size={22} color={BRAND} />
              <View style={styles.appearanceCopy}>
                <AppText style={styles.appearanceTitle}>Display mode</AppText>
                <AppText style={styles.appearanceSub}>Currently: {appearanceLabel}</AppText>
              </View>
            </View>
            <AppearanceSegment
              value={preferences.colorMode}
              disabled={!isReady || isSaving('colorMode')}
              onChange={(value) => void savePreference('colorMode', { colorMode: value }, 'Appearance')}
            />
          </View>
          <SettingsRow styles={styles} colors={colors} icon="Settings" title="Language" value={languageLabel} onPress={() => router.push('/language-picker')} />
          <SettingsRow styles={styles} colors={colors} icon="Sparkles" title="Profile theme" value={profileThemeLabel} onPress={() => router.push('/theme-picker')} />
          <View style={styles.selectWrap}>
            <AppSelect
              label="Text color accent"
              value={preferences.typographyColor}
              description={`Heading color (${typographyLabel})`}
              options={typographyColorOptions.map((o) => ({
                label: o.label,
                value: o.value,
                leading: <View style={[styles.swatch, { backgroundColor: o.color }]} />,
              }))}
              disabled={!isReady || isSaving('typographyColor')}
              onChange={(v) => void savePreference('typographyColor', { typographyColor: v }, 'Text color')}
            />
          </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Account</AppText>
          <View style={styles.list}>
            <SettingsRow styles={styles} colors={colors} icon="ShieldCheck" title="Access" value={getRoleScopeSummary(user?.role)} />
            <SettingsRow styles={styles} colors={colors} icon="FileText" title="Privacy policy" onPress={() => router.push('/privacy-policy')} />
            <SettingsRow styles={styles} colors={colors} icon="FileText" title="Terms of service" onPress={() => router.push('/terms-of-service')} />
            <SettingsRow styles={styles} colors={colors} icon="RefreshCw" title="Reset settings" value={isSaving('reset') ? '…' : undefined} onPress={handleReset} disabled={isBusy} />
            <SettingsRow styles={styles} colors={colors} icon="LogOut" title="Sign out" value={isSaving('signOut') ? '…' : undefined} onPress={() => void performSignOut()} disabled={isBusy} destructive last />
          </View>
        </View>

        <View style={styles.versionWrap}>
          <AppText style={styles.versionText}>Snap Tap NFC · v1.0.0</AppText>
        </View>

      </IosScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  title,
  value,
  onPress,
  disabled,
  destructive,
  last,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  last?: boolean;
  styles: any;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && onPress && styles.rowPressed, disabled && styles.rowDisabled]}
    >
      <AppIcon name={icon} size={22} color={destructive ? '#FF3B30' : title === 'Card studio' ? BRAND : colors.textPrimary} />
      <AppText style={[styles.rowTitle, destructive && styles.rowTitleDanger]}>{title}</AppText>
      {value ? <AppText style={styles.rowValue} numberOfLines={1}>{value}</AppText> : null}
      {onPress ? <AppIcon name="ChevronRight" size={15} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

function useStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 24 },

    pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    pageTitleWrap: { flex: 1, gap: 3 },
    pageTitle: { fontSize: 38, lineHeight: 45, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
    pageSub: { fontSize: 15, fontWeight: '600', color: colors.textMuted },

    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
    accountCopy: { flex: 1, minWidth: 0, gap: 4 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
    accountName: { flexShrink: 1, fontSize: 22, fontWeight: '800', color: colors.textPrimary },
    accountEmail: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
    accountRole: { fontSize: 11, fontWeight: '800', color: BRAND },

    section: { gap: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
    list: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowPressed: { opacity: 0.72 },
    rowDisabled: { opacity: 0.4 },
    rowTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    rowTitleDanger: { color: '#FF3B30' },
    rowValue: { maxWidth: 132, fontSize: 14, fontWeight: '600', color: colors.textMuted },

    appearanceBlock: { padding: 20, gap: 14 },
    appearanceHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    appearanceCopy: { flex: 1, gap: 2 },
    appearanceTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    appearanceSub: { fontSize: 13, fontWeight: '500', color: colors.textMuted },

    selectWrap: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },

    swatch: { width: 18, height: 18, borderRadius: 9 },

    versionWrap: { alignItems: 'center', paddingVertical: 8 },
    versionText: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  }), [colors]);
}
