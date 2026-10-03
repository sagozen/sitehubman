import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#2596BE',
  danger: '#FF453A',
} as const;

interface MenuRow {
  icon: AppIconName;
  label: string;
  route?: string;
  badge?: string;
  danger?: boolean;
  onPress?: () => void;
}

interface MenuSection {
  title: string;
  rows: MenuRow[];
}

export default function MeTabScreen() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Account';
  const email = user?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = useCallback(() => {
    HapticTap.heavy();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          signOutUser().catch(() => null);
        },
      },
    ]);
  }, [signOutUser]);

  const sections: MenuSection[] = [
    {
      title: 'Account',
      rows: [
        { icon: 'User', label: 'Profile', route: '/account/settings' },
        { icon: 'Bell', label: 'Notifications', route: '/account/notifications' },
        { icon: 'ShieldCheck', label: 'Security', route: '/account/security' },
        { icon: 'Trash2', label: 'Delete Account', route: '/account/delete-account', danger: true },
      ],
    },
    {
      title: 'Billing',
      rows: [
        { icon: 'CreditCard', label: 'Subscription', route: '/account/subscription' },
        { icon: 'Package', label: 'Order History', route: '/orders/track' },
      ],
    },
    {
      title: 'Support',
      rows: [
        { icon: 'Info', label: 'Help Center', route: '/help' },
        { icon: 'Sparkles', label: 'About', route: '/account/about' },
      ],
    },
  ];

  const handleRow = useCallback(
    (row: MenuRow) => {
      HapticTap.light();
      if (row.onPress) {
        row.onPress();
      } else if (row.route) {
        router.push(row.route as any);
      }
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarInitial}>{initial}</AppText>
          </View>
          <View style={styles.headerInfo}>
            <AppText variant="title3" style={styles.userName}>{displayName}</AppText>
            <AppText variant="caption" muted style={styles.userEmail}>{email}</AppText>
          </View>
        </View>

        {/* Subscription Badge */}
        <Pressable
          style={styles.planBadge}
          onPress={() => { HapticTap.light(); router.push('/account/subscription' as any); }}
          hitSlop={8}
        >
          <View style={styles.planPill}>
            <AppText style={styles.planPillText}>FREE PLAN</AppText>
          </View>
          <AppText style={styles.upgradeText}>Upgrade →</AppText>
        </Pressable>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText variant="caption" muted style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </AppText>
            <View style={styles.card}>
              {section.rows.map((row, idx) => (
                <React.Fragment key={row.label}>
                  <Pressable
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => handleRow(row)}
                    hitSlop={4}
                  >
                    <View style={styles.rowLeft}>
                      <View style={styles.rowIconWrap}>
                        <AppIcon name={row.icon} size={18} color={C.muted} />
                      </View>
                      <AppText variant="body" style={styles.rowLabel}>{row.label}</AppText>
                    </View>
                    <View style={styles.rowRight}>
                      {row.badge ? (
                        <View style={styles.badge}>
                          <AppText style={styles.badgeText}>{row.badge}</AppText>
                        </View>
                      ) : null}
                      <AppIcon name="ChevronRight" size={16} color={C.muted} />
                    </View>
                  </Pressable>
                  {idx < section.rows.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <Pressable
          style={({ pressed }) => [styles.signOutRow, pressed && styles.rowPressed]}
          onPress={handleSignOut}
          hitSlop={8}
        >
          <AppIcon name="LogOut" size={18} color={C.danger} />
          <AppText style={styles.signOutText}>Sign Out</AppText>
        </Pressable>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: C.text,
    fontWeight: '600',
  },
  userEmail: {
    color: C.muted,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  planPill: {
    backgroundColor: 'rgba(37,150,190,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(37,150,190,0.35)',
  },
  planPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 0.6,
  },
  upgradeText: {
    fontSize: 13,
    color: C.accent,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: C.text,
    fontSize: 15,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: 60,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
  },
  signOutText: {
    fontSize: 15,
    color: C.danger,
    fontWeight: '500',
  },
});
