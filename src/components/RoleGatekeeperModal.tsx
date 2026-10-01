import React from 'react';
import { Modal, StyleSheet, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { getRoleLabel } from '@/src/utils/roleCapabilities';
import { UserRole } from '@/src/types/models';
import { theme } from '@/src/constants/theme';

interface RoleGatekeeperModalProps {
  visible: boolean;
  oldRole: UserRole | string;
  newRole: UserRole | string;
  isDeactivated?: boolean;
  onAcknowledge: () => void;
}

export function RoleGatekeeperModal({
  visible,
  oldRole,
  newRole,
  isDeactivated = false,
  onAcknowledge,
}: RoleGatekeeperModalProps) {
  if (!visible) return null;

  const handlePressReload = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAcknowledge();
    // Route to appropriate workspace based on new role
    if (newRole === 'sales') {
      router.replace('/sales/dashboard');
    } else if (newRole === 'admin' || newRole === 'super_admin') {
      router.replace('/admin/dashboard');
    } else if (newRole === 'printer') {
      router.replace('/production/queue');
    } else {
      router.replace('/');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconCircle,
              isDeactivated ? styles.iconCircleDanger : styles.iconCircleWarning,
            ]}
          >
            <AppIcon
              name={isDeactivated ? 'ShieldAlert' : 'ShieldCheck'}
              size={36}
              color={isDeactivated ? '#EF4444' : '#F59E0B'}
            />
          </View>

          <AppText style={styles.title}>
            {isDeactivated ? 'Account Access Suspended' : 'Workspace Permissions Updated'}
          </AppText>

          <AppText style={styles.description}>
            {isDeactivated
              ? 'Your account has been deactivated by an organization administrator. Active session tokens have been invalidated.'
              : 'An organization administrator has updated your staff permissions. Your active access credentials have been refreshed to match your new privileges.'}
          </AppText>

          {!isDeactivated ? (
            <View style={styles.roleComparisonBox}>
              <View style={styles.roleCol}>
                <AppText style={styles.roleLabel}>PREVIOUS ROLE</AppText>
                <AppText style={styles.rolePrev}>{getRoleLabel(oldRole as any)}</AppText>
              </View>
              <AppIcon name="ArrowRight" size={18} color="rgba(255,255,255,0.4)" />
              <View style={styles.roleCol}>
                <AppText style={styles.roleLabel}>ASSIGNED ROLE</AppText>
                <AppText style={styles.roleNext}>{getRoleLabel(newRole as any)}</AppText>
              </View>
            </View>
          ) : null}

          <View style={styles.footer}>
            <AppButton
              label={isDeactivated ? 'Sign Out to Login' : 'Enter Authorized Workspace ➔'}
              variant={isDeactivated ? 'destructive' : 'primary'}
              size="lg"
              fullWidth
              onPress={handlePressReload}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121217',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 26,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  iconCircleDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  roleComparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 22,
  },
  roleCol: {
    alignItems: 'center',
    gap: 2,
  },
  roleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.8,
  },
  rolePrev: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
  },
  roleNext: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  footer: {
    width: '100%',
  },
});
