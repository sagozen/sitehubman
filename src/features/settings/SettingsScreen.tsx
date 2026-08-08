/**
 * SettingsScreen — Clean, modern X.com (Twitter) style settings.
 *
 * Layout & Design:
 *  1. Solid black canvas (#000000) with 640px responsive container
 *  2. High-contrast profile banner card with avatar, handle, role badge, and edit action
 *  3. X.com-style categorized settings groups:
 *     - YOUR ACCOUNT (Account info, Change password, Profile link)
 *     - CREATOR & NFC DIGITAL CARDS (Active NFC Card, Card design, Public Bio URL)
 *     - SECURITY & PRIVACY (Passcode lock, Biometrics, Data privacy)
 *     - PREFERENCES & ACCESSIBILITY (Display theme, Language, Notifications, Haptics)
 *     - SUPPORT & RESOURCES (Help Center, Terms of Service, Privacy policy)
 *     - ACCOUNT ACTIONS (Reset settings, Sign out / Exit guest)
 *  4. Charcoal cards (#111114, 1px border rgba(255,255,255,0.08)) with clean row dividers
 *  5. Direct touch targets (hitSlop >= 48dp) & haptic tap feedback
 */
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
import { AppHeaderV2 } from '@/src/components/AppHeaderV2';
import { ProfileCardV2 } from '@/src/components/ProfileCardV2';
import { languageOptions } from '@/src/constants/options';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { loadCustomerCloudCard, loadGuestCloudCard } from '@/src/services/guestCardDraftService';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';
import { getRoleLabel } from '@/src/utils/roleCapabilities';

