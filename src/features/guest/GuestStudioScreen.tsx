import { IosScrollView } from '@/src/components/IosScrollView';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useEffect, useState } from 'react';

const BRAND = '#2596BE';
const INK = '#111111';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';

const STUDIO_ACTIONS: { icon: AppIconName; label: string; route: string }[] = [
  { icon: 'CreditCard', label: 'Card design', route: appRoutes.guestDesign },
  { icon: 'PenLine', label: 'Public profile', route: '/edit-bio' },
  { icon: 'QrCode', label: 'QR identity', route: appRoutes.qrGenerator },
];

export function GuestStudioScreen() {
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadCustomerCloudCard(user.id)
        .then(setCloudCard)
        .catch(() => null)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const initial = (user?.displayName?.trim() || 'S')[0].toUpperCase();
  const cardName = bioPage?.displayName?.trim() || cloudCard?.profile.fullName?.trim() || user?.displayName?.trim() || '';
  const cardTitle = bioPage?.tagline?.trim() || cloudCard?.profile.role?.trim() || '';
  const cardPhone = bioPage?.whatsapp?.trim() || cloudCard?.profile.phone?.trim() || user?.phone?.trim() || '';
  const cardEmail = bioPage?.email?.trim() || cloudCard?.profile.email?.trim() || user?.email?.trim() || '';
  const profileUrl = bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : cloudCard?.publicProfileUrl || undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <AppIcon name="ChevronLeft" size={22} color={INK} />
          </Pressable>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initial}</AppText>
          </View>
        </View>

        <View style={styles.hero}>
          <AppText style={styles.kicker}>Studio</AppText>
          <AppText style={styles.title}>Shape the identity people remember.</AppText>
          <AppText style={styles.subtitle}>Card, profile, and QR stay together.</AppText>
        </View>

        <View style={styles.cardWrap}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={BRAND} size="large" />
              <AppText style={styles.loadingText}>Loading your card...</AppText>
            </View>
          ) : (
            <FlippableNfcCard
              fullName={cardName || undefined}
              title={cardTitle || undefined}
              phone={cardPhone || undefined}
              email={cardEmail || undefined}
              profileUrl={profileUrl}
              cardId={cloudCard?.cardId}
            />
          )}
        </View>

        <AppText style={styles.flipHint}>💡 Tap card to flip</AppText>

        <View style={styles.actionList}>
          {STUDIO_ACTIONS.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [styles.actionRow, index === STUDIO_ACTIONS.length - 1 && styles.actionRowLast, pressed && styles.pressed]}
            >
              <AppIcon name={item.icon} size={22} color={item.label === 'Card design' ? BRAND : INK} />
              <AppText style={styles.actionLabel}>{item.label}</AppText>
              <AppIcon name="ChevronRight" size={16} color={MUTED} />
            </Pressable>
          ))}
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 120, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  hero: { gap: 8, alignItems: 'flex-start' },
  kicker: { fontSize: 13, fontWeight: '800', color: BRAND },
  title: { fontSize: 42, lineHeight: 45, fontWeight: '900', color: INK, letterSpacing: 0 },
  subtitle: { fontSize: 16, fontWeight: '600', color: MUTED },
  cardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
    elevation: 10,
    minHeight: 220,
  },
  loadingCard: {
    minHeight: 220,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 24,
  },
  loadingText: { fontSize: 13, fontWeight: '600', color: MUTED },
  flipHint: { fontSize: 12, fontWeight: '600', color: MUTED, textAlign: 'center', marginTop: -12 },
  actionList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  actionRow: {
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  actionRowLast: { borderBottomWidth: 0 },
  actionLabel: { flex: 1, fontSize: 17, fontWeight: '800', color: INK },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
