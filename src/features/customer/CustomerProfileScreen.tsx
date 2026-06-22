/**
 * Customer Profile tab — shows real NFC card (bio data), quick actions,
 * account info, and sign-out. Same visual style as GuestProfileScreen
 * but with real data and no "locked" wall.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { Alert, Pressable, StyleSheet, View, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { CardStackCarousel } from '@/src/components/CardStackCarousel';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { uploadProfilePhoto } from '@/src/services/profilePhotoService';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { SEED_CARDS } from '@/src/data/seedCards';
import { useState, useEffect, useMemo } from 'react';

const BRAND = '#007AFF';
const INK = '#000000';
const MUTED = '#8E8E93';
const BG = '#F2F2F7';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(60,60,67,0.14)';

const ACTIONS: { icon: AppIconName; label: string; route: string }[] = [
  { icon: 'CreditCard', label: 'Card', route: appRoutes.guestDesign },
  { icon: 'Users', label: 'Network', route: appRoutes.customerConnections },
  { icon: 'QrCode', label: 'QR', route: appRoutes.qrGenerator },
  { icon: 'Sparkles', label: 'Studio', route: appRoutes.studio },
];

export function CustomerProfileScreen() {
  const { user, signOutUser } = useAuth();
  const { bioPage, saveBioPage } = useBioPage(user?.id ?? '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);

  useEffect(() => {
    if (user?.id) {
      loadCustomerCloudCard(user.id)
        .then(setCloudCard)
        .catch(() => null);
    }
  }, [user?.id]);

  const initial = (user?.displayName?.trim() || 'U')[0].toUpperCase();
  const cardName  = bioPage?.displayName?.trim() || user?.displayName?.trim() || '';
  const cardTitle = bioPage?.tagline?.trim() || '';
  const cardPhone = bioPage?.whatsapp?.trim() || user?.phone?.trim() || '';
  const cardEmail = bioPage?.email?.trim() || user?.email?.trim() || '';
  const profileUrl = bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : undefined;
  const photoUrl = bioPage?.photoUrl;

  const carouselCards = useMemo(() => {
    if (SEED_CARDS.length > 0) return SEED_CARDS;
    return [
      {
        id: 'card-current',
        fullName: cardName || undefined,
        title: cardTitle || undefined,
        phone: cardPhone || undefined,
        email: cardEmail || undefined,
        profileUrl,
        cardId: cloudCard?.cardId,
        isPrimary: true,
      },
    ];
  }, [cardEmail, cardName, cardPhone, cardTitle, cloudCard?.cardId, profileUrl]);

  async function pickImage() {
    if (!user?.id) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Photo library access required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      setIsUploadingPhoto(true);
      try {
        const res = await uploadProfilePhoto({
          uri: result.assets[0].uri,
          userId: user.id,
          fileName: result.assets[0].fileName,
          mimeType: result.assets[0].mimeType,
        });
        await saveBioPage({
          slug: bioPage?.slug || user.id,
          displayName: bioPage?.displayName || user.displayName || '',
          tagline: bioPage?.tagline,
          whatsapp: bioPage?.whatsapp,
          instagram: bioPage?.instagram,
          telegram: bioPage?.telegram,
          email: bioPage?.email || user.email,
          customLinks: bioPage?.customLinks ?? [],
          theme: bioPage?.theme ?? 'vibrant_pink',
          photoUrl: res.url,
        });
        Alert.alert('Success', 'Profile photo updated!');
      } catch (err) {
        Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again.');
      } finally {
        setIsUploadingPhoto(false);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not open picker.');
    }
  }

  function handleSignOut() {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOutUser() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.identity}>
          <Pressable onPress={() => void pickImage()} style={styles.avatarWrap}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <AppText style={styles.avatarText}>{initial}</AppText>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <AppIcon name={isUploadingPhoto ? 'Loader' : 'Camera'} size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={styles.nameRow}>
            <AppText style={styles.name} numberOfLines={2} adjustsFontSizeToFit>{user?.displayName ?? 'My Account'}</AppText>
            <AppIcon name="BadgeCheck" size={24} color={BRAND} />
          </View>
          <AppText style={styles.profileMeta} numberOfLines={1}>
            {[cardTitle || 'Verified identity', 'NFC card active'].filter(Boolean).join(' / ')}
          </AppText>
        </View>

        <View style={styles.cardWrap}>
          <CardStackCarousel
            cards={carouselCards}
            addCardHref={appRoutes.guestDesign}
          />
        </View>

        <Pressable
          onPress={() => router.push(appRoutes.guestDesign as any)}
          style={({ pressed }) => [styles.newCardCta, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Create a new card"
        >
          <View style={styles.newCardIcon}>
            <AppIcon name="PlusSimple" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.newCardCopy}>
            <AppText style={styles.newCardTitle}>Create another card</AppText>
            <AppText style={styles.newCardSub}>Separate work, side project, event, or creator profile</AppText>
          </View>
          <AppIcon name="ChevronRight" size={18} color={BRAND} />
        </Pressable>

        <View style={styles.section}>
          <View style={styles.actionStrip}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => router.push(a.route as any)}
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={[styles.actionIcon, a.label === 'Studio' && styles.actionIconBlue]}>
                  <AppIcon name={a.icon} size={22} color={a.label === 'Studio' ? '#FFFFFF' : BRAND} />
                </View>
                <AppText style={styles.actionLabel}>{a.label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

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
  content: { padding: 22, gap: 22, paddingBottom: 120 },

  identity: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderRadius: 28,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: '100%' },
  profileMeta: { fontSize: 15, fontWeight: '600', color: MUTED, textAlign: 'center' },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 8,
    position: 'relative',
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: BRAND,
  },
  avatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: BG,
  },
  avatarText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  name: { flexShrink: 1, fontSize: 34, lineHeight: 39, fontWeight: '900', color: INK, letterSpacing: 0, textAlign: 'center' },

  cardWrap: {
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#111111', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.22, shadowRadius: 34, elevation: 10,
  },

  newCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: 'rgba(0,122,255,0.28)',
    borderStyle: 'dashed',
  },
  newCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCardCopy: { flex: 1, gap: 2, minWidth: 0 },
  newCardTitle: { fontSize: 15, fontWeight: '900', color: INK, letterSpacing: 0 },
  newCardSub: { fontSize: 11, fontWeight: '600', color: MUTED, lineHeight: 15 },

  section: { gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },

  actionStrip: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBlue: {
    backgroundColor: BRAND,
  },
  actionList: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
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
