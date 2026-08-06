import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  InteractionManager,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { PageHeader } from '@/src/components/PageHeader';
import { languageOptions } from '@/src/constants/options';
import { pageThemes } from '@/src/constants/pageThemes';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { loadCustomerCloudCard, loadGuestCloudCard } from '@/src/services/guestCardDraftService';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';
import { getRoleLabel } from '@/src/utils/roleCapabilities';

const THEME = pageThemes.settings;

// ─── Reusable Clean Settings Row ──────────────────────────────────────────────
type SettingRowProps = {
  icon: AppIconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  valueText?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
};

const SettingRow = memo(function SettingRow({
  icon,
  iconColor = '#00F0FF',
  title,
  subtitle,
  valueText,
  onPress,
  rightElement,
  isDestructive = false,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress && !rightElement}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
    >
      <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
        <AppIcon
          name={icon}
          size={18}
          color={isDestructive ? '#FF453A' : iconColor}
        />
      </View>

      <View style={styles.rowContent}>
        <AppText
          style={[styles.rowTitle, isDestructive && styles.rowTitleDestructive]}
          weight="medium"
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {rightElement ? (
        rightElement
      ) : valueText ? (
        <View style={styles.rowRight}>
          <AppText style={styles.rowValueText}>{valueText}</AppText>
          {onPress ? (
            <AppIcon name="AltArrowRight" size={14} color="rgba(255,255,255,0.3)" />
          ) : null}
        </View>
      ) : onPress ? (
        <AppIcon name="AltArrowRight" size={16} color="rgba(255,255,255,0.3)" />
      ) : null}
    </Pressable>
  );
});

