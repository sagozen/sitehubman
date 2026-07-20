/**
 * SettingsScreen — Redesigned with Savee Dark Premium aesthetic.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { router } from 'expo-router';
import { memo, useCallback, useState, useEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppearanceSegment } from '@/src/components/AppearanceSegment';
import { AppSelect } from '@/src/components/AppSelect';
import { AppText } from '@/src/components/AppText';
import { PageHeader } from '@/src/components/PageHeader';
import { appRoutes } from '@/src/constants/navigation';
import { pageThemes } from '@/src/constants/pageThemes';
import {
  languageOptions,
  profileThemeOptions,
  typographyColorOptions,
} from '@/src/constants/options';
import { SettingsMessageBanner } from '@/src/features/settings/components/SettingsChrome';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { loadGuestCloudCard, loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UiPreferences } from '@/src/types/models';
import {
  getRoleLabel,
  getRoleScopeSummary,
} from '@/src/utils/roleCapabilities';
import { HapticTap } from '@/src/utils/haptics';

// ─── Savee Dark Theme Design tokens ──────────────────────────────────────────
const PAGE_THEME = pageThemes.settings;
const T = {
  primary: PAGE_THEME.accent,
  success: '#30D158',
  warning: '#FF9F0A',
  destructive: '#FF453A',
  bg: PAGE_THEME.canvas,
  card: PAGE_THEME.surface,
  ink: PAGE_THEME.text,
  muted: PAGE_THEME.muted,
  brand: PAGE_THEME.accent,
  border: PAGE_THEME.border,
};

type SavingKey =
  | 'language'
  | 'colorMode'
  | 'profileTheme'
  | 'typographyColor'
  | 'reset'
  | 'signOut'
  | 'card'
  | null;
type Msg = { type: 'success' | 'error'; text: string } | null;

// ─── CardControlRow ───────────────────────────────────────────────────────────
const CardControlRow = memo(function CardControlRow({
  cardId,
  name,
  isPrimary,
  isHidden,
  onSetPrimary,
  onToggleHide,
  onUpgrade,
}: {
  cardId: string;
  name: string;
  isPrimary: boolean;
  isHidden: boolean;
  onSetPrimary: (id: string) => void;
  onToggleHide: (id: string) => void;
  onUpgrade: (id: string) => void;
}) {
  return (
    <View style={ccr.wrap}>
      <View style={ccr.left}>
        <View style={[ccr.indicator, isPrimary && ccr.indicatorActive]} />
        <View style={ccr.info}>
          <AppText style={ccr.name} numberOfLines={1} weight="bold">
            {name}
          </AppText>
          <AppText style={ccr.status}>
            {isPrimary
              ? 'Primary card · shown on home'
              : isHidden
                ? 'Hidden'
                : 'Active'}
          </AppText>
        </View>
      </View>
      <View style={ccr.actions}>
        {/* Set Primary */}
        {!isPrimary ? (
          <Pressable
            style={({ pressed }) => [
              ccr.btn,
              ccr.btnPrimary,
              pressed && ccr.btnPressed,
            ]}
            onPress={() => {
              HapticTap.light();
              onSetPrimary(cardId);
            }}
          >
            <AppText style={ccr.btnPrimaryText} weight="bold">
              Set primary
            </AppText>
          </Pressable>
        ) : (
          <View style={[ccr.btn, ccr.btnActive]}>
            <AppIcon
              name="Star"
              size={12}
              color="#FFFFFF"
              variant="solar-duotone"
            />
            <AppText style={ccr.btnActiveText} weight="bold">
              Primary
            </AppText>
          </View>
        )}

        {/* Hide / Show */}
        <Pressable
          style={({ pressed }) => [
            ccr.btn,
            ccr.btnGhost,
            pressed && ccr.btnPressed,
          ]}
          onPress={() => {
            HapticTap.light();
            onToggleHide(cardId);
          }}
        >
          <AppText style={ccr.btnGhostText} weight="bold">
            {isHidden ? 'Show' : 'Hide'}
          </AppText>
        </Pressable>

        {/* Upgrade */}
        <Pressable
          style={({ pressed }) => [
            ccr.btn,
            ccr.btnUpgrade,
            pressed && ccr.btnPressed,
          ]}
          onPress={() => {
            HapticTap.medium();
            onUpgrade(cardId);
          }}
        >
          <AppText style={ccr.btnUpgradeText} weight="bold">
            Upgrade
          </AppText>
        </Pressable>
      </View>
    </View>
  );
});

