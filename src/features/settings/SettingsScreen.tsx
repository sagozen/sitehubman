import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Share,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const SPRING_SNAPPY = { damping: 16, stiffness: 340, mass: 0.7 };

interface SettingRowProps {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  valueText?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
  delay?: number;
}

function SettingRow({
  icon,
  title,
  subtitle,
  valueText,
  onPress,
  rightElement,
  isDestructive = false,
  delay = 0,
}: SettingRowProps) {
  const { preferences } = usePreferences();
  const isDark = preferences.colorMode === 'dark';

  const scale = useSharedValue(1);
  const chevronX = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isDestructive) {
      glowOpacity.value = withRepeat(withTiming(0.4, { duration: 1500 }), -1, true);
    }
  }, [isDestructive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chevronX.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, SPRING_SNAPPY);
    }
  };
  
  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, SPRING_SNAPPY);
    }
  };

  const handlePress = () => {
    if (onPress) {
      HapticTap.selection();
      if (!isDestructive && !rightElement && !valueText) {
        chevronX.value = withSequence(
          withTiming(4, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
      }
      onPress();
    }
  };

  const content = (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.row, animatedStyle]}>
      <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive, !isDark && styles.iconBoxLight]}>
        {isDestructive && (
          <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FF453A', borderRadius: 10 }, glowStyle]} />
        )}
        <AppIcon
          name={icon}
          size={18}
          color={isDestructive ? '#FF453A' : isDark ? '#FFFFFF' : '#000000'}
        />
      </View>

      <View style={styles.rowContent}>
        <AppText
          style={[styles.rowTitle, isDestructive && styles.rowTitleDestructive, !isDark && !isDestructive && { color: '#000000' }]}
          weight="bold"
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={[styles.rowSubtitle, !isDark && { color: 'rgba(0, 0, 0, 0.45)' }]}>{subtitle}</AppText>
        ) : null}
      </View>

      {rightElement ? (
        <View style={styles.rowRight}>{rightElement}</View>
      ) : valueText ? (
        <View style={styles.rowRight}>
          <AppText style={[styles.rowValueText, !isDark && { color: 'rgba(0, 0, 0, 0.55)' }]}>{valueText}</AppText>
          {onPress ? (
            <Animated.View style={chevronStyle}>
              <AppIcon name="ChevronRight" size={14} color={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"} />
            </Animated.View>
          ) : null}
        </View>
      ) : onPress ? (
        <Animated.View style={chevronStyle}>
          <AppIcon name="ChevronRight" size={14} color={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const SectionLabel = ({ title, delay }: { title: string, delay: number }) => {
  const { preferences } = usePreferences();
  const isDark = preferences.colorMode === 'dark';
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.sectionLabelWrapper, !isDark && styles.sectionLabelWrapperLight]}>
      <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.sectionLabelBlur}>
        <AppText style={[styles.sectionLabelText, !isDark && { color: 'rgba(0,0,0,0.6)' }]} weight="bold">{title}</AppText>
      </BlurView>
    </Animated.View>
  );
};

