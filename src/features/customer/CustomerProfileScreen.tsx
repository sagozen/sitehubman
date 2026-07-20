/**
 * CustomerProfileScreen — quiet Apple Settings-style account screen.
 *
 * Single column: small avatar, name, slug, card carousel with hint,
 * "create another card" CTA, Settings-list of account rows, sign out.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { Alert, ActivityIndicator, Image, Pressable, StyleSheet, View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HapticTap } from '@/src/utils/haptics';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { CardStackCarousel } from '@/src/components/CardStackCarousel';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { usePreferences } from '@/src/hooks/usePreferences';
import { uploadProfilePhoto } from '@/src/services/profilePhotoService';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { SEED_CARDS } from '@/src/data/seedCards';
import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import type { CarouselCard } from '@/src/components/CardStackCarousel';

import { useAppTheme } from '@/src/hooks/useAppTheme';

const BRAND = '#0071E3';
const INK = '#111111';
const INK2 = '#111111';
// FIXED: Improved contrast for muted text (WCAG AA: 4.6:1 on white)
const MUTED = '#6E6E73';
const SURFACE = '#FFFFFF';
const BG = '#F5F7FA';

const DebouncedTextInput = memo(function DebouncedTextInput({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  keyboardType,
  autoCapitalize,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  style?: any;
}) {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    const task = setTimeout(() => {
      if (localVal !== value) {
        onChangeText(localVal);
      }
    }, 200);
    return () => clearTimeout(task);
  }, [localVal, onChangeText, value]);

  return (
    <TextInput
      style={style}
      value={localVal}
      onChangeText={setLocalVal}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      onBlur={() => onChangeText(localVal)}
    />
  );
});

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

  // Inline live editing state
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [isSavingLive, setIsSavingLive] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (bioPage || user) {
      setEditName(bioPage?.displayName?.trim() || user?.displayName?.trim() || '');
      setEditTitle(bioPage?.tagline?.trim() || '');
      setEditPhone(bioPage?.whatsapp?.trim() || user?.phone?.trim() || '');
      setEditEmail(bioPage?.email?.trim() || user?.email?.trim() || '');
      setEditSlug(bioPage?.slug || '');
    }
  }, [bioPage, user]);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      setError(null);
      loadCustomerCloudCard(user.id)
        .then(setCloudCard)
        .catch(err => {
          console.warn('CustomerProfileScreen: Failed to load cloud card:', err);
          setCloudCard(null); // Fallback to default design instead of showing error screen
        })
        .finally(() => setIsLoading(false));
    }
  }, [user?.id]);

  const initial = (user?.displayName?.trim() || 'U')[0].toUpperCase();
  const cardName = editName || bioPage?.displayName?.trim() || user?.displayName?.trim() || '';
  const cardTitle = editTitle || bioPage?.tagline?.trim() || '';
  const cardPhone = editPhone || bioPage?.whatsapp?.trim() || user?.phone?.trim() || '';
  const cardEmail = editEmail || bioPage?.email?.trim() || user?.email?.trim() || '';
  const profileUrl = editSlug ? buildSlugProfileUrl(editSlug) : (bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : undefined);
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
      gradientIndex: cloudCard?.design?.gradientIndex ?? 0,
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

  const handlePublishChanges = useCallback(async () => {
    if (!user?.id) return;
    setIsSavingLive(true);
    setSaveSuccessMsg(null);
    try {
      await saveBioPage({
        displayName: editName.trim() || user.displayName || 'My Profile',
        tagline: editTitle.trim(),
        whatsapp: editPhone.trim(),
        email: editEmail.trim(),
        slug: editSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') || `user-${Date.now()}`,
        customLinks: bioPage?.customLinks || [],
        theme: bioPage?.theme || 'ocean_wave',
        photoUrl: photoUrl || undefined,
      });
      setSaveSuccessMsg('Published! Changes saved to database.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      Alert.alert('Publish Failed', err.message || 'Could not save changes to database.');
    } finally {
      setIsSavingLive(false);
    }
  }, [user, editName, editTitle, editPhone, editEmail, editSlug, bioPage, saveBioPage, photoUrl]);

  const liveFields = useMemo(() => [
    {
      key: 'avatar',
      icon: 'UserRound' as AppIconName,
      label: 'AVATAR PHOTO',
      isAvatar: true,
      value: photoUrl ? 'Tap photo to change' : 'Tap to upload photo',
      onPress: () => void pickImage(),
    },
    {
      key: 'name',
      icon: 'PenLine' as AppIconName,
      label: 'DISPLAY NAME',
      value: editName,
      onChangeText: setEditName,
      placeholder: 'Enter your display name',
    },
    {
      key: 'title',
      icon: 'Briefcase' as AppIconName,
      label: 'TITLE / TAGLINE',
      value: editTitle,
      onChangeText: setEditTitle,
      placeholder: 'e.g. Digital Creator',
    },
    {
      key: 'phone',
      icon: 'Phone' as AppIconName,
      label: 'PHONE / WHATSAPP',
      value: editPhone,
      onChangeText: setEditPhone,
      placeholder: '+1 234 567 8900',
      keyboardType: 'phone-pad' as const,
    },
    {
      key: 'email',
      icon: 'Mail' as AppIconName,
      label: 'EMAIL ADDRESS',
      value: editEmail,
      onChangeText: setEditEmail,
      placeholder: 'you@example.com',
      keyboardType: 'email-address' as const,
      autoCapitalize: 'none' as const,
    },
    {
      key: 'slug',
      icon: 'Link' as AppIconName,
      label: 'PUBLIC SLUG (URL)',
      value: editSlug,
      onChangeText: setEditSlug,
      placeholder: 'your-custom-url',
      autoCapitalize: 'none' as const,
    },
  ], [editName, editTitle, editPhone, editEmail, editSlug, photoUrl, pickImage]);

  // Handle loading/error states
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND} size="large" />
        <AppText variant="body" style={{ color: '#FFFFFF', marginTop: 16 }}>
          Loading profile...
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AppText variant="body" style={{ color: '#FFFFFF', textAlign: 'center' }}>
          {error}
        </AppText>
        <Pressable
          onPress={() => {
            setIsLoading(true);
            setError(null);
          }}
          style={styles.retryButton}
        >
          <AppText variant="body" weight="bold" style={{ color: BRAND }}>
            Try Again
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Facebook-Style Centered Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => void pickImage()}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
            accessibilityLabel="Change profile photo"
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
              <AppIcon name={isUploadingPhoto ? 'Loader' : 'Camera'} size={14} color="#000000" />
            </View>
          </Pressable>
          <View style={styles.headerCopy}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AppText style={styles.name} numberOfLines={1}>
                {user?.displayName ?? 'My account'}
              </AppText>
              <AppIcon name="BadgeCheck" size={20} color={BRAND} variant="solar-bold" />
            </View>
            <AppText style={styles.slug} numberOfLines={1}>
              {bioPage?.slug ? `sitehub.app/${bioPage.slug}` : 'No public slug yet'}
            </AppText>
          </View>
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

        {/* ── Persistent create-card CTA (B&W Outline Theme) ── */}
        <View style={{ marginVertical: 16 }}>
          <AppButton
            label="Create Another Card"
            iconName="PlusCircle"
            variant="outline"
            onPress={() => {
              HapticTap.medium();
              handleCreateCard();
            }}
          />
        </View>

        {/* ── Account section (Live Editing + 3X Bigger Black Icons) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText style={styles.sectionTitle}>ACCOUNT (LIVE EDIT)</AppText>
            <AppText style={styles.sectionMeta}>Edit below & publish to DB</AppText>
          </View>
          <View style={styles.list}>
            {liveFields.map((field, i) => {
              const isLast = i === liveFields.length - 1;
              return (
                <View
                  key={field.key}
                  style={[styles.row, isLast && styles.rowLast]}
                >
                  <View style={styles.iconNoBg}>
                    <AppIcon name={field.icon} size={22} color="#FFFFFF" />
                  </View>

                  <View style={styles.rowCopy}>
                    <AppText style={styles.rowLabel}>{field.label}</AppText>
                    {field.isAvatar ? (
                      <Pressable onPress={field.onPress} style={{ paddingVertical: 4 }}>
                        <AppText style={[styles.rowValue, { color: BRAND, fontWeight: '700' }]}>
                          {field.value}
                        </AppText>
                      </Pressable>
                    ) : (
                      <DebouncedTextInput
                        style={styles.liveInput}
                        value={field.value}
                        onChangeText={field.onChangeText || (() => {})}
                        placeholder={field.placeholder}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType={field.keyboardType || 'default'}
                        autoCapitalize={field.autoCapitalize || 'words'}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Publish Changes Button (Black & White Theme) ── */}
          <View style={{ marginTop: 16, gap: 12 }}>
            <AppButton
              label={isSavingLive ? 'Publishing to Database...' : 'Publish Changes to DB'}
              iconName="CloudUpload"
              variant="dark"
              loading={isSavingLive}
              onPress={() => {
                HapticTap.medium();
                handlePublishChanges();
              }}
            />
            {saveSuccessMsg ? (
              <View style={styles.successBanner}>
                <AppIcon name="CheckCircle" size={18} color="#00C7BE" variant="solar-bold" />
                <AppText style={styles.successBannerText}>{saveSuccessMsg}</AppText>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Sign out (Outline Theme) ── */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <AppButton
            label="Sign Out"
            iconName="LogOut"
            variant="outline"
            onPress={() => {
              HapticTap.warning();
              handleSignOut();
            }}
          />
        </View>

      </IosScrollView>
    </SafeAreaView>
  );
}

function useStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#000000' },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 24 },

    // Loading State
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
    },

    // Error State
    errorContainer: {
      padding: 24,
      backgroundColor: '#000000',
      alignItems: 'center',
    },
    retryButton: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: '#F8F9FA',
    },

    // Premium Facebook-style centered header
    header: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingVertical: 28,
      paddingHorizontal: 20,
      backgroundColor: '#111114',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    avatar: { width: 108, height: 108, borderRadius: 54, position: 'relative' },
    avatarImage: { width: 108, height: 108, borderRadius: 54, backgroundColor: BRAND },
    avatarFallback: { width: 108, height: 108, borderRadius: 54, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 40, fontWeight: '900', color: '#FFFFFF' },
    avatarBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#000000',
    },
    headerCopy: { alignItems: 'center', gap: 6 },
    name: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, textAlign: 'center' },
    slug: { fontSize: 15, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
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
      backgroundColor: '#111114',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    newCardIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    newCardCopy: { flex: 1, gap: 2, minWidth: 0 },
    newCardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    newCardSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.45)' },

    // Apple Settings-style list (Elevated)
    list: {
      backgroundColor: '#111114',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.04)',
      minHeight: 78,
    },
    rowLast: { borderBottomWidth: 0 },
    iconNoBg: {
      width: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    liveInput: {
      fontSize: 17,
      fontFamily: 'SF-Pro-Display-Semibold',
      color: '#FFFFFF',
      paddingVertical: 4,
      paddingHorizontal: 0,
      margin: 0,
    },
    successBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(48, 209, 88, 0.1)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(48, 209, 88, 0.3)',
    },
    successBannerText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#30D158',
    },
    rowCopy: { flex: 1, gap: 2, minWidth: 0 },
    rowLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 },
    rowValue: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

    // Sign out
    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 20,
      backgroundColor: '#111114',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    signOutT: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
    oceanBlueCard: {
      backgroundColor: '#111114',
      width: '100%',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    oceanTealCard: {
      backgroundColor: '#111114',
      width: '100%',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    signOutCard: {
      backgroundColor: '#111114',
      width: '100%',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    oceanIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
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
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.85)',
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    oceanTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  }), [colors]);
}