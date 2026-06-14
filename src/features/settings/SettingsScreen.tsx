import { IosScrollView } from '@/src/components/IosScrollView';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon } from '@/src/components/AppIcon';
import { AppearanceSegment } from '@/src/components/AppearanceSegment';
import { AppSelect } from '@/src/components/AppSelect';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { languageOptions, profileThemeOptions, typographyColorOptions } from '@/src/constants/options';
import {
  SettingsAccountCard,
  SettingsCapabilityRow,
  SettingsMessageBanner,
  SettingsSectionLabel,
  SettingsSurfaceCard,
  SettingsTile,
  settingsChromeStyles,
  type SettingsThemeColors,
} from '@/src/features/settings/components/SettingsChrome';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { UiPreferences } from '@/src/types/models';
import { getRoleCapabilities, getRoleLabel, getRoleScopeSummary } from '@/src/utils/roleCapabilities';

// ─── tokens ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const INK = '#0A0A0F';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';

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
  const ui = useSettingsColors(colors);
  const [savingKey, setSavingKey] = useState<SavingKey>(null);
  const [message, setMessage] = useState<Message>(null);

  const isBusy = savingKey !== null;
  const isSaving = (key: Exclude<SavingKey, null>) => savingKey === key;
  const capabilities = getRoleCapabilities(user?.role);
  const roleLabel = getRoleLabel(user?.role);
  const roleAccent = BRAND;

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

  const avatarRole =
    user?.role === 'printer' || user?.role === 'printer_operator' ? 'printer' :
    user?.role === 'sales' || user?.role === 'agent' ? 'sales' : 'default';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={settingsChromeStyles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── PAGE HEADER ── */}
        <View style={styles.pageHeader}>
          <View style={styles.pageTitleWrap}>
            <AppText style={styles.pageTitle}>Settings</AppText>
            <AppText style={styles.pageSub}>
              {isGuest ? 'Preview options · sign up to sync' : 'Account, appearance & preferences'}
            </AppText>
          </View>
          <AppIcon name="Settings" size={28} color={BRAND} />
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

        {/* ── ACCOUNT CARD ── */}
        <SettingsAccountCard
          colors={ui}
          displayName={user?.displayName ?? 'Guest User'}
          email={user?.email ?? 'Not signed in'}
          roleLabel={roleLabel}
          roleAccent={roleAccent}
          avatar={<AppAvatar name={user?.displayName ?? 'User'} role={avatarRole} size={52} />}
        />

        {/* ── QUICK NAV TILES ── */}
        <SettingsSectionLabel colors={ui}>Quick access</SettingsSectionLabel>
        <SettingsSurfaceCard colors={ui}>
          <SettingsTile
            colors={ui}
            icon="CreditCard"
            title="My card"
            description="Design or edit your NFC card"
            accent={BRAND}
            onPress={() => router.push(appRoutes.guestDesign)}
          />
          <SettingsTile
            colors={ui}
            icon="Package"
            title="Track order"
            description="Production and delivery status"
            accent="#F59E0B"
            onPress={() => router.push(appRoutes.guestTrackOrder)}
          />
          <SettingsTile
            colors={ui}
            icon="Nfc"
            title="NFC demo"
            description="Simulate a card tap"
            accent="#7C3AED"
            onPress={() => router.push(appRoutes.nfcDemo)}
          />
          <SettingsTile
            colors={ui}
            icon="TrendingUp"
            title="Analytics"
            description="Tap and order stats"
            accent="#10B981"
            onPress={() => router.push(appRoutes.guestAnalytics)}
            last
          />
        </SettingsSurfaceCard>

        {/* ── APPEARANCE ── */}
        <SettingsSectionLabel colors={ui}>Appearance</SettingsSectionLabel>
        <SettingsSurfaceCard colors={ui}>
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
        </SettingsSurfaceCard>

        {/* ── PERSONALISATION ── */}
        <SettingsSectionLabel colors={ui}>Personalisation</SettingsSectionLabel>
        <SettingsSurfaceCard colors={ui}>
          <SettingsTile
            colors={ui}
            icon="Settings"
            title="Language"
            description="Display language"
            value={languageLabel}
            accent="#6366F1"
            onPress={() => router.push('/language-picker')}
          />
          <SettingsTile
            colors={ui}
            icon="Sparkles"
            title="Profile theme"
            value={profileThemeLabel}
            accent="#0EA5E9"
            onPress={() => router.push('/theme-picker')}
          />
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
        </SettingsSurfaceCard>

        {/* ── ACCESS SCOPE ── */}
        <SettingsSectionLabel colors={ui}>Access scope</SettingsSectionLabel>
        <SettingsSurfaceCard colors={ui}>
          <SettingsTile
            colors={ui}
            icon="ShieldCheck"
            title={roleLabel}
            description={getRoleScopeSummary(user?.role)}
            accent={roleAccent}
            last={capabilities.length === 0}
          />
          {capabilities.map((cap, i) => (
            <SettingsCapabilityRow
              key={cap.title}
              colors={ui}
              title={cap.title}
              description={cap.description}
              accent={roleAccent}
              last={i === capabilities.length - 1}
            />
          ))}
        </SettingsSurfaceCard>

        {/* ── LEGAL ── */}
        <SettingsSectionLabel colors={ui}>Legal</SettingsSectionLabel>
        <SettingsSurfaceCard colors={ui}>
          <SettingsTile
            colors={ui}
            icon="FileText"
            title="Privacy policy"
            accent={MUTED}
            onPress={() => router.push('/privacy-policy')}
          />
          <SettingsTile
            colors={ui}
            icon="FileText"
            title="Terms of service"
            accent={MUTED}
            onPress={() => router.push('/terms-of-service')}
            last
          />
        </SettingsSurfaceCard>

        {/* ── SESSION ── */}
        <SettingsSectionLabel colors={ui}>Session</SettingsSectionLabel>
        <SettingsSurfaceCard colors={ui}>
          <SettingsTile
            colors={ui}
            icon="RefreshCw"
            title="Reset settings"
            description="Restore language, theme, and colors"
            value={isSaving('reset') ? '…' : undefined}
            accent="#F59E0B"
            onPress={handleReset}
            disabled={isBusy}
          />
          <SettingsTile
            colors={ui}
            icon="LogOut"
            title="Sign out"
            description="End this session on this device"
            value={isSaving('signOut') ? '…' : undefined}
            destructive
            onPress={() => void performSignOut()}
            disabled={isBusy}
            last
          />
        </SettingsSurfaceCard>

        {/* ── VERSION ── */}
        <View style={styles.versionWrap}>
          <AppText style={styles.versionText}>Snap Tap NFC · v1.0.0</AppText>
        </View>

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  pageTitleWrap: { flex: 1, gap: 3 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -0.8, fontFamily: 'Inter_900Black' },
  pageSub: { fontSize: 13, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },

  appearanceBlock: { padding: 18, gap: 14 },
  appearanceHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appearanceCopy: { flex: 1, gap: 2 },
  appearanceTitle: { fontSize: 15, fontWeight: '700', color: INK, fontFamily: 'Inter_700Bold' },
  appearanceSub: { fontSize: 12, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },

  selectWrap: { paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.05)' },

  swatch: { width: 18, height: 18, borderRadius: 9 },

  versionWrap: { alignItems: 'center', paddingVertical: 8 },
  versionText: { fontSize: 11, fontWeight: '500', color: '#C7C7CC', fontFamily: 'Inter_500Medium' },
});
