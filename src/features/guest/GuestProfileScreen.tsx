import { IosScrollView } from '@/src/components/IosScrollView';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { useAppTheme } from '@/src/hooks/useAppTheme';

const LOCKED: { icon: AppIconName; label: string; sub: string }[] = [
  { icon: 'QrCode', label: 'Generate QR code', sub: 'Personal share link' },
  { icon: 'Nfc', label: 'Write NFC chip', sub: 'Lock chip to your profile' },
  { icon: 'Wallet', label: 'Apple / Google Wallet', sub: 'Add card to mobile wallet' },
  { icon: 'Image', label: 'Upload profile photo', sub: 'Personalise your card' },
];

export function GuestProfileScreen() {
  const { user, signOutUser } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { colors } = useAppTheme();

  const initial = (user?.displayName?.trim() || 'G')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <AppText style={styles.avatarText}>{initial}</AppText>
          </View>
          <View style={styles.headerCopy}>
            <AppText style={styles.name}>{user?.displayName ?? 'Guest User'}</AppText>
            <View style={styles.rolePill}>
              <AppText style={styles.roleText}>{isGuest ? 'GUEST' : 'ACCOUNT'}</AppText>
            </View>
          </View>
          {!isGuest ? <AppIcon name="BadgeCheck" size={24} color="#34C759" /> : null}
        </View>

        {/* NFC card preview */}
        <View style={styles.cardWrap}>
          <NfcGlobalCardFace fullName={user?.displayName || undefined} />
        </View>

        {/* Guest wall */}
        {isGuest ? (
          <View style={styles.guestCard}>
            <AppIcon name="ShieldCheck" size={32} color={colors.accent} />
            <AppText style={styles.guestTitle}>Upgrade your identity</AppText>
            <AppText style={styles.guestSub}>
              Create an account to sync cards, get a real NFC chip, and build your permanent digital
              identity.
            </AppText>
            <AppButton label="Sign In" onPress={() => router.push('/(auth)/login')} />
            <AppButton
              label="Create account"
              variant="outline"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        ) : null}

        {/* Locked actions */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel}>Locked until you sign up</AppText>
          <View style={styles.lockedList}>
            {LOCKED.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() =>
                  requireAccount(undefined, {
                    message: `Create an account to unlock: ${item.label.toLowerCase()}.`,
                  })
                }
                style={({ pressed }) => [
                  styles.lockedRow,
                  pressed && styles.pressed,
                  index === LOCKED.length - 1 && styles.lockedRowLast,
                ]}
                accessibilityRole="button"
              >
                <AppIcon name={item.icon} size={28} color="#D1D5DB" />
                <View style={styles.lockedCopy}>
                  <AppText style={styles.lockedLabel}>{item.label}</AppText>
                  <AppText style={styles.lockedSub}>{item.sub}</AppText>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <AppButton
          label="Sign out of guest"
          variant="ghost"
          iconName="LogOut"
          onPress={() => void signOutUser()}
        />
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, gap: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2596BE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  headerCopy: { flex: 1, gap: 5 },
  name: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F5FB',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleText: { fontSize: 10, fontWeight: '800', color: '#2596BE', letterSpacing: 0.5 },
  cardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 6,
  },
  guestTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  guestSub: { fontSize: 13, fontWeight: '500', color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockedList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  lockedRowLast: { borderBottomWidth: 0 },
  pressed: { opacity: 0.72 },
  lockedCopy: { flex: 1, gap: 2 },
  lockedLabel: { fontSize: 15, fontWeight: '700', color: '#C7C7CC' },
  lockedSub: { fontSize: 12, fontWeight: '500', color: '#D1D5DB' },
});
