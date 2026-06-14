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
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';

const BRAND = '#2596BE';
const INK = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.05)';

const ACTIONS: { icon: AppIconName; label: string; route: string }[] = [
  { icon: 'CreditCard', label: 'Card', route: appRoutes.guestDesign },
  { icon: 'Users', label: 'Network', route: appRoutes.customerConnections },
  { icon: 'QrCode', label: 'QR', route: appRoutes.qrGenerator },
  { icon: 'Sparkles', label: 'Studio', route: appRoutes.studio },
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

        {/* ── Identity ── */}
        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <AppText style={styles.avatarText}>{initial}</AppText>
          </View>
          <View style={styles.nameRow}>
            <AppText style={styles.name} numberOfLines={2} adjustsFontSizeToFit>{user?.displayName ?? 'My Account'}</AppText>
            <AppIcon name="BadgeCheck" size={24} color={BRAND} />
          </View>
          <AppText style={styles.profileMeta} numberOfLines={1}>
            {[cardTitle || 'Digital identity', 'NFC Global'].filter(Boolean).join(' / ')}
          </AppText>
        </View>

        {/* ── NFC card — real bio data + real QR ── */}
        <View style={styles.cardWrap}>
          <NfcGlobalCardFace
            fullName={cardName  || undefined}
            title={cardTitle    || undefined}
            phone={cardPhone    || undefined}
            email={cardEmail    || undefined}
            profileUrl={bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : undefined}
          />
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <View style={styles.actionStrip}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => router.push(a.route as any)}
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <AppIcon name={a.icon} size={24} color={a.label === 'Studio' ? BRAND : INK} />
                <AppText style={styles.actionLabel}>{a.label}</AppText>
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
  content: { padding: 24, gap: 24, paddingBottom: 120 },

  identity: { alignItems: 'center', gap: 8, paddingTop: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: '100%' },
  profileMeta: { fontSize: 15, fontWeight: '600', color: MUTED, textAlign: 'center' },
  avatarWrap: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  name: { flexShrink: 1, fontSize: 38, lineHeight: 42, fontWeight: '900', color: INK, letterSpacing: 0, textAlign: 'center' },

  cardWrap: {
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#111111', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.22, shadowRadius: 34, elevation: 10,
  },

  section: { gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },

  actionStrip: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  actionBtn: { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 16 },
  actionList: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    overflow: 'hidden',
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
  actionCopy: { flex: 1, gap: 2 },
  actionLabel: { fontSize: 11, fontWeight: '800', color: INK, textAlign: 'center' },
  actionSub: { fontSize: 12, fontWeight: '500', color: MUTED },
  infoText: { flex: 1, fontSize: 14, fontWeight: '500', color: MUTED },
});
