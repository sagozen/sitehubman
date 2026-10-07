/**
 * MeTabScreen — Screen 6: Settings / More ("Manage your account & card")
 * Luxury Minimalist (Apple Wallet × Stripe × Linear · Black Granite UI)
 */
import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  border: 'transparent',
  borderLight: 'transparent',
  text: '#FFFFFF',
  textSecondary: '#E4E4E7',
  textMuted: '#8E8E93',
  accent: '#799A85',
  danger: '#FF453A',
} as const;

interface MoreItem {
  icon: AppIconName;
  label: string;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
}

export default function MeTabScreen() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');

  const userName = bioPage?.displayName || user?.displayName || 'Thean Coc';
  const userEmail = user?.email || 'thean@company.com';
  const initial = userName.charAt(0).toUpperCase();

  const handleSignOut = useCallback(() => {
    HapticTap.heavy();
    Alert.alert('Log Out', 'Are you sure you want to log out of SiteHub?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          signOutUser().catch(() => null);
        },
      },
    ]);
  }, [signOutUser]);

  const MENU_ITEMS: MoreItem[] = [
    { icon: 'credit-card', label: 'Card Settings', route: '/cards/settings' },
    { icon: 'wifi', label: 'NFC Settings', route: '/nfc/settings' },
    { icon: 'qr-code', label: 'QR Code', route: '/qr-generator' },
    { icon: 'users', label: 'Contacts & CRM', route: '/leads' },
    { icon: 'trending-up', label: 'Analytics', route: '/analytics' },
    {
      icon: 'briefcase',
      label: 'Team',
      onPress: () => {
        Alert.alert('Team Workspace', 'Team collaboration is active on your enterprise profile.');
      },
    },
    { icon: 'shield', label: 'Billing & Subscriptions', route: '/account/subscription' },
    { icon: 'help-circle', label: 'Help & Support', route: '/help' },
    { icon: 'log-out', label: 'Log Out', danger: true, onPress: handleSignOut },
  ];

  const handleRowPress = useCallback((item: MoreItem) => {
    HapticTap.light();
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      router.push(item.route as any);
    }
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.headerTitle} weight="bold">
          More
        </AppText>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {/* User Profile Card */}
          <Pressable
            style={({ pressed }) => [
              styles.profileCard,
              pressed && styles.profileCardPressed,
            ]}
            onPress={() => {
              HapticTap.light();
              router.push('/account/settings' as any);
            }}
          >
            <Image
              source={require('@/assets/images/avatars/avatar_founder_man.jpg')}
              style={styles.avatarImage}
            />
            <View style={styles.profileTextWrap}>
              <AppText style={styles.profileName} weight="bold">
                {userName}
              </AppText>
              <AppText style={styles.profileEmail}>
                {userEmail}
              </AppText>
            </View>
            <AppIcon name="chevron-right" size={16} color={C.textMuted} />
          </Pressable>

          {/* Menu Items List */}
          <View style={styles.menuBox}>
            {MENU_ITEMS.map((item, index) => (
              <React.Fragment key={item.label}>
                <Pressable
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && styles.menuRowPressed,
                  ]}
                  onPress={() => handleRowPress(item)}
                >
                  <View style={styles.menuLeft}>
                    <View style={styles.menuIconWrap}>
                      <AppIcon
                        name={item.icon}
                        size={18}
                        color={item.danger ? C.danger : C.textSecondary}
                        style={item.icon === 'wifi' ? { transform: [{ rotate: '90deg' }] } : undefined}
                      />
                    </View>
                    <AppText
                      style={[
                        styles.menuLabel,
                        item.danger && styles.menuLabelDanger,
                      ]}
                      weight={item.danger ? 'medium' : undefined}
                    >
                      {item.label}
                    </AppText>
                  </View>

                  {!item.danger && (
                    <AppIcon name="chevron-right" size={15} color={C.textMuted} />
                  )}
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          <View style={{ height: 110 }} />
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 26,
    color: C.text,
    letterSpacing: -0.5,
  },
  scroll: {
    flexGrow: 1,
  },
  contentWrap: {
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  profileCardPressed: {
    backgroundColor: C.surfaceRaised,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#000000',
    marginRight: 14,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    color: C.text,
  },
  profileEmail: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  menuBox: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuRowPressed: {
    backgroundColor: C.surfaceRaised,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    color: C.text,
  },
  menuLabelDanger: {
    color: C.danger,
  },
});