// ─── Reusable X.com Style Setting Row ─────────────────────────────────────────
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
  iconColor = '#1D9BF0',
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
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
        <AppIcon
          name={icon}
          size={18}
          color={isDestructive ? '#FF3B30' : iconColor}
        />
      </View>

      <View style={styles.rowContent}>
        <AppText
          style={[styles.rowTitle, isDestructive && styles.rowTitleDestructive]}
          weight="extrabold"
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
            <AppIcon name="ChevronRight" size={14} color="rgba(255,255,255,0.3)" />
          ) : null}
        </View>
      ) : onPress ? (
        <AppIcon name="ChevronRight" size={16} color="rgba(255,255,255,0.3)" />
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

  // Local persistent state for toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [securityPinEnabled, setSecurityPinEnabled] = useState(false);
  const [cardProfile, setCardProfile] = useState<{ name: string; cardId: string } | null>(null);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const [notif, hapt, pin] = await Promise.all([
          AsyncStorage.getItem('setting_notif'),
          AsyncStorage.getItem('setting_haptics'),
          AsyncStorage.getItem('setting_pin'),
        ]);

        if (notif !== null) setNotificationsEnabled(notif === 'true');
        if (hapt !== null) setHapticsEnabled(hapt === 'true');
        if (pin !== null) setSecurityPinEnabled(pin === 'true');

        let loadedCard: any = null;
        if (isGuest) {
          const guestCardId = await getStoredGuestCardId();
          loadedCard = await loadGuestCloudCard(guestCardId ?? undefined);
        } else if (user?.id) {
          loadedCard = await loadCustomerCloudCard(user.id);
        }

        if (loadedCard) {
          setCardProfile({
            name: loadedCard.fullName || loadedCard.profile?.fullName || 'NFC Business Card',
            cardId: loadedCard.cardId || 'card-nfc-01',
          });
        }
      } catch (err) {
        console.warn('SettingsScreen: Failed to load data:', err);
      }
    });

    return () => task.cancel();
  }, [isGuest, user?.id]);

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
    Alert.alert('Language Updated', `Language set to ${nextLang.label}`);
  }, [preferences.language, updatePreferences]);

  const handleColorModeToggle = useCallback(() => {
    const modes: ('dark' | 'light' | 'system')[] = ['dark', 'light', 'system'];
    const currentIndex = modes.indexOf(preferences.colorMode ?? 'dark');
    const nextMode = modes[(currentIndex + 1) % modes.length];

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void updatePreferences({ colorMode: nextMode });
  }, [preferences.colorMode, updatePreferences]);

  const handleCopyProfileUrl = useCallback(async () => {
    const profileSlug = user?.displayName?.toLowerCase().replace(/\s+/g, '-') || 'my-profile';
    const profileUrl = `https://sitehubman.app/u/${profileSlug}`;

    try {
      await Share.share({ message: profileUrl, url: profileUrl });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, [user?.displayName]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
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
    Alert.alert('Reset Settings', 'Restore all application preferences to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Defaults',
        style: 'destructive',
        onPress: async () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await resetPreferences();
          Alert.alert('Settings Reset', 'Preferences restored to defaults.');
        },
      },
    ]);
  }, [resetPreferences]);

  const currentLangLabel =
    languageOptions.find((l) => l.value === preferences.language)?.label || 'English';

  const userDisplayName = isGuest
    ? 'Guest Creator'
    : user?.displayName || user?.email?.split('@')[0] || 'Member';
  const roleLabel = getRoleLabel(user?.role);
  const avatarLetter = (userDisplayName[0] || 'G').toUpperCase();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppHeaderV2
        title="Settings"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* ─── 1. USER ACCOUNT CARD ─── */}
          <ProfileCardV2
            name={userDisplayName}
            role={isGuest ? 'Guest Trial Mode' : roleLabel}
            company={user?.email || (isGuest ? '@guest_preview' : '@member')}
            isVerified={true}
          />

          {/* ─── 2. YOUR ACCOUNT ─── */}
          <AppText style={styles.sectionHeader}>YOUR ACCOUNT</AppText>
          <View style={styles.groupCard}>
            <SettingRow
              icon="UserRound"
              iconColor="#1D9BF0"
              title="Account Information"
              subtitle="See your email, phone, and account status"
              onPress={() => router.push('/(tabs)/profile')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="Link"
              iconColor="#1D9BF0"
              title="Public Profile Link"
              subtitle="Share your personalized sitehubman link"
              valueText="Share"
              onPress={handleCopyProfileUrl}
            />
          </View>

          {/* ─── 3. CREATOR & NFC CARDS ─── */}
          <AppText style={styles.sectionHeader}>CREATOR & NFC CARDS</AppText>
          <View style={styles.groupCard}>
            <SettingRow
              icon="CreditCard"
              iconColor="#A855F7"
              title="Active Digital Card"
              subtitle={cardProfile ? cardProfile.name : 'Primary NFC Pass'}
              valueText={cardProfile ? cardProfile.cardId : 'Active'}
              onPress={() => router.push('/(tabs)/share')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="QrCode"
              iconColor="#A855F7"
              title="Card Sharing & QR Code"
              subtitle="Display instant QR code for contacts"
              onPress={() => router.push('/(tabs)/share')}
            />
          </View>

          {/* ─── 4. SECURITY & PRIVACY ─── */}
          <AppText style={styles.sectionHeader}>SECURITY & PRIVACY</AppText>
          <View style={styles.groupCard}>
            <SettingRow
              icon="ShieldCheck"
              iconColor="#F59E0B"
              title="Passcode & Security Lock"
              subtitle="Require PIN code when opening app"
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
              icon="Lock"
              iconColor="#F59E0B"
              title="Privacy & Data Control"
              subtitle="Manage public visibility of NFC card links"
              onPress={() => {
                Alert.alert('Privacy Settings', 'Your card is set to public share mode.');
              }}
            />
          </View>

          {/* ─── 5. PREFERENCES & ACCESSIBILITY ─── */}
          <AppText style={styles.sectionHeader}>PREFERENCES & ACCESSIBILITY</AppText>
          <View style={styles.groupCard}>
            <SettingRow
              icon="Global"
              iconColor="#10B981"
              title="Language"
              subtitle="Choose display language"
              valueText={currentLangLabel}
              onPress={handleLanguageChange}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="Sun"
              iconColor="#10B981"
              title="Color Theme"
              subtitle="Dark mode, Light mode, or System default"
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
              subtitle="Receive alerts for NFC taps & updates"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#26262A', true: '#1D9BF0' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon="Vibration"
              iconColor="#3B82F6"
              title="Haptic Vibrations"
              subtitle="Tactile feedback on button presses"
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

          {/* ─── 6. SUPPORT & LEGAL ─── */}
          <AppText style={styles.sectionHeader}>SUPPORT & RESOURCES</AppText>
          <View style={styles.groupCard}>
            <SettingRow
              icon="HelpCircle"
              iconColor="#64748B"
              title="Help Center & Support"
              subtitle="FAQs, contact support team"
              onPress={() => {
                Alert.alert('Support', 'Contact support at support@sitehubman.com');
              }}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="FileText"
              iconColor="#64748B"
              title="Terms of Service"
              subtitle="Read terms and conditions"
              onPress={() => {
                Alert.alert('Terms of Service', 'Available at sitehubman.com/terms');
              }}
            />
          </View>

          {/* ─── 7. ACCOUNT ACTIONS ─── */}
          <AppText style={styles.sectionHeader}>ACCOUNT ACTIONS</AppText>
          <View style={styles.groupCard}>
            <SettingRow
              icon="RotateCcw"
              iconColor="#64748B"
              title="Reset Application Settings"
              subtitle="Restore settings to default configuration"
              onPress={handleResetPreferences}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="LogOut"
              title={isGuest ? 'Exit Guest Mode' : 'Sign Out'}
              subtitle={user?.email || 'Log out of current account session'}
              onPress={handleSignOut}
              isDestructive
            />
          </View>

          {/* ─── FOOTER ─── */}
          <View style={styles.footer}>
            <AppText style={styles.footerBrand}>SITEHUBMAN • NFC OS</AppText>
            <AppText style={styles.footerVersion}>Version 2.4.0 (Build 108)</AppText>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 20,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  /* Profile Banner Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(29, 155, 240, 0.15)',
    borderWidth: 1.5,
    borderColor: '#1D9BF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  verifiedDot: {
    justifyContent: 'center',
  },
  handleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  roleText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
  },
  upgradeBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  upgradeBtnText: {
    color: '#000000',
    fontSize: 13,
  },
  editProfileBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },

  /* Group Section Header */
  sectionHeader: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 20,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDestructive: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
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
    color: '#FF3B30',
  },
  rowSubtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValueText: {
    color: 'rgba(255, 255, 255, 0.55)',
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
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footerVersion: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 11,
  },
});