export function SettingsScreen() {
  const { user, signOutUser } = useAuth();
  const isGuest = useIsGuest();
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const { requireAccount } = useRequireAccount();
  
  const isDark = preferences.colorMode === 'dark';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [securityPinEnabled, setSecurityPinEnabled] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showResetSheet, setShowResetSheet] = useState(false);

  const cardProfile = { name: 'AVIO Digital Pass', cardId: 'AVIO-8890-7A3F' };

  const handleColorModeToggle = async () => {
    HapticTap.selection();
    const nextMode = preferences.colorMode === 'dark' ? 'light' : 'dark';
    await updatePreferences({ colorMode: nextMode });
  };

  const handleToggleNotifications = (val: boolean) => {
    HapticTap.selection();
    setNotificationsEnabled(val);
  };

  const handleToggleHaptics = (val: boolean) => {
    HapticTap.selection();
    setHapticsEnabled(val);
  };

  const handleTogglePin = (val: boolean) => {
    HapticTap.selection();
    setSecurityPinEnabled(val);
  };

  const handleCopyProfileUrl = async () => {
    HapticTap.success();
    const url = buildSlugProfileUrl(isGuest ? 'guest-demo' : user?.id || '');
    await Share.share({ message: url, url });
  };

  const handleResetPreferencesPress = () => {
    setShowResetSheet(true);
  };

  const handleConfirmReset = async () => {
    setShowResetSheet(false);
    await resetPreferences();
    HapticTap.success();
  };

  const handleSignOutPress = () => {
    setShowSignOutSheet(true);
  };

  const handleConfirmSignOut = async () => {
    setShowSignOutSheet(false);
    HapticTap.success();
    await signOutUser();
    router.replace('/');
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={isDark ? ['#000000', '#07090E', '#0D1017'] : ['#F4F7FB', '#FAFCFF', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Refined Settings Header ── */}
          <Animated.View entering={FadeInDown.springify()} style={styles.header}>
            <AppText style={[styles.title, !isDark && { color: '#000000' }]} weight="extrabold">
              Settings
            </AppText>
            <AppText style={[styles.subtitle, !isDark && { color: 'rgba(0, 0, 0, 0.45)' }]}>
              AVIO OS · Preferences & Security
            </AppText>
          </Animated.View>

          {/* ── User Account Summary Card (Glass) ── */}
          <Animated.View entering={FadeInDown.delay(30).springify()} style={styles.profileCardWrapper}>
            <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.profileCard, !isDark && styles.profileCardLight]}>
              <View style={styles.profileRow}>
                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.avatarSeal}>
                  <AppText style={styles.avatarLetter} weight="extrabold">
                    {isGuest ? 'G' : (user?.displayName?.[0] || 'U').toUpperCase()}
                  </AppText>
                </LinearGradient>
                <View style={styles.profileInfo}>
                  <AppText style={[styles.profileName, !isDark && { color: '#000000' }]} weight="bold">
                    {isGuest ? 'Guest User' : user?.displayName || 'AVIO Member'}
                  </AppText>
                  <AppText style={[styles.profileRole, !isDark && { color: 'rgba(0, 0, 0, 0.5)' }]}>
                    {isGuest ? 'Guest Access · Demo Pass' : user?.email || 'Active Plan'}
                  </AppText>
                </View>
                {isGuest ? (
                  <Pressable
                    style={[styles.upgradeBtn, !isDark && styles.upgradeBtnLight]}
                    onPress={() => {
                      HapticTap.selection();
                      requireAccount(undefined, { message: 'Create an account to activate your pass.' });
                    }}
                  >
                    <AppText style={[styles.upgradeBtnText, !isDark && { color: '#FFFFFF' }]} weight="bold">Upgrade</AppText>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.shareIconBtn, !isDark && styles.shareIconBtnLight]} onPress={handleCopyProfileUrl}>
                    <AppIcon name="Share" size={16} color={isDark ? "#FFFFFF" : "#000000"} />
                  </Pressable>
                )}
              </View>
            </BlurView>
          </Animated.View>

          {/* ── 1. PREFERENCES ── */}
          <SectionLabel title="PREFERENCES" delay={60} />
          <View style={styles.sectionGroup}>
            <SettingRow
              delay={90}
              icon="Sun"
              title="Appearance"
              subtitle="Dark, Light, or System"
              valueText={preferences.colorMode === 'dark' ? 'Dark' : 'Light'}
              onPress={handleColorModeToggle}
            />
            <SettingRow
              delay={120}
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
            <SettingRow
              delay={150}
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
          <SectionLabel title="SECURITY & PRIVACY" delay={180} />
          <View style={styles.sectionGroup}>
            <SettingRow
              delay={210}
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
            <SettingRow
              delay={240}
              icon="Globe"
              title="Public Profile Visibility"
              subtitle="sitehubman.app link status"
              valueText="Public"
              onPress={handleCopyProfileUrl}
            />
          </View>

          {/* ── 3. HARDWARE & NFC ── */}
          <SectionLabel title="HARDWARE & NFC" delay={270} />
          <View style={styles.sectionGroup}>
            <SettingRow
              delay={300}
              icon="CreditCard"
              title="Active Smart Card"
              subtitle={cardProfile ? cardProfile.name : 'AVIO Digital Pass'}
              valueText={cardProfile ? cardProfile.cardId : 'Active'}
              onPress={() => router.push('/(tabs)/share')}
            />
            <SettingRow
              delay={330}
              icon="Nfc"
              title="Burn NFC Chip"
              subtitle="Write profile data to physical card"
              onPress={() => router.push('/(tabs)/share')}
            />
          </View>

          {/* ── 4. ACCOUNT ── */}
          <SectionLabel title="ACCOUNT" delay={360} />
          <View style={styles.sectionGroup}>
            <SettingRow
              delay={390}
              icon="Refresh"
              title="Reset App Settings"
              subtitle="Restore default preferences"
              onPress={handleResetPreferencesPress}
            />
            <SettingRow
              delay={420}
              icon="LogOut"
              title={isGuest ? 'Exit Guest Mode' : 'Sign Out'}
              subtitle={user?.email || 'Sign out of current session'}
              onPress={handleSignOutPress}
              isDestructive
            />
          </View>

          {/* ── Footer Info ── */}
          <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.footer}>
            <AppText style={[styles.footerBrand, !isDark && { color: 'rgba(0,0,0,0.3)' }]}>AVIO Technologies • CONNECT · IDENTIFY · EMPOWER</AppText>
            <AppText style={[styles.footerVersion, !isDark && { color: 'rgba(0,0,0,0.2)' }]}>Version 1.0.0 (Build 32)</AppText>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>

      {/* ── Sign Out Sheet ── */}
      <Modal visible={showSignOutSheet} transparent animationType="fade">
        <View style={StyleSheet.absoluteFillObject}>
          <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowSignOutSheet(false)} />
          <View style={styles.sheetWrapper}>
            <View style={[styles.sheetContainer, !isDark && styles.sheetContainerLight]}>
              <AppText style={[styles.sheetTitle, !isDark && { color: '#000000' }]} weight="bold">
                {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
              </AppText>
              <AppText style={[styles.sheetSubtitle, !isDark && { color: 'rgba(0,0,0,0.5)' }]}>
                {isGuest
                  ? 'Are you sure you want to return to the welcome screen?'
                  : 'Are you sure you want to sign out of AVIO?'}
              </AppText>
              
              <Pressable
                style={({ pressed }) => [styles.sheetDestructiveBtn, pressed && { opacity: 0.8 }]}
                onPress={handleConfirmSignOut}
              >
                <AppText style={styles.sheetDestructiveBtnText} weight="bold">{isGuest ? 'Exit' : 'Sign Out'}</AppText>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [styles.sheetCancelBtn, !isDark && styles.sheetCancelBtnLight, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  HapticTap.selection();
                  setShowSignOutSheet(false);
                }}
              >
                <AppText style={[styles.sheetCancelBtnText, !isDark && { color: '#000000' }]} weight="bold">Cancel</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Reset Preferences Sheet ── */}
      <Modal visible={showResetSheet} transparent animationType="fade">
        <View style={StyleSheet.absoluteFillObject}>
          <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowResetSheet(false)} />
          <View style={styles.sheetWrapper}>
            <View style={[styles.sheetContainer, !isDark && styles.sheetContainerLight]}>
              <AppText style={[styles.sheetTitle, !isDark && { color: '#000000' }]} weight="bold">
                Reset Preferences
              </AppText>
              <AppText style={[styles.sheetSubtitle, !isDark && { color: 'rgba(0,0,0,0.5)' }]}>
                Restore default preferences and UI appearance?
              </AppText>
              
              <Pressable
                style={({ pressed }) => [styles.sheetDestructiveBtn, pressed && { opacity: 0.8 }]}
                onPress={handleConfirmReset}
              >
                <AppText style={styles.sheetDestructiveBtnText} weight="bold">Reset</AppText>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [styles.sheetCancelBtn, !isDark && styles.sheetCancelBtnLight, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  HapticTap.selection();
                  setShowResetSheet(false);
                }}
              >
                <AppText style={[styles.sheetCancelBtnText, !isDark && { color: '#000000' }]} weight="bold">Cancel</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    marginBottom: 16,
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

  // ── Profile Card ──
  profileCardWrapper: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileCardLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarSeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
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
  upgradeBtnLight: {
    backgroundColor: '#000000',
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
  shareIconBtnLight: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  // ── Section Group ──
  sectionLabelWrapper: {
    marginTop: 22,
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionLabelWrapperLight: {
    backgroundColor: 'transparent',
  },
  sectionLabelBlur: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabelText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  sectionGroup: {
    paddingVertical: 2,
    gap: 8,
  },

  // ── Row Item ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 14,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxLight: {
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    fontSize: 15,
  },
  rowTitleDestructive: {
    color: '#FF453A',
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

  // ── Footer ──
  footer: {
    alignItems: 'center',
    marginTop: 40,
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

  // ── Bottom Sheets ──
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  sheetContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  sheetContainerLight: {
    backgroundColor: '#FFFFFF',
  },
  sheetTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  sheetDestructiveBtn: {
    backgroundColor: '#FF453A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetDestructiveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  sheetCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  sheetCancelBtnLight: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sheetCancelBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
