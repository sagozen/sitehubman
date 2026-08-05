/**
 * CustomerProfileScreen — Ultra-premium Chat OS style profile.
 *
 * Layout:
 *  1. Full-bleed hero photo with gradient overlay
 *  2. Bold name + handle + tagline overlaid on hero bottom
 *  3. Share Card + Edit Profile action pills
 *  4. 3-tab segment: Bio | Card | Settings
 *  5. Bio tab: editable fields with live save
 *  6. Card tab: NFC card carousel
 *  7. Settings tab: account rows + sign out
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
import { SEED_CARDS } from '@/src/data/seedCards';
import { HapticTap } from '@/src/utils/haptics';
import type { CarouselCard } from '@/src/components/CardStackCarousel';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = SCREEN_H * 0.52;

// ── Telegram-style gradient avatar colours ───────────────────────────────────
const TELEGRAM_GRADIENTS = [
  ['#FF512F', '#DD2476'],
  ['#4776E6', '#8E54E9'],
  ['#00B4DB', '#0083B0'],
  ['#11998E', '#38EF7D'],
  ['#FC4A1A', '#F7B733'],
  ['#8E2DE2', '#4A00E0'],
  ['#F857A6', '#FF5858'],
] as const;

function getTelegramColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TELEGRAM_GRADIENTS[Math.abs(hash) % TELEGRAM_GRADIENTS.length];
}

// ── Debounced text input ─────────────────────────────────────────────────────
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
  const { bioPage, saveBioPage } = useBioPage(user?.id ?? '');
  const { preferences, updatePreferences } = usePreferences();

  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'bio' | 'card' | 'settings'>('bio');

  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSlug, setEditSlug] = useState('');

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
    if (!user?.id) { setIsLoading(false); return; }
    loadCustomerCloudCard(user.id)
      .then(setCloudCard)
      .catch(() => setCloudCard(null))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const displayName = editName || bioPage?.displayName || user?.displayName || 'Creator';
  const tagline = editTitle || bioPage?.tagline || '';
  const slug = editSlug || bioPage?.slug || '';
  const photoUrl = bioPage?.photoUrl;
  const profileUrl = slug ? buildSlugProfileUrl(slug) : undefined;
  const initial = (displayName[0] || 'C').toUpperCase();

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
      await saveBioPage({ displayName: editName.trim() || 'My Profile', tagline: editTitle.trim(), whatsapp: editPhone.trim(), email: editEmail.trim(), slug: editSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') || `user-${Date.now()}`, customLinks: bioPage?.customLinks || [], theme: bioPage?.theme || 'ocean_wave', photoUrl: photoUrl || undefined });
      setSaveMsg('✓ Saved');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  }, [user, editName, editTitle, editPhone, editEmail, editSlug, bioPage, saveBioPage, photoUrl]);

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

        {/* ── 1. Full-bleed Hero ── */}
        <Pressable style={styles.heroWrap} onPress={pickImage} onLongPress={pickImage}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={getTelegramColors(displayName)}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroImg}
            />
          )}

          {/* Deep gradient scrim at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', '#000000']}
            locations={[0.3, 0.7, 1]}
            style={styles.heroScrim}
          />

          {/* Top bar: back + camera hint */}
          <SafeAreaView style={styles.heroTopBar} edges={['top']}>
            <Pressable style={styles.heroIconBtn} onPress={() => router.back()} hitSlop={12}>
              <AppIcon name="ChevronLeft" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.heroTopRight}>
              {isUploadingPhoto ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Pressable style={styles.heroIconBtn} onPress={pickImage} hitSlop={12}>
                  <AppIcon name="Camera" size={20} color="#FFFFFF" />
                </Pressable>
              )}
              <Pressable style={styles.heroIconBtn} onPress={() => { HapticTap.light(); router.push(appRoutes.guestDesign as any); }} hitSlop={12}>
                <AppIcon name="MoreHorizontal" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Name overlay at bottom of hero */}
          <View style={styles.heroNameBlock}>
            <AppText style={styles.heroName} weight="extrabold" numberOfLines={2}>
              {displayName}
            </AppText>
            {tagline ? (
              <AppText style={styles.heroTagline} numberOfLines={1}>
                {tagline}
              </AppText>
            ) : null}
            {slug ? (
              <AppText style={styles.heroSlug}>
                @{slug}
              </AppText>
            ) : null}
          </View>
        </Pressable>

        {/* ── 2. Action Pills ── */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.actionPillPrimary, pressed && styles.pressed]}
            onPress={() => { HapticTap.medium(); router.push('/(tabs)/share' as any); }}
          >
            <AppIcon name="Share" size={16} color="#000000" />
            <AppText style={styles.actionPillPrimaryText} weight="extrabold">Share Card</AppText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionPillSecondary, pressed && styles.pressed]}
            onPress={() => { HapticTap.medium(); router.push(appRoutes.guestDesign as any); }}
          >
            <AppIcon name="PenLine" size={16} color="#FFFFFF" />
            <AppText style={styles.actionPillSecondaryText} weight="extrabold">Edit Design</AppText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionPillIcon, pressed && styles.pressed]}
            onPress={() => { HapticTap.light(); if (profileUrl) router.push(`/u/${slug}` as any); }}
          >
            <AppIcon name="ExternalLink" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── 3. Segment Tabs ── */}
        <View style={styles.segmentWrap}>
          {(['bio', 'card', 'settings'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.segTab, activeTab === tab && styles.segTabActive]}
              onPress={() => { HapticTap.light(); setActiveTab(tab); }}
            >
              <AppText
                style={[styles.segTabText, activeTab === tab && styles.segTabTextActive]}
                weight={activeTab === tab ? 'extrabold' : 'regular'}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* ── 4. Bio Tab ── */}
        {activeTab === 'bio' && (
          <View style={styles.tabBody}>
            {/* Avatar picker row */}
            <Pressable style={styles.avatarRow} onPress={pickImage}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarThumb} />
              ) : (
                <LinearGradient
                  colors={getTelegramColors(displayName)}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.avatarThumb}
                >
                  <AppText style={styles.avatarInitial} weight="extrabold">{initial}</AppText>
                </LinearGradient>
              )}
              <View style={styles.avatarRowText}>
                <AppText style={styles.fieldLabel}>PROFILE PHOTO</AppText>
                <AppText style={styles.fieldSub}>Tap to change photo</AppText>
              </View>
              <AppIcon name="ChevronRight" size={18} color="rgba(255,255,255,0.3)" />
            </Pressable>

            {/* Editable fields */}
            {[
              { label: 'DISPLAY NAME', value: editName, onChange: setEditName, placeholder: 'Your full name', icon: 'UserRound' as AppIconName },
              { label: 'TITLE / TAGLINE', value: editTitle, onChange: setEditTitle, placeholder: 'e.g. Digital Creator', icon: 'Briefcase' as AppIconName },
              { label: 'PHONE / WHATSAPP', value: editPhone, onChange: setEditPhone, placeholder: '+1 234 567 8900', icon: 'Phone' as AppIconName, keyboardType: 'phone-pad' },
              { label: 'EMAIL', value: editEmail, onChange: setEditEmail, placeholder: 'you@example.com', icon: 'Mail' as AppIconName, keyboardType: 'email-address' },
              { label: 'PUBLIC LINK SLUG', value: editSlug, onChange: setEditSlug, placeholder: 'your-custom-url', icon: 'Link' as AppIconName },
            ].map((f) => (
              <View key={f.label} style={styles.fieldCard}>
                <View style={styles.fieldRow}>
                  <AppIcon name={f.icon} size={15} color="rgba(255,255,255,0.4)" />
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

            {/* Save button */}
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
              onPress={() => void handleSave()}
            >
              {isSaving ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <AppText style={styles.saveBtnText} weight="extrabold">
                  {saveMsg ?? 'Save Changes'}
                </AppText>
              )}
            </Pressable>
          </View>
        )}

        {/* ── 5. Card Tab ── */}
        {activeTab === 'card' && (
          <View style={styles.tabBody}>
            <AppText style={styles.tabHint}>Tap a card to set as primary</AppText>
            <CardStackCarousel cards={carouselCards} onCardPress={handleCardPress} />
            <Pressable
              style={({ pressed }) => [styles.newCardBtn, pressed && styles.pressed]}
              onPress={() => { HapticTap.medium(); router.push(appRoutes.guestDesign as any); }}
            >
              <AppIcon name="Plus" size={16} color="#FFFFFF" />
              <AppText style={styles.newCardBtnText} weight="extrabold">Design New Card</AppText>
            </Pressable>
          </View>
        )}

        {/* ── 6. Settings Tab ── */}
        {activeTab === 'settings' && (
          <View style={styles.tabBody}>
            {[
              { icon: 'UserRound' as AppIconName, label: 'Account Info', sub: user?.email || '—', onPress: () => {} },
              { icon: 'Globe' as AppIconName, label: 'Public Profile', sub: profileUrl || 'Not set up', onPress: () => { if (profileUrl) router.push(`/u/${slug}` as any); } },
              { icon: 'Bell' as AppIconName, label: 'Notifications', sub: 'Manage alerts', onPress: () => {} },
              { icon: 'ShieldCheck' as AppIconName, label: 'Security', sub: 'Biometrics, PIN', onPress: () => {} },
              { icon: 'HelpCircle' as AppIconName, label: 'Help & Support', sub: 'FAQs and contact', onPress: () => {} },
            ].map((item) => (
              <Pressable key={item.label} style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]} onPress={item.onPress}>
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
            >
              <AppIcon name="LogOut" size={16} color="#FF3B30" />
              <AppText style={styles.signOutText} weight="extrabold">Sign Out</AppText>
            </Pressable>
          </View>
        )}

        <View style={{ height: 120 }} />
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
  loadCenter: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  // ── Hero ──────────────────────────────────────────────────────
  heroWrap: {
    width: '100%',
    height: HERO_H,
    backgroundColor: '#111114',
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_H * 0.65,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroTopRight: {
    flexDirection: 'row',
    gap: 8,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNameBlock: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    gap: 4,
  },
  heroName: {
    fontSize: 36,
    lineHeight: 42,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },
  heroSlug: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },

  // ── Action row ────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  actionPillPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  actionPillPrimaryText: {
    color: '#000000',
    fontSize: 14,
  },
  actionPillSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionPillSecondaryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  actionPillIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Segment tabs ─────────────────────────────────────────────
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
    backgroundColor: '#111114',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  segTab: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segTabActive: {
    backgroundColor: '#FFFFFF',
  },
  segTabText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  segTabTextActive: {
    color: '#000000',
  },

  // ── Tab body ──────────────────────────────────────────────────
  tabBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  tabHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginBottom: 4,
  },

  // ── Bio fields ────────────────────────────────────────────────
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
  },
  avatarThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  avatarRowText: {
    flex: 1,
    gap: 2,
  },
  fieldCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    textTransform: 'uppercase',
  },
  fieldSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  fieldInput: {
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  saveBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 15,
  },

  // ── Card tab ─────────────────────────────────────────────────
  newCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  newCardBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  // ── Settings tab ──────────────────────────────────────────────
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
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
    height: 52,
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