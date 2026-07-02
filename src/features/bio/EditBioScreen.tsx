import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { uploadProfilePhoto } from '@/src/services/profilePhotoService';
import type { BioPage } from '@/src/types/models';
import { LinearGradient } from 'expo-linear-gradient';
import { StarsBoldDuotone, CopyBoldDuotone, AddCircleBoldDuotone } from '@solar-icons/react-native';

const BRAND = '#007AFF';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(60,60,67,0.08)';

type CustomLinkDraft = BioPage['customLinks'][number];

// ─── Field row — iOS Settings style ──────────────────────────────────────────
function FieldRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  last,
  ...inputProps
}: {
  icon: AppIconName;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  last?: boolean;
} & Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoCorrect' | 'secureTextEntry'>) {
  const inputRef = useRef<TextInput>(null);
  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={[fr.row, last && fr.rowLast] as ViewStyle[]}
    >
      <View style={fr.iconBox}>
        <AppIcon name={icon} size={16} color={BRAND} />
      </View>
      <View style={fr.labelCol}>
        <AppText style={fr.label}>{label}</AppText>
      </View>
      <TextInput
        ref={inputRef}
        style={fr.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C4CFDE"
        {...inputProps}
      />
    </Pressable>
  );
}

const fr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER } as ViewStyle,
  rowLast: { borderBottomWidth: 0 } as ViewStyle,
  iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,122,255,0.08)', alignItems: 'center', justifyStyle: 'center', justifyContent: 'center' } as ViewStyle,
  labelCol: { width: 90 } as ViewStyle,
  label: { fontSize: 14, fontWeight: '700', color: INK2 } as TextStyle,
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: INK, paddingVertical: 0, textAlign: 'right' } as TextStyle,
});

function Group({ children }: { children: React.ReactNode }) {
  return <View style={grp.card}>{children}</View>;
}
const grp = StyleSheet.create({
  card: { backgroundColor: SURFACE, borderRadius: 24, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 } as ViewStyle,
});