const ccr = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A3C',
  },
  indicatorActive: { backgroundColor: '#FFFFFF' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, color: T.ink },
  status: { fontSize: 12, color: T.muted },

  // Action buttons row
  actions: { flexDirection: 'row', gap: 8, paddingLeft: 18 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 30,
  },
  btnPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },

  // Set primary — Savee white pill
  btnPrimary: {
    backgroundColor: '#FFFFFF',
  },
  btnPrimaryText: { fontSize: 12, color: '#000000' },

  // Active primary state
  btnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0,
  },
  btnActiveText: { fontSize: 12, color: '#FFFFFF' },

  // Ghost — hide/show
  btnGhost: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0,
  },
  btnGhostText: { fontSize: 12, color: '#FFFFFF' },

  // Upgrade — glass outline
  btnUpgrade: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0,
  },
  btnUpgradeText: { fontSize: 12, color: '#FFFFFF' },
});

// ─── SettingsRow ──────────────────────────────────────────────────────────────
const SettingsRow = memo(function SettingsRow({
  icon,
  title,
  value,
  onPress,
  disabled,
  destructive,
  last,
}: {
  icon: AppIconName;
  title: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        HapticTap.light();
        onPress?.();
      }}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        sr.row,
        !last && sr.border,
        pressed && onPress && sr.pressed,
        disabled && sr.disabled,
      ]}
    >
      <AppIcon
        name={icon}
        size={22}
        color={destructive ? T.destructive : '#FFFFFF'}
        variant="solar-duotone"
      />
      <AppText style={[sr.title, destructive && sr.titleDanger]} weight="bold">
        {title}
      </AppText>
      {value ? (
        <AppText style={sr.value} numberOfLines={1}>
          {value}
        </AppText>
      ) : null}
      {onPress ? (
        <AppIcon name="ChevronRight" size={15} color={T.muted} />
      ) : null}
    </Pressable>
  );
});

