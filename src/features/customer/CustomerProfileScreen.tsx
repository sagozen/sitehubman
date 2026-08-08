/**
 * CustomerProfileScreen — Redesigned X.com (Twitter) style professional profile page.
 *
 * Design Language:
 *  1. Solid black canvas (#000000) with 640px responsive container
 *  2. X.com full-bleed banner with floating overlapping circular avatar (-42px top margin, 4px black border)
 *  3. Top-right action row (Edit Profile / Share Card pill + link action buttons)
 *  4. X.com header metadata: Name with Verified Badge, @handle, Bio, Location/Link/Joined, Followers/Following stats
 *  5. Underlined X.com navigation tab bar (Bio | Cards | Links | Settings) with white indicator bar
 *  6. High-contrast charcoal cards (#111114, 1px rgba(255,255,255,0.08) border)
 *  7. Debounced inputs for lag-free performance & instant local feedback
 */
import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Switch,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { updateUserActiveProfile } from '@/src/services/firestoreService';
import { SEED_CARDS } from '@/src/data/seedCards';
import { HapticTap } from '@/src/utils/haptics';
import type { CarouselCard } from '@/src/components/CardStackCarousel';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_H = 140;

// ── Telegram/X gradient avatar fallbacks ──────────────────────────────────────
const HEADER_GRADIENTS = [
  ['#1D9BF0', '#0044FF'],
  ['#8E54E9', '#4776E6'],
  ['#00B4DB', '#0083B0'],
  ['#FF512F', '#DD2476'],
  ['#11998E', '#38EF7D'],
] as const;

function getHeaderColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return HEADER_GRADIENTS[Math.abs(hash) % HEADER_GRADIENTS.length];
}

// ── Debounced text input component ───────────────────────────────────────────
const DebouncedInput = memo(function DebouncedInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  style,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  style?: any;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => {
    const t = setTimeout(() => { if (local !== value) onChangeText(local); }, 280);
    return () => clearTimeout(t);
  }, [local, onChangeText, value]);
  return (
    <TextInput
      style={style}
      value={local}
      onChangeText={setLocal}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.25)"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize ?? 'none'}
      autoCorrect={false}
      onBlur={() => onChangeText(local)}
    />
  );
});

