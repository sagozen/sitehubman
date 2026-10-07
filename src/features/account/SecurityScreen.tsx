import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  muted: '#A1A1AA',
  textDim: '#52525B',
  accent: '#799A85',
  danger: '#FF453A',
};

type RowProps = {
  icon: AppIconName;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
  danger?: boolean;
  hideDivider?: boolean;
};

const SettingsRow: React.FC<RowProps> = ({
  icon,
  label,
  sublabel,
  onPress,
  rightSlot,
  danger,
  hideDivider,
}) => (
  <Pressable
    onPress={() => {
      HapticTap.light();
      onPress?.();
    }}
    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    hitSlop={4}
  >
    <View style={styles.rowLeft}>
      {/* Plain icon — no colored bubble */}
      <AppIcon name={icon} size={17} color={danger ? C.danger : C.muted} />
      <View style={styles.rowText}>
        <AppText style={[styles.rowLabel, danger && { color: C.danger }]}>
          {label}
        </AppText>
        {sublabel ? (
          <AppText style={styles.rowSub}>{sublabel}</AppText>
        ) : null}
      </View>
    </View>
    {rightSlot ?? (
      onPress ? <AppIcon name="chevron-right" size={16} color={C.textDim} /> : null
    )}
    {!hideDivider && <View style={styles.divider} />}
  </Pressable>
);

export default function SecurityScreen() {
  const [biometric, setBiometric] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const handleChangePassword = useCallback(() => {
    Alert.alert('Change Password', 'A password reset link will be sent to your registered email.');
  }, []);

  const handleSetupTwoFactor = useCallback(() => {
    Alert.alert('Two-Factor Authentication', 'Setup authenticator app or SMS verification.');
  }, []);

  const handleRevokeSessions = useCallback(() => {
    HapticTap.heavy();
    Alert.alert(
      'Revoke All Sessions',
      'This will sign you out of all devices except this one.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke All', style: 'destructive', onPress: () => HapticTap.error() },
      ],
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    HapticTap.heavy();
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: () => HapticTap.error() },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => { HapticTap.light(); router.back(); }}
          style={styles.backBtn}
          hitSlop={8}
        >
          <AppIcon name="chevron-left" size={22} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle}>Security</AppText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Auth */}
        <AppText style={styles.sectionLabel}>AUTHENTICATION</AppText>
        <View style={styles.group}>
          <SettingsRow
            icon="lock"
            label="Change Password"
            sublabel="Last changed 30 days ago"
            onPress={handleChangePassword}
          />
          <SettingsRow
            icon="shield"
            label="Two-Factor Authentication"
            sublabel={twoFactor ? 'Enabled via Authenticator' : 'Not enabled'}
            onPress={handleSetupTwoFactor}
            rightSlot={
              <Switch
                value={twoFactor}
                onValueChange={(v) => {
                  HapticTap.softConfirmation();
                  setTwoFactor(v);
                  if (v) handleSetupTwoFactor();
                }}
                trackColor={{ false: C.surfaceRaised, true: C.accent }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow
            icon="smartphone"
            label="Biometric Login"
            sublabel="Use Face ID or fingerprint to sign in"
            onPress={() => {}}
            rightSlot={
              <Switch
                value={biometric}
                onValueChange={(v) => {
                  HapticTap.softConfirmation();
                  setBiometric(v);
                }}
                trackColor={{ false: C.surfaceRaised, true: C.accent }}
                thumbColor="#fff"
              />
            }
            hideDivider
          />
        </View>

        {/* Activity */}
        <AppText style={styles.sectionLabel}>ACTIVITY</AppText>
        <View style={styles.group}>
          <SettingsRow
            icon="bell"
            label="Login Alerts"
            sublabel="Get notified of new sign-ins"
            onPress={() => {}}
            rightSlot={
              <Switch
                value={loginAlerts}
                onValueChange={(v) => {
                  HapticTap.softConfirmation();
                  setLoginAlerts(v);
                }}
                trackColor={{ false: C.surfaceRaised, true: C.accent }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow
            icon="monitor"
            label="Active Sessions"
            sublabel="2 devices logged in"
            onPress={() => {}}
            hideDivider
          />
        </View>

        {/* Devices */}
        <AppText style={styles.sectionLabel}>DEVICES</AppText>
        <View style={styles.group}>
          <View style={styles.deviceRow}>
            {/* Plain icon, no colored bubble */}
            <AppIcon name="smartphone" size={17} color={C.muted} />
            <View style={styles.deviceText}>
              <AppText style={styles.rowLabel}>iPhone 15 Pro</AppText>
              {/* Muted text replaces green status dot */}
              <AppText style={styles.rowSub}>This device · Active now</AppText>
            </View>
            <View style={styles.divider} />
          </View>
          <View style={styles.deviceRow}>
            <AppIcon name="monitor" size={17} color={C.muted} />
            <View style={styles.deviceText}>
              <AppText style={styles.rowLabel}>MacBook Pro</AppText>
              <AppText style={styles.rowSub}>Safari · 2 hours ago</AppText>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <AppText style={styles.sectionLabel}>DANGER ZONE</AppText>
        <View style={styles.group}>
          <SettingsRow
            icon="log-out"
            label="Revoke All Sessions"
            sublabel="Sign out of all other devices"
            onPress={handleRevokeSessions}
            danger
          />
          <SettingsRow
            icon="trash-2"
            label="Delete Account"
            sublabel="Permanently remove your account"
            onPress={handleDeleteAccount}
            danger
            hideDivider
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { width: 36, alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  sectionLabel: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: C.surface,
    borderRadius: 16,
    // No borderWidth — removed heavy border clutter
    paddingHorizontal: 16,
    marginBottom: 28,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowPressed: { opacity: 0.6 },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 15,
    color: C.text,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 1,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 44,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  deviceText: { flex: 1 },
});
