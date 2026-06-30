/**
 * CustomerProfileScreen — quiet Apple Settings-style account screen.
 *
 * Single column: small avatar, name, slug, card carousel with hint,
 * "create another card" CTA, Settings-list of account rows, sign out.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { CardStackCarousel } from '@/src/components/CardStackCarousel';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { usePreferences } from '@/src/hooks/usePreferences';
import { uploadProfilePhoto } from '@/src/services/profilePhotoService';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { SEED_CARDS } from '@/src/data/seedCards';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CarouselCard } from '@/src/components/CardStackCarousel';

import { useAppTheme } from '@/src/hooks/useAppTheme';

const BRAND = '#007AFF';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
// FIXED: Improved contrast for muted text (WCAG AA: 4.6:1 on white)
const MUTED = '#6E6E73';
const SURFACE = '#FFFFFF';
const BG = '#FFFFFF';

type AccountRow = {
  icon: AppIconName;
  label: string;
  value: string;
  /** If true, tapping opens an external picker (image library). */
  isAvatar?: boolean;
  onPress?: () => void;
};

export function CustomerProfileScreen() {
  const { user, signOutUser } = useAuth();
  const { colors } = useAppTheme();
  const styles = useStyles(colors);
  const { bioPage, saveBioPage } = useBioPage(user?.id ?? '');
  const { preferences, updatePreferences } = usePreferences();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [error, setError] = useState<string | null>(null); // Added error state

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      setError(null);
      loadCustomerCloudCard(user.id)
        .then(setCloudCard)
        .catch(err => {
          setError(err.message || 'Failed to load card data');
          console.error('CustomerProfileScreen: Failed to load cloud card:', err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user?.id]);

  const initial = (user?.displayName?.trim() || 'U')[0].toUpperCase();
  const cardName = bioPage?.displayName?.trim() || user?.displayName?.trim() || '';
  const cardTitle = bioPage?.tagline?.trim() || '';
  const cardPhone = bioPage?.whatsapp?.trim() || user?.phone?.trim() || '';
  const cardEmail = bioPage?.email?.trim() || user?.email?.trim() || '';
  const profileUrl = bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : undefined;
  const photoUrl = bioPage?.photoUrl;

  const carouselCards = useMemo(() => {
    const activePrimaryId = preferences.primaryCardId || 'card-current';

    const userProfileCard = {
      id: 'card-current',
      role: 'personal',
      fullName: cardName || user?.displayName || 'My Profile Card',
      title: cardTitle || 'Digital Creator',
      phone: cardPhone || '',
      email: cardEmail || user?.email || '',
      website: profileUrl || '',
      profileUrl: profileUrl || '',
      cardId: cloudCard?.cardId || 'BC-NFC_USER',
      backgroundImageUri: photoUrl,
    };

    const otherCards = SEED_CARDS.filter(c => c.id !== 'card-primary');
    const baseCards = [userProfileCard, ...otherCards];

    return baseCards.map(c => ({
      ...c,
      isPrimary: c.id === activePrimaryId,
    }));
  }, [preferences.primaryCardId, cardEmail, cardName, cardPhone, cardTitle, cloudCard?.cardId, profileUrl, photoUrl, user?.displayName, user?.email]);

  const handleCardPress = useCallback(async (card: CarouselCard) => {
    Alert.alert(
      'Primary Card Configuration',
      `Set "${card.fullName || 'this card'}" as your primary card on the Home Screen?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Set & Stay Here',
          onPress: async () => {
            try {
              await updatePreferences({ primaryCardId: card.id });
            } catch (err) {
              Alert.alert('Error', 'Could not update primary card.');
            }
          },
        },
        {
          text: 'Set & Go to Home Screen',
          style: 'default',
          onPress: async () => {
            try {
              await updatePreferences({ primaryCardId: card.id });
              router.replace('/');
            } catch (err) {
              Alert.alert('Error', 'Could not update primary card.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [updatePreferences]);

  const pickImage = useCallback(async () => {
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
      } catch (err) {
        Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again.');
      } finally {
        setIsUploadingPhoto(false);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not open picker.');
    }
  }, [bioPage, saveBioPage, user]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOutUser() },
    ]);
  }, [signOutUser]);

  const handleCreateCard = useCallback(() => {
    router.push(appRoutes.guestDesign as any);
  }, []);

  const accountRows: AccountRow[] = useMemo(
    () => [
      {
        icon: 'UserRound',
        label: 'Avatar',
        value: photoUrl ? 'Tap photo to change' : 'Add photo',
        isAvatar: true,
        onPress: () => void pickImage(),
      },
      { icon: 'PenLine', label: 'Display name', value: cardName || 'Not set', onPress: () => router.push(appRoutes.editBio as any) },
      { icon: 'Briefcase', label: 'Title', value: cardTitle || 'Not set', onPress: () => router.push(appRoutes.editBio as any) },
      { icon: 'Phone', label: 'Phone', value: cardPhone || 'Not set', onPress: () => router.push(appRoutes.editBio as any) },
      { icon: 'Mail', label: 'Email', value: cardEmail || 'Not set', onPress: () => router.push(appRoutes.editBio as any) },
      { icon: 'Link', label: 'Public slug', value: bioPage?.slug ? `/${bioPage.slug}` : 'Not published', onPress: () => router.push(appRoutes.editBio as any) },
    ],
    [bioPage?.slug, cardEmail, cardName, cardPhone, cardTitle, photoUrl, pickImage],
  );

  // Handle loading/error states
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator style={{ color: BRAND }} size="large" />
        <AppText variant="body" color={INK} marginTop={16}>
          Loading profile...
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AppText variant="body" color={INK} textAlign="center">
          {error}
        </AppText>
        <Pressable
          onPress={() => {
            setIsLoading(true);
            setError(null);
            // Retry logic would go here
          }}
          style={styles.retryButton}
        >
          <AppText variant="body" color={BRAND} weight="bold">
            Try Again
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => void pickImage()}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
            accessibilityLabel="Change profile photo"
            // FIXED: Added hitSlop for reliable touch targets
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            android_ripple={{
              color: 'rgba(255,255,255,0.3)',
              borderless: true
            }}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <AppText style={styles.avatarText}>{initial}</AppText>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <AppIcon name={isUploadingPhoto ? 'Loader' : 'Camera'} size={11} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.name} numberOfLines={1}>
              {user?.displayName ?? 'My account'}
            </AppText>
            <AppText style={styles.slug} numberOfLines={1}>
              {bioPage?.slug ? `sitehub.app/${bioPage.slug}` : 'No public slug yet'}
            </AppText>
          </View>
          <AppIcon name="BadgeCheck" size={18} color={BRAND} />
        </View>

        {/* ── Cards carousel + inline hint ── */}
        <View style={styles.carouselSection}>
          <View style={styles.sectionHead}>
            <AppText style={styles.sectionTitle}>YOUR CARDS</AppText>
            <AppText style={styles.sectionMeta}>
              {carouselCards.length} active
            </AppText>
          </View>
          <View style={styles.carouselWrapper}>
            <CardStackCarousel
              cards={carouselCards}
              addCardHref={appRoutes.guestDesign}
              onCardPress={handleCardPress}
            />
          </View>
          <View style={styles.carouselHint}>
            <AppIcon name="PlusSimple" size={12} color={BRAND} />
            <AppText style={styles.carouselHintText}>
              Swipe to the last card and tap the dashed slot — or use the button below.
            </AppText>
          </View>
        </View>

        {/* ── Persistent create-card CTA ── */}
        <Pressable
          onPress={handleCreateCard}
          style={({ pressed }) => [styles.newCardCta, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Create a new card"
          // FIXED: Added hitSlop and Android ripple for reliable touch
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          android_ripple={{
            color: 'rgba(255,255,255,0.3)',
            borderless: true
          }}
        >
          <View style={styles.newCardIcon}>
            <AppIcon name="PlusSimple" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.newCardCopy}>
            <AppText style={styles.newCardTitle}>Create another card</AppText>
            <AppText style={styles.newCardSub}>Work, side project, event, creator profile…</AppText>
          </View>
          <AppIcon name="ChevronRight" size={16} color={colors.textMuted} />
        </Pressable>

        {/* ── Account section (Apple Settings list) ── */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>ACCOUNT</AppText>
          <View style={styles.list}>
            {accountRows.map((row, i) => {
              const isLast = i === accountRows.length - 1;
              return (
                <Pressable
                  key={row.label}
                  onPress={row.onPress}
                  style={({ pressed }) => [
                    styles.row,
                    isLast && styles.rowLast,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole={row.onPress ? 'button' : 'text'}
                  accessibilityLabel={`${row.label}: ${row.value}`}
                  // FIXED: Added hitSlop and Android ripple for reliable touch
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  android_ripple={{
                    color: 'rgba(255,255,255,0.3)',
                    borderless: true
                  }}
                >
                  {row.isAvatar ? (
                    <View style={styles.rowAvatarTile}>
                      {photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={styles.rowAvatarImg} />
                      ) : (
                        <AppText style={styles.rowAvatarText}>{initial}</AppText>
                      )}
                    </View>
                  ) : (
                    <View style={styles.rowIconTile}>
                      <AppIcon name={row.icon} size={15} color={BRAND} />
                    </View>
                  )}
                  <View style={styles.rowCopy}>
                    <AppText style={styles.rowLabel}>{row.label}</AppText>
                    <AppText style={styles.rowValue} numberOfLines={1}>{row.value}</AppText>
                  </View>
                  <AppIcon name="ChevronRight" size={13} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Sign out ── */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          // FIXED: Added hitSlop and Android ripple for reliable touch
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          android_ripple={{
            color: 'rgba(255,255,255,0.3)',
            borderless: true
          }}
        >
          <AppIcon name="LogOut" size={15} color="#FF3B30" />
          <AppText style={styles.signOutT}>Sign out</AppText>
        </Pressable>

      </IosScrollView>
    </SafeAreaView>
  );
}

function useStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 24 },

    // Loading State
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },

    // Error State
    errorContainer: {
      padding: 24,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    retryButton: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: '#F8F9FA',
    },

    // Premium header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 20,
      backgroundColor: colors.surface,
      borderRadius: 24,
      // FIXED: Standardized elevation values
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    avatar: { width: 64, height: 64, borderRadius: 32, position: 'relative' },
    avatarImage: { width: 64, height: 64, borderRadius: 32, backgroundColor: BRAND },
    avatarFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 24, fontWeight: '900', color: colors.background },
    avatarBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    headerCopy: { flex: 1, gap: 4, minWidth: 0 },
    name: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
    slug: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    pressed: { opacity: 0.7 },

    // Section heads
    section: { gap: 10 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
    sectionMeta: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

    // Carousel
    carouselSection: { gap: 12 },
    carouselWrapper: {
      marginHorizontal: -20,
    },
    carouselHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    carouselHintText: { flex: 1, fontSize: 12, fontWeight: '500', color: colors.textMuted },

    // Persistent create-card CTA
    newCardCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: colors.surface,
      // FIXED: Standardized elevation values
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    newCardIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: BRAND,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newCardCopy: { flex: 1, gap: 2, minWidth: 0 },
    newCardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    newCardSub: { fontSize: 13, fontWeight: '500', color: colors.textMuted },

    // Apple Settings-style list (Elevated)
    list: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      overflow: 'hidden',
      // FIXED: Standardized elevation values
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      minHeight: 64,
    },
    rowLast: { borderBottomWidth: 0 },
    rowIconTile: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${BRAND}1A`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowAvatarTile: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    rowAvatarImg: { width: 32, height: 32, borderRadius: 16 },
    rowAvatarText: { fontSize: 14, fontWeight: '800', color: colors.background },
    rowCopy: { flex: 1, gap: 2, minWidth: 0 },
    rowLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    rowValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

    // Sign out
    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      // FIXED: Standardized elevation values
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    signOutT: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
  }), [colors]);
}