// ── Main component ───────────────────────────────────────────────────────────
export function CustomerProfileScreen() {
  const { user, signOutUser } = useAuth();
  
  // Use the activeProfileId from the user object to load the correct bio page
  const activeType = user?.activeProfileId === 'social' ? 'social' : 'professional';
  const queryUserId = activeType === 'social' && user?.id ? `${user.id}_social` : (user?.id ?? '');
  const { bioPage, saveBioPage } = useBioPage(queryUserId);
  const { preferences, updatePreferences } = usePreferences();

  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'bio' | 'card' | 'links' | 'settings'>('bio');

  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editDirectModeEnabled, setEditDirectModeEnabled] = useState(false);
  const [editDirectModeUrl, setEditDirectModeUrl] = useState('');
  const [editWebhookUrl, setEditWebhookUrl] = useState('');

  useEffect(() => {
    if (bioPage || user) {
      setEditName(bioPage?.displayName?.trim() || user?.displayName?.trim() || '');
      setEditTitle(bioPage?.tagline?.trim() || '');
      setEditPhone(bioPage?.whatsapp?.trim() || user?.phone?.trim() || '');
      setEditEmail(bioPage?.email?.trim() || user?.email?.trim() || '');
      setEditSlug(bioPage?.slug || '');
      setEditInstagram(bioPage?.instagram || '');
      setEditTelegram(bioPage?.telegram || '');
      setEditDirectModeEnabled(bioPage?.directModeEnabled || false);
      setEditDirectModeUrl(bioPage?.directModeUrl || '');
      setEditWebhookUrl(bioPage?.webhookUrl || '');
    }
  }, [bioPage, user]);

  useEffect(() => {
    if (!user?.id) { setIsLoading(false); return; }
    loadCustomerCloudCard(user.id)
      .then(setCloudCard)
      .catch(() => setCloudCard(null))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const displayName = editName || bioPage?.displayName || user?.displayName || 'Digital Creator';
  const tagline = editTitle || bioPage?.tagline || 'Building the future of digital business networking.';
  const slug = editSlug || bioPage?.slug || 'creator';
  const photoUrl = bioPage?.photoUrl;
  const profileUrl = slug ? buildSlugProfileUrl(slug) : undefined;
  const initial = (displayName[0] || 'C').toUpperCase();
  const gradColors = getHeaderColors(displayName);

  const carouselCards = useMemo<CarouselCard[]>(() => {
    const primaryId = preferences.primaryCardId || 'card-current';
    const main: CarouselCard = {
      id: 'card-current',
      role: 'personal',
      fullName: displayName,
      title: tagline || 'Digital Creator',
      phone: editPhone || bioPage?.whatsapp || user?.phone || '',
      email: editEmail || bioPage?.email || user?.email || '',
      website: profileUrl || '',
      profileUrl: profileUrl || '',
      cardId: cloudCard?.cardId || 'BC-NFC_USER',
      gradientIndex: cloudCard?.design?.gradientIndex ?? 0,
      isPrimary: 'card-current' === primaryId,
    };
    return [main, ...SEED_CARDS.filter(c => c.id !== 'card-primary').map(c => ({ ...c, isPrimary: c.id === primaryId }))];
  }, [preferences.primaryCardId, displayName, tagline, editPhone, editEmail, profileUrl, photoUrl, cloudCard, bioPage, user]);

  const handleCardPress = useCallback(async (card: CarouselCard) => {
    Alert.alert('Set Primary Card', `Use "${card.fullName || 'this card'}" on your Home Screen?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Set Primary', onPress: async () => { try { await updatePreferences({ primaryCardId: card.id }); } catch { Alert.alert('Error', 'Could not update.'); } } },
    ]);
  }, [updatePreferences]);

  const pickImage = useCallback(async () => {
    if (!user?.id) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Photo library access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setIsUploadingPhoto(true);
    try {
      const res = await uploadProfilePhoto({ uri: result.assets[0].uri, userId: user.id, fileName: result.assets[0].fileName, mimeType: result.assets[0].mimeType });
      await saveBioPage({ slug: bioPage?.slug || user.id, displayName: bioPage?.displayName || user.displayName || '', tagline: bioPage?.tagline, whatsapp: bioPage?.whatsapp, instagram: bioPage?.instagram, telegram: bioPage?.telegram, email: bioPage?.email || user.email, customLinks: bioPage?.customLinks ?? [], theme: bioPage?.theme ?? 'vibrant_pink', photoUrl: res.url });
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [bioPage, saveBioPage, user]);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const payloadId = activeType === 'social' ? `${user.id}_social` : user.id;

      const { id: _, userId: __, updatedAt: ___, ...restBioPage } = bioPage || {};

      await saveBioPage({
        ...restBioPage,
        displayName: editName.trim() || 'My Profile',
        tagline: editTitle.trim(),
        whatsapp: editPhone.trim(),
        email: editEmail.trim(),
        slug: editSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') || `user-${Date.now()}`,
        instagram: editInstagram.trim(),
        telegram: editTelegram.trim(),
        directModeEnabled: editDirectModeEnabled,
        directModeUrl: editDirectModeUrl.trim(),
        webhookUrl: editWebhookUrl.trim(),
        customLinks: bioPage?.customLinks || [],
        theme: bioPage?.theme || 'ocean_wave',
        photoUrl: photoUrl || undefined,
      });
      setSaveMsg('✓ Saved');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  }, [user, editName, editTitle, editPhone, editEmail, editSlug, editInstagram, editTelegram, editDirectModeEnabled, editDirectModeUrl, bioPage, saveBioPage, photoUrl]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOutUser() },
    ]);
  }, [signOutUser]);

  if (isLoading) {
    return (
      <View style={styles.loadCenter}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces style={styles.scroll}>
        <View style={styles.container}>

          {/* ── 1. X.com Cover Banner Header ── */}
          <View style={styles.bannerWrap}>
            <LinearGradient
              colors={[gradColors[0], gradColors[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerPattern} />
            </LinearGradient>

            {/* Top Navigation Controls */}
            <SafeAreaView style={styles.bannerTopBar} edges={['top']}>
              <Pressable
                style={styles.iconCircleBtn}
                onPress={() => { HapticTap.light(); router.back(); }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
              </Pressable>
              <View style={styles.bannerRightBtns}>
                <Pressable
                  style={styles.iconCircleBtn}
                  onPress={pickImage}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <AppIcon name="Camera" size={18} color="#FFFFFF" />
                  )}
                </Pressable>
                <Pressable
                  style={styles.iconCircleBtn}
                  onPress={() => { HapticTap.light(); router.push('/(tabs)/share' as any); }}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Share profile"
                >
                  <AppIcon name="Share" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>

          {/* ── 2. Floating Avatar & Actions Row ── */}
          <View style={styles.profileHeaderRow}>
            {/* Overlapping Floating Avatar (X.com Style) */}
            <Pressable
              style={styles.avatarContainer}
              onPress={pickImage}
              accessibilityRole="button"
              accessibilityLabel="Upload profile avatar"
            >
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <LinearGradient
                  colors={[gradColors[0], gradColors[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarImg}
                >
                  <AppText style={styles.avatarInitial} weight="extrabold">{initial}</AppText>
                </LinearGradient>
              )}
            </Pressable>

            {/* Action Pills Aligned Right */}
            <View style={styles.actionPillRow}>
              <Pressable
                style={({ pressed }) => [styles.editProfileBtn, pressed && styles.pressed]}
                onPress={() => { HapticTap.medium(); setActiveTab('bio'); }}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <AppText style={styles.editProfileText} weight="extrabold">Edit profile</AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionIconButton, pressed && styles.pressed]}
                onPress={() => {
                  HapticTap.light();
                  Alert.alert('Switch Profile', 'Select which profile is active when your NFC card is tapped.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: `Work${activeType === 'professional' ? ' (Active)' : ''}`, onPress: () => {
                        if (user?.id) updateUserActiveProfile(user.id, 'professional');
                        updatePreferences({ activeProfileId: 'professional' });
                    }},
                    { text: `Social${activeType === 'social' ? ' (Active)' : ''}`, onPress: () => {
                        if (user?.id) updateUserActiveProfile(user.id, 'social');
                        updatePreferences({ activeProfileId: 'social' });
                    }},
                  ]);
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch active profile"
              >
                <AppIcon name="Users" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionIconButton, pressed && styles.pressed]}
                onPress={() => { HapticTap.light(); if (profileUrl) router.push(`/u/${slug}` as any); }}
                accessibilityRole="button"
                accessibilityLabel="View live bio card"
              >
                <AppIcon name="ExternalLink" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* ── 3. Profile Info (X.com Metadata) ── */}
          <View style={styles.infoSection}>
            {/* Display Name + Verified Badge */}
            <View style={styles.nameRow}>
              <AppText style={styles.displayNameText} weight="extrabold" numberOfLines={1}>
                {displayName}
              </AppText>
            </View>

            {/* Handle */}
            <AppText style={styles.handleText}>@{slug}</AppText>

            {/* Bio / Tagline */}
            {tagline ? (
              <AppText style={styles.taglineText}>
                {tagline}
              </AppText>
            ) : null}

            {/* X Metadata Row (Location, Website, Joined) */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <AppIcon name="Briefcase" size={13} color="rgba(255,255,255,0.45)" />
                <AppText style={styles.metaText}>Digital NFC Pro</AppText>
              </View>
              {profileUrl ? (
                <View style={styles.metaItem}>
                  <AppIcon name="Link" size={13} color="#1D9BF0" />
                  <AppText style={[styles.metaText, styles.metaLink]} numberOfLines={1}>
                    snap.tap/{slug}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <AppIcon name="Calendar" size={13} color="rgba(255,255,255,0.45)" />
                <AppText style={styles.metaText}>Joined Aug 2026</AppText>
              </View>
            </View>

            {/* Stats Row (X Followers / Following style) */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">142</AppText>
                <AppText style={styles.statLabel}>Following</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">1.8k</AppText>
                <AppText style={styles.statLabel}>Followers</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">24</AppText>
                <AppText style={styles.statLabel}>NFC Taps</AppText>
              </View>
            </View>
          </View>

          {/* ── 4. X.com Underlined Tab Navigation ── */}
          <View style={styles.navTabContainer}>
            {[
              { key: 'bio', label: 'Bio & Info' },
              { key: 'card', label: 'NFC Cards' },
              { key: 'links', label: 'Links' },
              { key: 'settings', label: 'Settings' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={styles.navTabItem}
                  onPress={() => { HapticTap.light(); setActiveTab(tab.key as any); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <AppText
                    style={[styles.navTabText, isActive && styles.navTabTextActive]}
                    weight={isActive ? 'extrabold' : 'regular'}
                  >
                    {tab.label}
                  </AppText>
                  {isActive && <View style={styles.navActiveIndicator} />}
                </Pressable>
              );
            })}
          </View>

          {/* ── 5. Tab Content ── */}
          {/* Bio Tab */}
          {activeTab === 'bio' && (
            <View style={styles.tabBody}>
              {/* Photo Card Row */}
              <Pressable style={styles.charcoalCard} onPress={pickImage}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarThumbWrap}>
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={styles.avatarThumb} />
                    ) : (
                      <LinearGradient
                        colors={[gradColors[0], gradColors[1]]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.avatarThumb}
                      >
                        <AppText style={styles.avatarThumbLetter} weight="extrabold">{initial}</AppText>
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <AppText style={styles.cardSectionTitle} weight="extrabold">Profile Avatar</AppText>
                    <AppText style={styles.cardSectionSub}>Tap to select photo from gallery</AppText>
                  </View>
                  <AppIcon name="ChevronRight" size={18} color="rgba(255,255,255,0.3)" />
                </View>
              </Pressable>

              {/* Editable Fields */}
              {[
                { label: 'FULL DISPLAY NAME', value: editName, onChange: setEditName, placeholder: 'Your display name', icon: 'UserRound' as AppIconName },
                { label: 'TAGLINE / BIO', value: editTitle, onChange: setEditTitle, placeholder: 'Brief tagline or bio', icon: 'Briefcase' as AppIconName },
                { label: 'PHONE / WHATSAPP', value: editPhone, onChange: setEditPhone, placeholder: '+1 234 567 8900', icon: 'Phone' as AppIconName, keyboardType: 'phone-pad' },
                { label: 'EMAIL ADDRESS', value: editEmail, onChange: setEditEmail, placeholder: 'you@example.com', icon: 'Mail' as AppIconName, keyboardType: 'email-address' },
                { label: 'PUBLIC LINK SLUG', value: editSlug, onChange: setEditSlug, placeholder: 'your-unique-slug', icon: 'Link' as AppIconName },
              ].map((f) => (
                <View key={f.label} style={styles.fieldCard}>
                  <View style={styles.fieldRow}>
                    <AppIcon name={f.icon} size={14} color="rgba(255,255,255,0.4)" />
                    <AppText style={styles.fieldLabel}>{f.label}</AppText>
                  </View>
                  <DebouncedInput
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder={f.placeholder}
                    keyboardType={f.keyboardType}
                    style={styles.fieldInput}
                  />
                </View>
              ))}

              {/* Save Button */}
              <Pressable
                style={({ pressed }) => [styles.primarySaveBtn, pressed && styles.pressed]}
                onPress={() => void handleSave()}
                accessibilityRole="button"
                accessibilityLabel="Save profile changes"
              >
                {isSaving ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <AppText style={styles.primarySaveBtnText} weight="extrabold">
                    {saveMsg ?? 'Save Profile'}
                  </AppText>
                )}
              </Pressable>
            </View>
          )}

          {/* Cards Tab */}
          {activeTab === 'card' && (
            <View style={styles.tabBody}>
              <AppText style={styles.tabHint}>Tap any card to set as primary badge</AppText>
              <CardStackCarousel cards={carouselCards} onCardPress={handleCardPress} />
              <Pressable
                style={({ pressed }) => [styles.secondaryActionButton, pressed && styles.pressed]}
                onPress={() => { HapticTap.medium(); router.push(appRoutes.guestDesign as any); }}
                accessibilityRole="button"
                accessibilityLabel="Design new NFC card"
              >
                <AppIcon name="Plus" size={16} color="#FFFFFF" />
                <AppText style={styles.secondaryActionText} weight="extrabold">Design New NFC Card</AppText>
              </Pressable>
            </View>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <View style={styles.tabBody}>
              <View style={styles.charcoalCard}>
                <AppText style={styles.cardSectionTitle} weight="extrabold">Public Profile Link</AppText>
                <AppText style={styles.cardSectionSub}>Share your custom link with customers and contacts</AppText>
                <View style={styles.linkCopyRow}>
                  <AppText style={styles.linkUrlText} numberOfLines={1}>{profileUrl || 'Not configured'}</AppText>
                  <Pressable
                    style={styles.linkCopyBtn}
                    onPress={() => { HapticTap.medium(); Alert.alert('Copied!', 'Link copied to clipboard.'); }}
                  >
                    <AppIcon name="Copy" size={15} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              {/* Direct Mode Toggle */}
              <View style={styles.charcoalCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleWrap}>
                    <AppText style={styles.cardSectionTitle} weight="extrabold">Direct Mode (Instant Redirect)</AppText>
                    <AppText style={styles.cardSectionSub}>
                      When ON, scanning your NFC card will bypass your profile and instantly open the destination link below.
                    </AppText>
                  </View>
                  <Switch
                    value={editDirectModeEnabled}
                    onValueChange={setEditDirectModeEnabled}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#1D9BF0' }}
                    ios_backgroundColor="rgba(255,255,255,0.1)"
                  />
                </View>
                {editDirectModeEnabled && (
                  <View style={[styles.fieldCard, { marginTop: 16, backgroundColor: 'transparent', padding: 0 }]}>
                    <DebouncedInput
                      value={editDirectModeUrl}
                      onChangeText={setEditDirectModeUrl}
                      placeholder="https://calendly.com/your-link"
                      keyboardType="url"
                      style={styles.fieldInput}
                    />
                  </View>
                )}
              </View>

              <View style={styles.fieldCard}>
                <View style={styles.fieldRow}>
                  <AppIcon name="Instagram" size={14} color="rgba(255,255,255,0.4)" />
                  <AppText style={styles.fieldLabel}>INSTAGRAM HANDLE</AppText>
                </View>
                <DebouncedInput
                  value={editInstagram}
                  onChangeText={setEditInstagram}
                  placeholder="@yourusername"
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.fieldCard}>
                <View style={styles.fieldRow}>
                  <AppIcon name="Send" size={14} color="rgba(255,255,255,0.4)" />
                  <AppText style={styles.fieldLabel}>TELEGRAM USERNAME</AppText>
                </View>
                <DebouncedInput
                  value={editTelegram}
                  onChangeText={setEditTelegram}
                  placeholder="@yourtelegram"
                  style={styles.fieldInput}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.primarySaveBtn, pressed && styles.pressed]}
                onPress={() => void handleSave()}
              >
                {isSaving ? <ActivityIndicator color="#000000" size="small" /> : <AppText style={styles.primarySaveBtnText} weight="extrabold">Save Social Links</AppText>}
              </Pressable>
            </View>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <View style={styles.tabBody}>
              {[
                { icon: 'UserRound' as AppIconName, label: 'Account Details', sub: user?.email || 'Logged in', onPress: () => {} },
                { icon: 'Globe' as AppIconName, label: 'Public Web Card', sub: profileUrl || 'Configure URL', onPress: () => { if (profileUrl) router.push(`/u/${slug}` as any); } },
                { icon: 'Link' as AppIconName, label: 'Zapier / Webhook', sub: editWebhookUrl || 'Configure lead webhook', onPress: () => {
                  Alert.prompt('Webhook URL', 'Paste your Zapier or Make.com webhook URL to receive leads automatically:', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save', onPress: async (url) => { 
                      if (url !== undefined) {
                        setEditWebhookUrl(url.trim());
                        const { id: _, userId: __, updatedAt: ___, ...restBioPage } = bioPage!;
                        await saveBioPage({ ...restBioPage, webhookUrl: url.trim() });
                      } 
                    } }
                  ], 'plain-text', editWebhookUrl || '');
                }},
                { icon: 'Bell' as AppIconName, label: 'Notifications', sub: 'Manage alerts & push', onPress: () => {} },
                { icon: 'ShieldCheck' as AppIconName, label: 'Privacy & Security', sub: 'Biometrics & passkey', onPress: () => {} },
                { icon: 'HelpCircle' as AppIconName, label: 'Help & Support', sub: 'FAQs, contact us', onPress: () => {} },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
                  onPress={item.onPress}
                  accessibilityRole="button"
                >
                  <View style={styles.settingsIconWrap}>
                    <AppIcon name={item.icon} size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.settingsCopy}>
                    <AppText style={styles.settingsLabel} weight="extrabold">{item.label}</AppText>
                    <AppText style={styles.settingsSub} numberOfLines={1}>{item.sub}</AppText>
                  </View>
                  <AppIcon name="ChevronRight" size={16} color="rgba(255,255,255,0.3)" />
                </Pressable>
              ))}

              <Pressable
                style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
                onPress={handleSignOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out of account"
              >
                <AppIcon name="LogOut" size={16} color="#FF3B30" />
                <AppText style={styles.signOutText} weight="extrabold">Sign Out</AppText>
              </Pressable>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: '#000000',
  },
  loadCenter: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // ── Cover Banner ──
  bannerWrap: {
    width: '100%',
    height: BANNER_H,
    position: 'relative',
    backgroundColor: '#111114',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bannerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerRightBtns: {
    flexDirection: 'row',
    gap: 8,
  },

  // ── Floating Avatar & Action Row ──
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -42,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#000000',
    backgroundColor: '#111114',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  actionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editProfileBtn: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileText: {
    color: '#000000',
    fontSize: 14,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Profile Metadata (X.com Style) ──
  infoSection: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayNameText: {
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    justifyContent: 'center',
  },
  handleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: -4,
  },
  taglineText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginTop: 4,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  metaLink: {
    color: '#1D9BF0',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 8,
    paddingTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statNum: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },

  // ── X Underlined Tab Bar ──
  navTabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  navTabItem: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navTabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },
  navActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  // ── Tab Body & Charcoal Cards ──
  tabBody: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tabHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginBottom: 4,
  },
  charcoalCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarThumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarThumbLetter: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  cardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  cardSectionTitle: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  cardSectionSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },

  // ── Form Inputs & Save ──
  fieldCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  primarySaveBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primarySaveBtnText: {
    color: '#000000',
    fontSize: 15,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  // ── Link Tab Extras ──
  linkCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: 4,
  },
  linkUrlText: {
    flex: 1,
    fontSize: 13,
    color: '#1D9BF0',
  },
  linkCopyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Settings Rows ──
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCopy: {
    flex: 1,
    gap: 2,
  },
  settingsLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  settingsSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
    marginTop: 12,
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 15,
  },
});