function SectionLabel({ text }: { text: string }) {
  return <AppText style={sl.text}>{text}</AppText>;
}
const sl = StyleSheet.create({
  text: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 4 } as TextStyle,
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export function EditBioScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { bioPage, saveBioPage } = useBioPage(user?.id ?? '');

  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [customLinks, setCustomLinks] = useState<CustomLinkDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!bioPage) return;
    setSlug(bioPage.slug ?? '');
    setDisplayName(bioPage.displayName ?? '');
    setTagline(bioPage.tagline ?? '');
    setWhatsapp(bioPage.whatsapp ?? '');
    setInstagram(bioPage.instagram ?? '');
    setTelegram(bioPage.telegram ?? '');
    setEmail(bioPage.email ?? '');
    setWebsite(bioPage.website ?? '');
    setLinkedin(bioPage.linkedin ?? '');
    setTwitter(bioPage.twitter ?? '');
    setFacebook(bioPage.facebook ?? '');
    setCustomLinks(bioPage.customLinks?.length ? bioPage.customLinks : []);
    setPhotoUrl(bioPage.photoUrl);
  }, [bioPage]);

  // Calculate current progress percentage
  const getCompletionPercent = () => {
    let score = 0;
    if (displayName.trim()) score += 25;
    if (photoUrl) score += 25;
    if (slug.trim()) score += 15;
    if (email.trim() || whatsapp.trim()) score += 15;
    if (telegram.trim() || instagram.trim() || linkedin.trim()) score += 10;
    if (customLinks.length > 0) score += 10;
    return score;
  };

  const pct = getCompletionPercent();

  function updateCustomLink(index: number, next: Partial<CustomLinkDraft>) {
    setCustomLinks((links) => links.map((link, i) => i === index ? { ...link, ...next } : link));
  }

  function addCustomLink(label = '', url = '') {
    setCustomLinks((links) => [...links, { label, url }]);
  }

  function removeCustomLink(index: number) {
    setCustomLinks((links) => links.filter((_, i) => i !== index));
  }

  async function pickImage(fromCamera: boolean) {
    if (!requireAccount(undefined, { message: 'Create an account to upload a profile photo.' })) return;
    if (!user?.id) return;
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', fromCamera ? 'Camera access required.' : 'Photo library access required.');
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      if (result.canceled || !result.assets[0]) return;
      setIsUploadingPhoto(true);
      try {
        const res = await uploadProfilePhoto({ uri: result.assets[0].uri, userId: user.id, fileName: result.assets[0].fileName, mimeType: result.assets[0].mimeType });
        setPhotoUrl(res.url);
      } catch (err) {
        Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again.');
      } finally {
        setIsUploadingPhoto(false);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not open picker.');
    }
  }

  async function handleSave() {
    if (!requireAccount(undefined, { message: 'Create an account to save your profile.' })) return;
    if (!displayName.trim()) { Alert.alert('Required', 'Display name is required.'); return; }
    if (slug.trim() && !/^[a-z0-9-]{3,40}$/i.test(slug.trim())) { Alert.alert('Invalid slug', 'Use 3–40 letters, numbers, or hyphens.'); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { Alert.alert('Invalid email', 'Enter a valid email.'); return; }
    setIsSaving(true);
    try {
      await saveBioPage({
        slug: slug.trim().toLowerCase() || (user?.id ?? ''),
        displayName: displayName.trim(),
        tagline: tagline.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        instagram: instagram.trim() || undefined,
        telegram: telegram.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        twitter: twitter.trim() || undefined,
        facebook: facebook.trim() || undefined,
        customLinks: customLinks.filter(l => l.label.trim() && l.url.trim()),
        theme: bioPage?.theme ?? 'vibrant_pink',
        photoUrl,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const initial = (displayName || user?.displayName || '?')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={10}>
            <AppIcon name="ChevronLeft" size={22} color={INK2} />
          </Pressable>
          <Pressable
            onPress={() => void handleSave()}
            disabled={isSaving}
            style={styles.navSaveBtn}
            hitSlop={10}
          >
            <AppText style={styles.navSaveText}>{isSaving ? 'Saving...' : 'Done'}</AppText>
          </Pressable>
        </View>
        <AppText style={styles.headerSub}>Customize what people see.</AppText>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Gen Z Interactive Progress Card */}
        <LinearGradient
          colors={['#1F2937', '#111827']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={styles.progHeader}>
            <StarsBoldDuotone size={24} color="#38BDF8" />
            <AppText style={styles.progTitle}>Profile Completion</AppText>
            <AppText style={styles.progPct}>{pct}%</AppText>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
          </View>
          <AppText style={styles.progHint}>
            {pct < 100 ? '🔥 Tip: Add a Profile Photo to reach 100% completion!' : '🎉 All set! Your bio is fully optimized.'}
          </AppText>
        </LinearGradient>

        {/* ── Gen Z Live Phone Screen Preview ── */}
        <View style={styles.previewContainer}>
          <View style={styles.phoneFrame}>
            <LinearGradient
              colors={['#7C3AED', '#C084FC', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Gloss shine filter */}
            <View style={styles.phoneShine} />
            
            <View style={styles.phoneContent}>
              <Pressable onPress={() => void pickImage(false)} style={styles.avatarWrap}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <AppText style={styles.avatarInitial}>{initial}</AppText>
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <AppIcon name={isUploadingPhoto ? 'Loader' : 'Camera'} size={12} color="#FFFFFF" />
                </View>
              </Pressable>
              
              <View style={styles.avatarMeta}>
                <AppText style={styles.avatarName}>{displayName || 'Your Display Name'}</AppText>
                <AppText style={styles.avatarSub}>{tagline || 'No tagline set yet'}</AppText>
                {slug ? (
                  <AppText style={styles.previewSlug}>sitehub.app/{slug.toLowerCase()}</AppText>
                ) : null}
              </View>

              {/* Dynamic custom link preview pills */}
              <View style={styles.previewLinksContainer}>
                {customLinks.length > 0 ? (
                  customLinks.slice(0, 3).map((link, idx) => (
                    <View key={`prev-${idx}`} style={styles.previewLinkPill}>
                      <AppIcon name="Link" size={12} color="#FFFFFF" />
                      <AppText style={styles.previewLinkText} numberOfLines={1}>
                        {link.label || 'Platform Link'}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <View style={styles.previewLinkPillPlaceholder}>
                    <AppText style={styles.previewPlaceholderT}>Add custom links below</AppText>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.previewActions}>
            <Pressable onPress={() => void pickImage(false)} style={styles.photoBtn} disabled={isUploadingPhoto}>
              <AppText style={styles.photoBtnT}>{photoUrl ? 'Change Avatar' : 'Upload Avatar'}</AppText>
            </Pressable>
            {bioPage?.slug ? (
              <Pressable onPress={() => router.push(`/public/${bioPage.slug}`)} style={styles.previewLink}>
                <AppText style={styles.previewLinkTextBtn}>View Live Profile</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ── Identity ── */}
        <SectionLabel text="IDENTITY" />
        <Group>
          <FieldRow icon="User" label="Name" value={displayName} onChangeText={setDisplayName} placeholder="Alex Carter" autoCapitalize="words" />
          <FieldRow icon="Tag" label="Tagline" value={tagline} onChangeText={setTagline} placeholder="Designer · Tech enthusiast" />
          <FieldRow icon="Link" label="URL slug" value={slug} onChangeText={setSlug} placeholder="alexcarter" autoCapitalize="none" last />
        </Group>

        {/* ── Contact ── */}
        <SectionLabel text="CONTACT" />
        <Group>
          <FieldRow icon="Mail" label="Email" value={email} onChangeText={setEmail} placeholder="alex@gmail.com" keyboardType="email-address" autoCapitalize="none" />
          <FieldRow icon="Phone" label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="+855 12 345 678" keyboardType="phone-pad" />
          <FieldRow icon="Globe" label="Website" value={website} onChangeText={setWebsite} placeholder="alexdesign.co" keyboardType="url" autoCapitalize="none" last />
        </Group>

        {/* ── Social Media ── */}
        <SectionLabel text="SOCIAL CHANNELS" />
        <Group>
          <FieldRow icon="Send" label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@alex_tg" autoCapitalize="none" />
          <FieldRow icon="Instagram" label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@alex_ig" autoCapitalize="none" />
          <FieldRow icon="Linkedin" label="LinkedIn" value={linkedin} onChangeText={setLinkedin} placeholder="alexprofile" autoCapitalize="none" last />
        </Group>

        {/* Gen Z Quick Add Platform Chips */}
        <View style={styles.chipSection}>
          <AppText style={styles.chipHeader}>⚡ GEN Z QUICK LINKS</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {[
              { label: 'TikTok', url: 'tiktok.com/@' },
              { label: 'Spotify', url: 'open.spotify.com/user/' },
              { label: 'YouTube', url: 'youtube.com/c/' },
              { label: 'BeReal', url: 'bere.al/' },
            ].map((chip) => (
              <Pressable
                key={chip.label}
                onPress={() => addCustomLink(chip.label, chip.url)}
                style={styles.chipBtn}
              >
                <AddCircleBoldDuotone size={16} color="#007AFF" />
                <AppText style={styles.chipText}>{chip.label}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Custom Links List ── */}
        <View style={styles.sectionHeaderRow}>
          <SectionLabel text="CUSTOM BIO LINKS" />
          <Pressable onPress={() => addCustomLink()} style={styles.addLinkBtn}>
            <AppText style={styles.addLinkText}>+ Add Link</AppText>
          </Pressable>
        </View>
        {customLinks.length > 0 ? (
          <Group>
            {customLinks.map((link, index) => (
              <View key={`custom-link-${index}`} style={[styles.customLinkBlock, index === customLinks.length - 1 && styles.customLinkBlockLast]}>
                <View style={styles.customLinkTop}>
                  <AppText style={styles.customLinkTitle}>Link #{index + 1}</AppText>
                  <Pressable onPress={() => removeCustomLink(index)} hitSlop={10}>
                    <AppIcon name="X" size={17} color="#FF3B30" />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.customLinkInput}
                  value={link.label}
                  onChangeText={(value) => updateCustomLink(index, { label: value })}
                  placeholder="Platform Name (e.g. TikTok, Portfolio)"
                  placeholderTextColor="#C4CFDE"
                />
                <TextInput
                  style={styles.customLinkInput}
                  value={link.url}
                  onChangeText={(value) => updateCustomLink(index, { url: value })}
                  placeholder="URL link (e.g. tiktok.com/@yourprofile)"
                  placeholderTextColor="#C4CFDE"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}
          </Group>
        ) : (
          <Pressable onPress={() => addCustomLink()} style={styles.emptyLinkCard}>
            <CopyBoldDuotone size={24} color="#007AFF" />
            <View style={styles.emptyLinkCopy}>
              <AppText style={styles.emptyLinkTitle}>Link Tree & Portfolio links</AppText>
              <AppText style={styles.emptyLinkSub}>Tap to connect TikTok, portfolio booking, shop, or music feeds.</AppText>
            </View>
          </Pressable>
        )}

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG } as ViewStyle,

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: BG } as ViewStyle,
  navRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 } as ViewStyle,
  navSaveBtn: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 } as ViewStyle,
  navSaveText: { fontSize: 17, fontWeight: '800', color: '#007AFF' } as TextStyle,
  largeTitle: { marginTop: 8, fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -0.6 } as TextStyle,
  headerSub: { marginTop: 4, fontSize: 14, fontWeight: '500', color: MUTED, lineHeight: 20 } as TextStyle,

  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 60, gap: 18 } as ViewStyle,

  // Gen Z interactive completion progress card
  progressCard: { padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 4 } as ViewStyle,
  progHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 } as ViewStyle,
  progTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 } as TextStyle,
  progPct: { fontSize: 20, fontWeight: '900', color: '#38BDF8' } as TextStyle,
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, marginVertical: 14, overflow: 'hidden' } as ViewStyle,
  progressBarFill: { height: '100%', backgroundColor: '#38BDF8', borderRadius: 99 } as ViewStyle,
  progHint: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' } as TextStyle,

  // Gen Z Live Phone Screen Mockup Container
  previewContainer: { padding: 18, borderRadius: 28, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 2, alignItems: 'center', gap: 16 } as ViewStyle,
  phoneFrame: { width: '100%', minHeight: 280, borderRadius: 24, overflow: 'hidden', borderValues: 3, borderColor: '#1F2937', position: 'relative', shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 } as ViewStyle,
  phoneShine: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.06)', transform: [{ skewX: '-30deg' }, { scaleX: 1.5 }] } as ViewStyle,
  phoneContent: { flex: 1, alignItems: 'center', padding: 24, gap: 14, justifyContent: 'center' } as ViewStyle,
  previewSlug: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5, marginTop: 4 } as TextStyle,
  previewLinksContainer: { width: '100%', gap: 8, marginTop: 8 } as ViewStyle,
  previewLinkPill: { width: '100%', height: 38, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16 } as ViewStyle,
  previewLinkText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' } as TextStyle,
  previewLinkPillPlaceholder: { width: '100%', height: 38, borderRadius: 999, borderStyle: 'dashed', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  previewPlaceholderT: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' } as TextStyle,

  // Avatar styles inside phone
  avatarWrap: { position: 'relative' } as ViewStyle,
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: SURFACE, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 } as any,
  avatarFallback: { backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  avatarInitial: { fontSize: 32, fontWeight: '900', color: '#FFFFFF' } as TextStyle,
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: INK2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#7C3AED' } as ViewStyle,
  avatarMeta: { alignItems: 'center', gap: 2 } as ViewStyle,
  avatarName: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 } as TextStyle,
  avatarSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textAlign: 'center' } as TextStyle,
  
  // Actions under preview
  previewActions: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'center' } as ViewStyle,
  photoBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(0,122,255,0.08)' } as ViewStyle,
  photoBtnT: { fontSize: 13, fontWeight: '800', color: BRAND } as TextStyle,
  previewLink: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' } as ViewStyle,
  previewLinkTextBtn: { fontSize: 13, fontWeight: '800', color: INK2 } as TextStyle,

  chipSection: { gap: 10 } as ViewStyle,
  chipHeader: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8 } as TextStyle,
  chipScroll: { gap: 8 } as ViewStyle,
  chipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' } as ViewStyle,
  chipText: { fontSize: 12, fontWeight: '800', color: INK2 } as TextStyle,

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 } as ViewStyle,
  addLinkBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,122,255,0.08)' } as ViewStyle,
  addLinkText: { fontSize: 12, fontWeight: '800', color: BRAND } as TextStyle,

  customLinkBlock: { padding: 16, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER } as ViewStyle,
  customLinkBlockLast: { borderBottomWidth: 0 } as ViewStyle,
  customLinkTop: { flexDirection: 'row', alignItems: 'center', justifyStyle: 'space-between', justifyContent: 'space-between' } as ViewStyle,
  customLinkTitle: { fontSize: 13, fontWeight: '800', color: INK2 } as TextStyle,
  customLinkInput: { minHeight: 44, borderRadius: 12, backgroundColor: '#F3F4F6', paddingHorizontal: 14, fontSize: 14, fontWeight: '600', color: INK } as TextStyle,

  emptyLinkCard: { minHeight: 76, borderRadius: 24, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 } as ViewStyle,
  emptyLinkCopy: { flex: 1, gap: 2 } as ViewStyle,
  emptyLinkTitle: { fontSize: 15, fontWeight: '800', color: INK2, letterSpacing: -0.2 } as TextStyle,
  emptyLinkSub: { fontSize: 12, fontWeight: '600', color: MUTED, lineHeight: 17 } as TextStyle,
});
