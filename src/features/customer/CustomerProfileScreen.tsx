/**
 * Customer Profile tab — shows real NFC card (bio data), quick actions,
 * account info, and sign-out. Same visual style as GuestProfileScreen
 * but with real data and no "locked" wall.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';

const BRAND = '#2596BE';
const INK = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F2F2F7';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.05)';

const ACTIONS: { icon: AppIconName; label: string; sub: string; route: string }[] = [
  { icon: 'PenLine',   label: 'Edit Bio',     sub: 'Update public profile',   route: '/edit-bio' },
  { icon: 'CreditCard',label: 'Design Card',  sub: 'Edit your NFC card',      route: appRoutes.guestDesign },
  { icon: 'Users',     label: 'Connections',  sub: 'Leads, taps & card views', route: appRoutes.customerConnections },
  { icon: 'Package',   label: 'Track Order',  sub: 'Production & delivery',   route: appRoutes.guestTrackOrder },
  { icon: 'QrCode',    label: 'Share QR',     sub: 'Bio profile QR code',     route: appRoutes.qrGenerator },
  { icon: 'ScanLine',  label: 'Scan NFC',     sub: 'Read any card',           route: appRoutes.scan },
];

export function CustomerProfileScreen() {
  const { user, signOutUser } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');

  const initial = (user?.displayName?.trim() || 'U')[0].toUpperCase();
  const cardName  = bioPage?.displayName?.trim() || user?.displayName?.trim() || '';
  const cardTitle = bioPage?.tagline?.trim() || '';
  const cardPhone = bioPage?.whatsapp?.trim() || user?.phone?.trim() || '';
  const cardEmail = bioPage?.email?.trim() || user?.email?.trim() || '';

  function handleSignOut() {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOutUser() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <AppText style={styles.avatarText}>{initial}</AppText>
          </View>
          <View style={styles.headerCopy}>
            <AppText style={styles.name}>{user?.displayName ?? 'My Account'}</AppText>
            <View style={styles.rolePill}>
              <AppText style={styles.roleText}>CUSTOMER</AppText>
            </View>
          </View>
          <AppIcon name="BadgeCheck" size={24} color="#34C759" />
        </View>

        {/* ── NFC card — real bio data ── */}
        <View style={styles.cardWrap}>
          <NfcGlobalCardFace
            fullName={cardName  || undefined}
            title={cardTitle    || undefined}
            phone={cardPhone    || undefined}
            email={cardEmail    || undefined}
          />
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel}>Quick access</AppText>
          <View style={styles.actionList}>
            {ACTIONS.map((a, i) => (
              <Pressable
                key={a.label}
                onPress={() => router.push(a.route as any)}
                style={({ pressed }) => [
                  styles.actionRow,
                  i === 0 && styles.actionRowFirst,
                  i === ACTIONS.length - 1 && styles.actionRowLast,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.actionIcon}>
                  <AppIcon name={a.icon} size={20} color={BRAND} />
                </View>
                <View style={styles.actionCopy}>
                  <AppText style={styles.actionLabel}>{a.label}</AppText>
                  <AppText style={styles.actionSub}>{a.sub}</AppText>
                </View>
                <AppIcon name="ChevronRight" size={16} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Account info ── */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel}>Account</AppText>
          <View style={styles.actionList}>
            <View style={[styles.actionRow, styles.actionRowFirst]}>
              <AppIcon name="Mail" size={18} color={MUTED} />
              <AppText style={styles.infoText}>{user?.email ?? '—'}</AppText>
            </View>
            {bioPage?.slug ? (
              <View style={[styles.actionRow, styles.actionRowLast]}>
                <AppIcon name="Link" size={18} color={MUTED} />
                <AppText style={styles.infoText}>/{bioPage.slug}</AppText>
              </View>
            ) : (
              <View style={[styles.actionRow, styles.actionRowLast]}>
                <AppIcon name="Link" size={18} color={MUTED} />
                <AppText style={styles.infoText}>No public slug yet</AppText>
              </View>
            )}
          </View>
        </View>

        <AppButton
          label="Sign out"
          variant="ghost"
          iconName="LogOut"
          onPress={handleSignOut}
        />

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, gap: 20, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerCopy: { flex: 1, gap: 5 },
  name: { fontSize: 22, fontWeight: '800', color: INK, letterSpacing: -0.4 },
  rolePill: { alignSelf: 'flex-start', backgroundColor: '#E6F5FB', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 10, fontWeight: '800', color: BRAND, letterSpacing: 0.5 },

  cardWrap: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 10,
  },

  section: { gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },

  actionList: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  actionRowFirst: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pressed: { opacity: 0.72 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EBF7FC', alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, gap: 2 },
  actionLabel: { fontSize: 15, fontWeight: '700', color: INK },
  actionSub: { fontSize: 12, fontWeight: '500', color: MUTED },
  infoText: { flex: 1, fontSize: 14, fontWeight: '500', color: MUTED },
});
