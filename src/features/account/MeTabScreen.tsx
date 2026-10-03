/**
 * MeTabScreen — 09 Account & Settings
 * Luxury Minimalist (Apple Wallet × Stripe × Linear)
 */
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
  surface: '#0E0E11',
  surfaceSoft: '#141418',
  hairline: 'rgba(255, 255, 255, 0.06)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  accent: '#2596BE',
  danger: '#EF4444',
} as const;

interface MenuRow {
  icon: AppIconName;
  label: string;
  route?: string;
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

  const displayName = user?.displayName ?? 'Thean Coc';
  const email = user?.email ?? 'thean@metfone.com.kh';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = useCallback(() => {
    HapticTap.heavy();
    Alert.alert('Sign Out', 'Sign out of your account on this device?', [
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
      title: 'ACCOUNT',
      rows: [
        { icon: 'User', label: 'Profile', route: '/account/settings' },
        { icon: 'Bell', label: 'Notifications', route: '/account/notifications' },
        { icon: 'ShieldCheck', label: 'Security & 2FA', route: '/account/security' },
        { icon: 'Trash2', label: 'Delete Account', route: '/account/delete-account', danger: true },
      ],
    },
    {
      title: 'HARDWARE & BILLING',
      rows: [
        { icon: 'CreditCard', label: 'Subscription Plan', route: '/account/subscription' },
        { icon: 'Package', label: 'Physical Orders', route: '/orders/track' },
      ],
    },
    {
      title: 'SUPPORT',
      rows: [
        { icon: 'Info', label: 'Help Center', route: '/help' },
        { icon: 'Check', label: 'About SiteHub', route: '/account/about' },
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
        {/* Header Profile Identity */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarInitial} weight="bold">{initial}</AppText>
          </View>
          <View style={styles.headerInfo}>
            <AppText style={styles.userName} weight="bold">{displayName}</AppText>
            <AppText style={styles.userEmail}>{email}</AppText>
          </View>
        </View>

        {/* Plan Banner — Clean, Minimal */}
        <Pressable
          style={styles.planCard}
          onPress={() => { HapticTap.light(); router.push('/account/subscription' as any); }}
        >
          <View>
            <AppText style={styles.planTitle} weight="medium">PRO MEMBER</AppText>
            <AppText style={styles.planSub}>Unlimited cards & NFC direct routing</AppText>
          </View>
          <AppIcon name="chevron-right" size={16} color={C.textSecondary} />
        </Pressable>

        {/* Grouped Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText style={styles.sectionTitle}>
              {section.title}
            </AppText>
            <View style={styles.sectionCard}>
              {section.rows.map((row, idx) => (
                <React.Fragment key={row.label}>
                  <Pressable
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => handleRow(row)}
                  >
                    <AppText
                      style={[styles.rowLabel, row.danger && styles.dangerLabel]}
                      weight={row.danger ? 'medium' : 'regular'}
                    >
                      {row.label}
                    </AppText>
                    <AppIcon name="chevron-right" size={16} color={C.textMuted} />
                  </Pressable>
                  {idx < section.rows.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.rowPressed]}
          onPress={handleSignOut}
        >
          <AppText style={styles.signOutText} weight="medium">Sign Out</AppText>
        </Pressable>

        <View style={{ height: 60 }} />
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
    paddingTop: 8,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    color: C.text,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 22,
    letterSpacing: -0.4,
    color: C.text,
  },
  userEmail: {
    fontSize: 13,
    color: C.textSecondary,
  },
  planCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.accent,
  },
  planSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: C.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowPressed: {
    backgroundColor: C.surfaceSoft,
  },
  rowLabel: {
    color: C.text,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  dangerLabel: {
    color: C.danger,
  },
  divider: {
    height: 1,
    backgroundColor: C.hairline,
    marginLeft: 18,
  },
  signOutBtn: {
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  signOutText: {
    fontSize: 15,
    color: C.danger,
  },
});