const sr = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.35 },
  title: { flex: 1, fontSize: 15, color: T.ink },
  titleDanger: { color: T.destructive },
  value: { maxWidth: 132, fontSize: 13, color: T.muted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const { signOutUser, user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const {
    preferences,
    resolvedColorMode,
    updatePreferences,
    resetPreferences,
    isReady,
  } = useAppTheme();
  const [savingKey, setSavingKey] = useState<SavingKey>(null);
  const [message, setMessage] = useState<Msg>(null);
  const [cloudCard, setCloudCard] = useState<any>(null);

  useEffect(() => {
    const loadCard = async () => {
      try {
        if (isGuest) {
          const cardId = await AsyncStorage.getItem('guest_card_id');
          if (cardId) {
            const loaded = await loadGuestCloudCard(cardId);
            setCloudCard(loaded);
          }
        } else if (user?.id) {
          const loaded = await loadCustomerCloudCard(user.id);
          setCloudCard(loaded);
        }
      } catch {}
    };
    void loadCard();
  }, [isGuest, user?.id]);

  const isBusy = savingKey !== null;
  const isSaving = (k: Exclude<SavingKey, null>) => savingKey === k;
  const roleLabel = getRoleLabel(user?.role);

  const languageLabel =
    languageOptions.find((o) => o.value === preferences.language)?.label ??
    'English';
  const profileThemeLabel =
    profileThemeOptions.find((o) => o.value === preferences.profileTheme)
      ?.label ?? 'Aqua';
  const typographyLabel =
    typographyColorOptions.find((o) => o.value === preferences.typographyColor)
      ?.label ?? 'Default';
  const appearanceLabel =
    preferences.colorMode === 'system'
      ? `System (${resolvedColorMode})`
      : preferences.colorMode === 'dark'
        ? 'Dark'
        : 'Light';

  const initial = (user?.displayName?.trim() || 'S')[0].toUpperCase();

  async function savePref(
    key: Exclude<SavingKey, 'reset' | 'signOut' | null>,
    next: Partial<UiPreferences>,
    label: string,
  ) {
    if (isGuest) {
      try {
        await updatePreferences(next);
      } catch {}
      return;
    }
    if (
      !requireAccount(undefined, {
        message: 'Create an account to save settings.',
      })
    )
      return;
    if (!isReady || savingKey === key) return;
    setSavingKey(key);
    setMessage(null);
    try {
      await updatePreferences(next);
      setMessage({ type: 'success', text: `${label} saved.` });
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Unable to save.',
      });
    } finally {
      setSavingKey(null);
    }
  }

  const handleSetPrimary = useCallback(
    async (cardId: string) => {
      if (isGuest) {
        try {
          await updatePreferences({ primaryCardId: cardId });
        } catch {}
        return;
      }
      if (
        !requireAccount(undefined, {
          message: 'Create an account to save preferences.',
        })
      )
        return;
      setSavingKey('card');
      try {
        await updatePreferences({ primaryCardId: cardId });
        setMessage({
          type: 'success',
          text: 'Primary card updated. Home page will reflect this.',
        });
      } catch {
        setMessage({ type: 'error', text: 'Could not update primary card.' });
      } finally {
        setSavingKey(null);
      }
    },
    [isGuest, requireAccount, updatePreferences],
  );

  const handleToggleHide = useCallback(
    async (cardId: string) => {
      if (isGuest) {
        try {
          const current: string[] = (preferences as any).hiddenCardIds ?? [];
          const next = current.includes(cardId)
            ? current.filter((id) => id !== cardId)
            : [...current, cardId];
          await updatePreferences({
            hiddenCardIds: next,
          } as Partial<UiPreferences>);
        } catch {}
        return;
      }
      if (
        !requireAccount(undefined, {
          message: 'Create an account to save preferences.',
        })
      )
        return;
      setSavingKey('card');
      try {
        const current: string[] = (preferences as any).hiddenCardIds ?? [];
        const next = current.includes(cardId)
          ? current.filter((id) => id !== cardId)
          : [...current, cardId];
        await updatePreferences({
          hiddenCardIds: next,
        } as Partial<UiPreferences>);
        setMessage({
          type: 'success',
          text: current.includes(cardId) ? 'Card shown.' : 'Card hidden.',
        });
      } catch {
        setMessage({
          type: 'error',
          text: 'Could not update card visibility.',
        });
      } finally {
        setSavingKey(null);
      }
    },
    [preferences, isGuest, requireAccount, updatePreferences],
  );

  const handleUpgrade = useCallback((cardId: string) => {
    router.push(appRoutes.studio as any);
  }, []);

  async function doReset() {
    if (
      !requireAccount(undefined, {
        message: 'Create an account to save settings.',
      })
    )
      return;
    if (isBusy) return;
    setSavingKey('reset');
    setMessage(null);
    try {
      await resetPreferences();
      setMessage({ type: 'success', text: 'Settings reset to defaults.' });
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Unable to reset.',
      });
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
        { text: 'Reset', style: 'destructive', onPress: () => void doReset() },
      ],
    );
  }

  async function doSignOut() {
    if (isBusy) return;
    setSavingKey('signOut');
    setMessage(null);
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Unable to sign out.',
      });
      setSavingKey(null);
    }
  }

  const primaryCardId = preferences.primaryCardId || 'card-primary';
  const hiddenCardIds: string[] = (preferences as any).hiddenCardIds ?? [];
  const cards = useMemo(() => {
    if (cloudCard) {
      return [
        {
          id: cloudCard.cardId,
          fullName: cloudCard.profile.fullName || user?.displayName || 'My Card',
          title: cloudCard.profile.role || '',
          phone: cloudCard.profile.phone || '',
        },
      ];
    }
    return [];
  }, [cloudCard, user?.displayName]);

  // Fake colors object for message banner (dark styled)
  const bannerColors = {
    background: '#1C1C1E',
    surface: T.card,
    surfaceSoft: '#1C1C1E',
    border: T.border,
    textPrimary: T.ink,
    textMuted: T.muted,
    primary: T.primary,
    primarySoft: 'rgba(255, 255, 255, 0.08)',
    systemBlue: '#FFFFFF',
    danger: T.destructive,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <PageHeader
          theme={PAGE_THEME}
          eyebrow="Application control"
          title="Settings"
          subtitle={
            isGuest
              ? 'Preview application settings.'
              : 'Control cards, themes, and preferences.'
          }
          icon="Settings"
          compact
        />

        {/* ── Banners ── */}
        {isGuest ? (
          <SettingsMessageBanner colors={bannerColors} tone="info">
            Guest mode — try light/dark and themes. Create an account to save to
            cloud.
          </SettingsMessageBanner>
        ) : null}
        {!isReady ? (
          <SettingsMessageBanner colors={bannerColors}>
            Loading your saved preferences…
          </SettingsMessageBanner>
        ) : null}
        {message ? (
          <SettingsMessageBanner
            colors={bannerColors}
            tone={message.type === 'error' ? 'error' : 'success'}
          >
            {message.text}
          </SettingsMessageBanner>
        ) : null}

        {/* ── Account card ── */}
        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText} weight="bold">
              {initial}
            </AppText>
          </View>
          <View style={styles.accountCopy}>
            <View style={styles.nameRow}>
              <AppText
                style={styles.accountName}
                numberOfLines={1}
                weight="extrabold"
              >
                {user?.displayName ?? 'Guest User'}
              </AppText>
              {!isGuest ? (
                <AppIcon
                  name="BadgeCheck"
                  size={18}
                  color="#FFFFFF"
                  variant="solar-duotone"
                />
              ) : null}
            </View>
            <AppText style={styles.accountEmail} numberOfLines={1}>
              {user?.email ?? 'Not signed in'}
            </AppText>
            <View style={styles.roleBadge}>
              <AppText style={styles.roleBadgeText} weight="bold">
                {roleLabel}
              </AppText>
            </View>
          </View>
        </View>

        {/* ── MY CARD section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText style={styles.sectionTitle} weight="extrabold">
              My Cards
            </AppText>
            <AppText style={styles.sectionMeta} weight="medium">
              Controls what shows on your home
            </AppText>
          </View>
          <View style={styles.list}>
            {cards.map((card, index) => {
              const isLast = index === cards.length - 1;
              const name = card.fullName || card.title || `Card ${index + 1}`;
              return (
                <View
                  key={card.id}
                  style={isLast ? styles.cardRowLast : undefined}
                >
                  <CardControlRow
                    cardId={card.id}
                    name={name}
                    isPrimary={card.id === primaryCardId}
                    isHidden={hiddenCardIds.includes(card.id)}
                    onSetPrimary={handleSetPrimary}
                    onToggleHide={handleToggleHide}
                    onUpgrade={handleUpgrade}
                  />
                </View>
              );
            })}

            {/* Add new card CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.addCardRow,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                HapticTap.medium();
                router.push(appRoutes.guestDesign as any);
              }}
            >
              <AppIcon
                name="PlusCircle"
                size={22}
                color="#FFFFFF"
                variant="solar-duotone"
              />
              <AppText style={styles.addCardText} weight="bold">
                Create a new card
              </AppText>
              <AppIcon name="ChevronRight" size={15} color={T.muted} />
            </Pressable>
          </View>
        </View>

        {/* ── Essentials ── */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle} weight="extrabold">
            Essentials
          </AppText>
          <View style={styles.list}>
            <SettingsRow
              icon="CreditCard"
              title="Card studio"
              value="Design"
              onPress={() => router.push(appRoutes.studio as any)}
            />
            <SettingsRow
              icon="Users"
              title="Network"
              value="People"
              onPress={() => router.push(appRoutes.customerConnections)}
            />
            <SettingsRow
              icon="BarChart"
              title="Analysis"
              value="Signals"
              onPress={() =>
                router.push(
                  isGuest
                    ? appRoutes.guestAnalytics
                    : appRoutes.customerAnalysis,
                )
              }
            />
            <SettingsRow
              icon="Package"
              title="Orders"
              value="Track"
              onPress={() =>
                router.push(
                  isGuest
                    ? appRoutes.guestTrackOrder
                    : appRoutes.customer.orders,
                )
              }
              last
            />
          </View>
        </View>

        {/* ── Appearance ── */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle} weight="extrabold">
            Appearance
          </AppText>
          <View style={styles.list}>
            <View style={styles.appearanceBlock}>
              <View style={styles.appearanceHead}>
                <AppIcon
                  name="Eye"
                  size={22}
                  color="#FFFFFF"
                  variant="solar-duotone"
                />
                <View style={styles.appearanceCopy}>
                  <AppText style={styles.appearanceTitle} weight="bold">
                    Display mode
                  </AppText>
                  <AppText style={styles.appearanceSub}>
                    Currently: {appearanceLabel}
                  </AppText>
                </View>
              </View>
              <AppearanceSegment
                value={preferences.colorMode}
                disabled={!isReady || isSaving('colorMode')}
                onChange={(v) =>
                  void savePref('colorMode', { colorMode: v }, 'Appearance')
                }
              />
            </View>
            <SettingsRow
              icon="Settings"
              title="Language"
              value={languageLabel}
              onPress={() => router.push('/language-picker')}
            />
            <SettingsRow
              icon="Sparkles"
              title="Profile theme"
              value={profileThemeLabel}
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
                  leading: (
                    <View
                      style={[styles.swatch, { backgroundColor: o.color }]}
                    />
                  ),
                }))}
                disabled={!isReady || isSaving('typographyColor')}
                onChange={(v) =>
                  void savePref(
                    'typographyColor',
                    { typographyColor: v },
                    'Text color',
                  )
                }
              />
            </View>
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle} weight="extrabold">
            Account
          </AppText>
          <View style={styles.list}>
            <SettingsRow
              icon="ShieldCheck"
              title="Access"
              value={getRoleScopeSummary(user?.role)}
            />
            <SettingsRow
              icon="FileText"
              title="Privacy policy"
              onPress={() => router.push('/privacy-policy')}
            />
            <SettingsRow
              icon="FileText"
              title="Terms of service"
              onPress={() => router.push('/terms-of-service')}
            />
            <SettingsRow
              icon="RefreshCw"
              title="Reset settings"
              value={isSaving('reset') ? '…' : undefined}
              onPress={handleReset}
              disabled={isBusy}
            />
            <SettingsRow
              icon="LogOut"
              title="Sign out"
              value={isSaving('signOut') ? '…' : undefined}
              onPress={() => void doSignOut()}
              disabled={isBusy}
              destructive
              last
            />
          </View>
        </View>

        <View style={styles.versionWrap}>
          <AppText style={styles.versionText} weight="medium">
            Snap Tap NFC - v1.0.0
          </AppText>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 120,
    gap: 24,
  },

  // Account card — Savee Glass Style
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, color: '#FFFFFF' },
  accountCopy: { flex: 1, minWidth: 0, gap: 4, alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  accountName: {
    flexShrink: 1,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  accountEmail: { fontSize: 12, color: T.muted },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0,
  },

  // Sections
  section: { gap: 10 },
  sectionHead: { gap: 2 },
  sectionTitle: { fontSize: 18, color: T.ink, letterSpacing: 0 },
  sectionMeta: { fontSize: 12, color: T.muted },
  list: {
    backgroundColor: '#111114',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  cardRowLast: {},

  // Add card row
  addCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  addCardText: { flex: 1, fontSize: 15, color: T.ink },

  // Appearance block
  appearanceBlock: {
    padding: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  appearanceHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appearanceCopy: { flex: 1, gap: 2 },
  appearanceTitle: { fontSize: 15, color: T.ink },
  appearanceSub: { fontSize: 12, color: T.muted },

  selectWrap: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  swatch: { width: 18, height: 18, borderRadius: 9 },

  versionWrap: { alignItems: 'center', paddingVertical: 12 },
  versionText: { fontSize: 11, color: '#3A3A3C' },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
