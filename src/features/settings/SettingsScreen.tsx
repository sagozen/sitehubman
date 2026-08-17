/**
 * SettingsScreen — Apple Wallet × Nothing × Premium Fintech Edition.
 *
 * Improvements:
 *  1. Stripped out giant boxed card containers around every group.
 *  2. Refined, elegant header title (28px) with proper tracking.
 *  3. Distinct, logically organized categories:
 *     - PREFERENCES (Theme Mode, Notifications, Haptic Feedback)
 *     - SECURITY & PRIVACY (Passcode Lock, Profile Visibility)
 *     - HARDWARE & NFC (Active Smart Card, NFC Burn)
 *     - ACCOUNT (Reset Defaults, Sign Out / Exit Guest)
 *  4. Borderless rows with subtle hairlines and generous bottom clearance.
 */
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Share,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppleToggle } from '@/src/components/AppleToggle';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { HapticTap } from '@/src/utils/haptics';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';

interface SettingRowProps {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  valueText?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
}

function SettingRow({
  icon,
  title,
  subtitle,
  valueText,
  onPress,
  rightElement,
  isDestructive = false,
}: SettingRowProps) {
  const content = (
    <View style={styles.row}>
      <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
        <AppIcon
          name={icon}
          size={18}
          color={isDestructive ? '#FF453A' : '#FFFFFF'}
        />
      </View>

      <View style={styles.rowContent}>
        <AppText
          style={[styles.rowTitle, isDestructive && styles.rowTitleDestructive]}
          weight="bold"
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.rowSubtitle}>{subtitle}</AppText>
        ) : null}
      </View>

      {rightElement ? (
        <View style={styles.rowRight}>{rightElement}</View>
      ) : valueText ? (
        <View style={styles.rowRight}>
          <AppText style={styles.rowValueText}>{valueText}</AppText>
          {onPress ? (
            <AppIcon name="ChevronRight" size={14} color="rgba(255, 255, 255, 0.3)" />
          ) : null}
        </View>
      ) : onPress ? (
        <AppIcon name="ChevronRight" size={14} color="rgba(255, 255, 255, 0.3)" />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          HapticTap.light();
          onPress();
        }}
        style={({ pressed }) => [pressed && styles.rowPressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export function SettingsScreen() {
  const { user, signOutUser } = useAuth();
  const isGuest = useIsGuest();
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const { requireAccount } = useRequireAccount();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [securityPinEnabled, setSecurityPinEnabled] = useState(false);

  const cardProfile = { name: 'AVIO Digital Pass', cardId: 'AVIO-8890-7A3F' };

  const handleColorModeToggle = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextMode = preferences.colorMode === 'dark' ? 'light' : 'dark';
    await updatePreferences({ colorMode: nextMode });
  };

  const handleToggleNotifications = (val: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(val);
  };

  const handleToggleHaptics = (val: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHapticsEnabled(val);
  };

  const handleTogglePin = (val: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecurityPinEnabled(val);
  };

  const handleCopyProfileUrl = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = buildSlugProfileUrl(isGuest ? 'guest-demo' : user?.id || '');
    await Share.share({ message: url, url });
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'Restore default preferences and UI appearance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetPreferences();
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      isGuest ? 'Exit Guest Mode' : 'Sign Out',
      isGuest
        ? 'Are you sure you want to return to the welcome screen?'
        : 'Are you sure you want to sign out of AVIO?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isGuest ? 'Exit' : 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOutUser();
            router.replace('/');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Refined Settings Header (28px) ── */}
        <View style={styles.header}>
          <AppText style={styles.title} weight="extrabold">
            Settings
          </AppText>
          <AppText style={styles.subtitle}>
            AVIO OS · Preferences & Security
          </AppText>
        </View>

        {/* ── User Account Summary Row (Borderless) ── */}
        <View style={styles.profileRow}>
          <View style={styles.avatarSeal}>
            <AppText style={styles.avatarLetter} weight="extrabold">
              {isGuest ? 'G' : (user?.displayName?.[0] || 'U').toUpperCase()}
            </AppText>
          </View>
          <View style={styles.profileInfo}>
            <AppText style={styles.profileName} weight="bold">
              {isGuest ? 'Guest User' : user?.displayName || 'AVIO Member'}
            </AppText>
            <AppText style={styles.profileRole}>
              {isGuest ? 'Guest Access · Demo Pass' : user?.email || 'Active Plan'}
            </AppText>
          </View>
          {isGuest ? (
            <Pressable
              style={styles.upgradeBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                requireAccount(undefined, { message: 'Create an account to activate your pass.' });
              }}
            >
              <AppText style={styles.upgradeBtnText} weight="bold">Upgrade</AppText>
            </Pressable>
          ) : (
            <Pressable style={styles.shareIconBtn} onPress={handleCopyProfileUrl}>
              <AppIcon name="Share" size={16} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {/* ── 1. PREFERENCES ── */}
        <AppText style={styles.sectionHeader}>PREFERENCES</AppText>
        <View style={styles.sectionGroup}>
          <SettingRow
            icon="Sun"
            title="Appearance"
            subtitle="Dark, Light, or System"
            valueText={preferences.colorMode === 'dark' ? 'Dark' : 'Light'}
            onPress={handleColorModeToggle}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Bell"
            title="Push Notifications"
            subtitle="NFC tap alerts and order status"
            rightElement={
              <AppleToggle
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                accessibilityLabel="Push notifications toggle"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Smartphone"
            title="Haptic Feedback"
            subtitle="Tactile vibrations on tap"
            rightElement={
              <AppleToggle
                value={hapticsEnabled}
                onValueChange={handleToggleHaptics}
                accessibilityLabel="Haptic feedback toggle"
              />
            }
          />
        </View>

        {/* ── 2. SECURITY & PRIVACY ── */}
        <AppText style={styles.sectionHeader}>SECURITY & PRIVACY</AppText>
        <View style={styles.sectionGroup}>
          <SettingRow
            icon="LockKeyhole"
            title="Passcode Lock"
            subtitle="Require PIN on app launch"
            rightElement={
              <AppleToggle
                value={securityPinEnabled}
                onValueChange={handleTogglePin}
                accessibilityLabel="Passcode lock toggle"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Globe"
            title="Public Profile Visibility"
            subtitle="sitehubman.app link status"
            valueText="Public"
            onPress={handleCopyProfileUrl}
          />
        </View>

        {/* ── 3. HARDWARE & NFC ── */}
        <AppText style={styles.sectionHeader}>HARDWARE & NFC</AppText>
        <View style={styles.sectionGroup}>
          <SettingRow
            icon="CreditCard"
            title="Active Smart Card"
            subtitle={cardProfile ? cardProfile.name : 'AVIO Digital Pass'}
            valueText={cardProfile ? cardProfile.cardId : 'Active'}
            onPress={() => router.push('/(tabs)/share')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="Nfc"
            title="Burn NFC Chip"
            subtitle="Write profile data to physical card"
            onPress={() => router.push('/(tabs)/share')}
          />
        </View>

        {/* ── 4. ACCOUNT ── */}
        <AppText style={styles.sectionHeader}>ACCOUNT</AppText>
        <View style={styles.sectionGroup}>
          <SettingRow
            icon="Refresh"
            title="Reset App Settings"
            subtitle="Restore default preferences"
            onPress={handleResetPreferences}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="LogOut"
            title={isGuest ? 'Exit Guest Mode' : 'Sign Out'}
            subtitle={user?.email || 'Sign out of current session'}
            onPress={handleSignOut}
            isDestructive
          />
        </View>

        {/* ── Footer Info ── */}
        <View style={styles.footer}>
          <AppText style={styles.footerBrand}>AVIO Technologies • CONNECT · IDENTIFY · EMPOWER</AppText>
          <AppText style={styles.footerVersion}>Version 1.0.0 (Build 32)</AppText>
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
    paddingTop: 10,
    paddingBottom: 130, // Clearance for floating dock
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Header (28px Refined) ──
  header: {
    paddingVertical: 12,
    gap: 4,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
  },

  // ── User Account Summary Row ──
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
    gap: 14,
  },
  avatarSeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#000000',
    fontSize: 18,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  profileRole: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  upgradeBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    backgroundColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Section Group (Borderless with Dividers) ──
  sectionHeader: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 22,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionGroup: {
    paddingVertical: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 48,
  },

  // ── Row Item ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    gap: 14,
  },
  rowPressed: {
    opacity: 0.65,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDestructive: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
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
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
    gap: 4,
  },
  footerBrand: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  footerVersion: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 11,
  },
});