// ─── Main Settings Screen ─────────────────────────────────────────────────────
export function SettingsScreen() {
  const { signOutUser, user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { preferences, updatePreferences, resetPreferences } = useAppTheme();

  // Local state for toggles with instant persistence
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [securityPinEnabled, setSecurityPinEnabled] = useState(false);
  const [cardProfile, setCardProfile] = useState<{ name: string; cardId: string } | null>(null);

  // Load preferences and card info safely without blocking UI
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        // Load toggles from AsyncStorage
        const [notif, hapt, pin] = await Promise.all([
          AsyncStorage.getItem('setting_notif'),
          AsyncStorage.getItem('setting_haptics'),
          AsyncStorage.getItem('setting_pin'),
        ]);

        if (notif !== null) setNotificationsEnabled(notif === 'true');
        if (hapt !== null) setHapticsEnabled(hapt === 'true');
        if (pin !== null) setSecurityPinEnabled(pin === 'true');

        // Load active cloud card
        let loadedCard: any = null;
        if (isGuest) {
          const guestCardId = await getStoredGuestCardId();
          loadedCard = await loadGuestCloudCard(guestCardId ?? undefined);
        } else if (user?.id) {
          loadedCard = await loadCustomerCloudCard(user.id);
        }

        if (loadedCard) {
          setCardProfile({
            name: loadedCard.fullName || loadedCard.profile?.fullName || 'My GENNFC Card',
            cardId: loadedCard.cardId || 'gennfc-01',
          });
        }
      } catch (err) {
        console.warn('SettingsScreen: Failed to load data:', err);
      }
    });

    return () => task.cancel();
  }, [isGuest, user?.id]);

  // Handlers
  const handleToggleNotifications = useCallback(async (value: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('setting_notif', String(value));
  }, []);

  const handleToggleHaptics = useCallback(async (value: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHapticsEnabled(value);
    await AsyncStorage.setItem('setting_haptics', String(value));
  }, []);

  const handleTogglePin = useCallback(async (value: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSecurityPinEnabled(value);
    await AsyncStorage.setItem('setting_pin', String(value));
  }, []);

  const handleLanguageChange = useCallback(() => {
    const langs = languageOptions;
    const currentIndex = langs.findIndex((l) => l.value === preferences.language);
    const nextLang = langs[(currentIndex + 1) % langs.length];

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void updatePreferences({ language: nextLang.value as any });
    Alert.alert('Language Updated', `Switched language to ${nextLang.label}`);
  }, [preferences.language, updatePreferences]);

  const handleColorModeToggle = useCallback(() => {
    const modes: ('dark' | 'light' | 'system')[] = ['dark', 'light', 'system'];
    const currentIndex = modes.indexOf(preferences.colorMode ?? 'dark');
    const nextMode = modes[(currentIndex + 1) % modes.length];

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void updatePreferences({ colorMode: nextMode });
  }, [preferences.colorMode, updatePreferences]);

  const handleCopyProfileUrl = useCallback(async () => {
    const profileSlug = user?.displayName?.toLowerCase().replace(/\s+/g, '-') || 'my-card';
    const profileUrl = `https://sitehub.app/u/${profileSlug}`;

    try {
      await Share.share({ message: profileUrl, url: profileUrl });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, [user?.displayName]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await signOutUser();
          router.replace('/');
        },
      },
    ]);
  }, [signOutUser]);

  const handleResetPreferences = useCallback(() => {
    Alert.alert('Reset App Settings', 'Restore all preferences to default settings?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await resetPreferences();
          Alert.alert('Done', 'App settings restored to defaults.');
        },
      },
    ]);
  }, [resetPreferences]);

  const currentLangLabel =
    languageOptions.find((l) => l.value === preferences.language)?.label || 'English';

  const userDisplayName = isGuest
    ? 'Guest User'
    : user?.displayName || user?.email?.split('@')[0] || 'Member';
  const roleLabel = getRoleLabel(user?.role);
  const avatarLetter = (userDisplayName[0] || 'G').toUpperCase();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <PageHeader
        theme={THEME}
        title="Settings"
        subtitle="App preferences & account controls"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. USER PROFILE BANNER ─── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <AppText style={styles.avatarText} weight="bold">
              {avatarLetter}
            </AppText>
          </View>

          <View style={styles.profileInfo}>
            <AppText style={styles.profileName} numberOfLines={1} weight="bold">
              {userDisplayName}
            </AppText>
            <View style={styles.roleTag}>
              <View style={styles.roleDot} />
              <AppText style={styles.roleText}>{isGuest ? 'Guest Trial' : roleLabel}</AppText>
            </View>
          </View>

          {isGuest ? (
            <Pressable
              style={styles.upgradeBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                requireAccount(undefined, { message: 'Create an account to sync your card.' });
              }}
            >
              <AppText style={styles.upgradeBtnText} weight="bold">
                Upgrade
              </AppText>
            </Pressable>
          ) : (
            <Pressable style={styles.shareIconBtn} onPress={handleCopyProfileUrl}>
              <AppIcon name="Share" size={18} color="#00F0FF" />
            </Pressable>
          )}
        </View>

        {/* ─── 2. APPEARANCE & PREFERENCES ─── */}
        <AppText style={styles.sectionHeader}>PREFERENCES</AppText>
        <View style={styles.groupCard}>
          <SettingRow
            icon="Global"
            iconColor="#00F0FF"
            title="Language"
            subtitle="Change display language"
            valueText={currentLangLabel}
            onPress={handleLanguageChange}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Sun"
            iconColor="#A855F7"
            title="Theme Mode"
            subtitle="Dark, Light, or System"
            valueText={
              preferences.colorMode === 'system'
                ? 'System'
                : preferences.colorMode === 'light'
                ? 'Light'
                : 'Dark'
            }
            onPress={handleColorModeToggle}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Bell"
            iconColor="#3B82F6"
            title="Push Notifications"
            subtitle="Order updates & tap alerts"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#26262A', true: '#00F0FF' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Vibration"
            iconColor="#10B981"
            title="Haptic Feedback"
            subtitle="Vibrate on tap interactions"
            rightElement={
              <Switch
                value={hapticsEnabled}
                onValueChange={handleToggleHaptics}
                trackColor={{ false: '#26262A', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* ─── 3. CARD & SECURITY ─── */}
        <AppText style={styles.sectionHeader}>CARD & SECURITY</AppText>
        <View style={styles.groupCard}>
          <SettingRow
            icon="ShieldCheck"
            iconColor="#F59E0B"
            title="Passcode Lock"
            subtitle="Require PIN on app launch"
            rightElement={
              <Switch
                value={securityPinEnabled}
                onValueChange={handleTogglePin}
                trackColor={{ false: '#26262A', true: '#F59E0B' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Share"
            iconColor="#38BDF8"
            title="Share Public Profile"
            subtitle="Share sitehub.app link"
            onPress={handleCopyProfileUrl}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Card"
            iconColor="#EC4899"
            title="Active NFC Card"
            subtitle={cardProfile ? cardProfile.name : 'GENNFC Digital Pass'}
            valueText={cardProfile ? cardProfile.cardId : 'Active'}
            onPress={() => router.push('/(tabs)/share')}
          />
        </View>

        {/* ─── 4. ACCOUNT ACTIONS ─── */}
        <AppText style={styles.sectionHeader}>ACCOUNT ACTIONS</AppText>
        <View style={styles.groupCard}>
          <SettingRow
            icon="Restart"
            iconColor="#64748B"
            title="Reset App Settings"
            subtitle="Restore default preferences"
            onPress={handleResetPreferences}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Logout"
            title={isGuest ? 'Exit Guest Mode' : 'Sign Out'}
            subtitle={user?.email || 'Sign out of current session'}
            onPress={handleSignOut}
            isDestructive
          />
        </View>

        {/* ─── FOOTER INFO ─── */}
        <View style={styles.footer}>
          <AppText style={styles.footerBrand}>GEN DIGITAL • GENNFC</AppText>
          <AppText style={styles.footerVersion}>Version 1.0.0 (Build 15)</AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  /* User Profile Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#00F0FF',
    fontSize: 20,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  roleText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  upgradeBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  upgradeBtnText: {
    color: '#000000',
    fontSize: 12,
  },
  shareIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Group Section Header */
  sectionHeader: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },

  /* Group Card Container */
  groupCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 16,
  },

  /* Setting Row Item */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    minHeight: 56,
  },
  rowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDestructive: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  rowTitleDestructive: {
    color: '#FF453A',
  },
  rowSubtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValueText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
    gap: 4,
  },
  footerBrand: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  footerVersion: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 11,
  },
});
