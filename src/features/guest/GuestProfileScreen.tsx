import { IosScrollView } from '@/src/components/IosScrollView';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { PageHeader } from '@/src/components/PageHeader';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { LinearGradient } from 'expo-linear-gradient';
import { pageThemes } from '@/src/constants/pageThemes';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { HapticTap } from '@/src/utils/haptics';

const THEME = pageThemes.profile;

const LOCKED: { icon: AppIconName; label: string; sub: string }[] = [
  { icon: 'QrCode', label: 'Generate QR code', sub: 'Personal share link' },
  { icon: 'Nfc', label: 'Write NFC chip', sub: 'Lock chip to your profile' },
  {
    icon: 'Wallet',
    label: 'Apple / Google Wallet',
    sub: 'Add card to mobile wallet',
  },
  {
    icon: 'Image',
    label: 'Upload profile photo',
    sub: 'Personalise your card',
  },
];

export function GuestProfileScreen() {
  const { user, signOutUser } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();

  const initial = (user?.displayName?.trim() || 'G')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          theme={THEME}
          eyebrow="Personal identity"
          title="Profile"
          subtitle="Your card, account, and publishing access."
          icon="UserRound"
          compact
        />

        {/* Minimalist Telegram-style Avatar Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#4776E6', '#8E54E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarWrap}
          >
            <AppText style={styles.avatarText} weight="extrabold">
              {initial}
            </AppText>
          </LinearGradient>
          <View style={styles.headerCopy}>
            <View style={styles.nameRow}>
              <AppText style={styles.name} weight="extrabold">
                {user?.displayName ?? 'Guest User'}
              </AppText>
              {!isGuest ? (
                <AppIcon name="BadgeCheck" size={18} color={THEME.accent} />
              ) : null}
            </View>
            <View style={styles.rolePill}>
              <AppText style={styles.roleText} weight="bold">
                {isGuest ? 'Guest account' : 'Verified account'}
              </AppText>
            </View>
          </View>
        </View>

        {/* Card Face Preview */}
        <View style={styles.cardWrap}>
          <NfcGlobalCardFace fullName={user?.displayName || undefined} />
        </View>

        {/* Upgrade Banner callout */}
        {isGuest ? (
          <View style={styles.guestCard}>
            <View style={styles.guestIconWrap}>
              <AppIcon name="ShieldCheck" size={26} color={THEME.accent} />
            </View>
            <AppText style={styles.guestTitle} weight="extrabold">
              Your card is ready. Claim it.
            </AppText>
            <AppText style={styles.guestSub} weight="medium">
              Sign up free to unlock your QR code, NFC chip, and Wallet pass.
            </AppText>

            <View style={styles.bannerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.pillBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  HapticTap.light();
                  router.push('/(auth)/register');
                }}
              >
                <AppText style={styles.pillBtnText} weight="bold">
                  Create your free account →
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Locked list options */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel} weight="bold">
            What you unlock
          </AppText>
          <View style={styles.lockedList}>
            {LOCKED.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  HapticTap.light();
                  requireAccount(undefined, {
                    message: `Create an account to unlock: ${item.label.toLowerCase()}.`,
                  });
                }}
                style={({ pressed }) => [
                  styles.lockedRow,
                  index === LOCKED.length - 1 && styles.lockedRowLast,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.lockedIconWrap}>
                  <AppIcon name={item.icon} size={20} color={THEME.accent} />
                </View>
                <View style={styles.lockedCopy}>
                  <AppText style={styles.lockedLabel} weight="bold">
                    {item.label}
                  </AppText>
                  <AppText style={styles.lockedSub}>{item.sub}</AppText>
                </View>
                <AppIcon
                  name="Lock"
                  size={16}
                  color="rgba(255, 255, 255, 0.25)"
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sign out Option */}
        <Pressable
          onPress={() => {
            HapticTap.medium();
            void signOutUser();
          }}
          style={({ pressed }) => [
            styles.signOutCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.oceanIconWrap}>
            <AppIcon
              name="LogOut"
              size={20}
              color="#FF453A"
              variant="solar-bold"
            />
          </View>
          <View style={styles.oceanTextWrap}>
            <AppText style={styles.oceanSubtitle} weight="extrabold">
              Session
            </AppText>
            <AppText style={styles.oceanTitle} weight="bold">
              Sign out
            </AppText>
          </View>
        </Pressable>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: THEME.accentSoft,
    borderWidth: 1.5,
    borderColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: THEME.accent,
  },
  headerCopy: {
    alignItems: 'center',
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  name: {
    fontSize: 22,
    color: THEME.text,
    letterSpacing: 0,
    textAlign: 'center',
  },
  rolePill: {
    alignSelf: 'center',
    backgroundColor: THEME.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 10,
    color: THEME.accent,
    letterSpacing: 0,
  },
  cardWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guestCard: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  guestIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: THEME.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 18,
    color: THEME.text,
    letterSpacing: 0,
  },
  guestSub: {
    fontSize: 13,
    color: THEME.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  bannerActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  pillBtn: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillBtnText: {
    color: THEME.onAccent,
    fontSize: 15,
  },
  outlineBtn: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: {
    color: THEME.text,
    fontSize: 15,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    color: THEME.muted,
    letterSpacing: 0,
  },
  lockedList: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.border,
  },
  lockedRowLast: {
    borderBottomWidth: 0,
  },
  lockedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCopy: {
    flex: 1,
    gap: 2,
  },
  lockedLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  lockedSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.25)',
  },
  signOutCard: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    marginBottom: 40,
  },
  oceanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oceanTextWrap: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  oceanSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 69, 58, 0.7)',
    letterSpacing: 0.5,
  },
  oceanTitle: {
    fontSize: 15,
    color: '#FF453A',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
