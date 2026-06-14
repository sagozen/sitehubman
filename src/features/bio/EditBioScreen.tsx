import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
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

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';
const BORDER = '#E9EDF3';

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
      style={[fr.row, last && fr.rowLast]}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  rowLast: { borderBottomWidth: 0 },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EBF7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelCol: { width: 86 },
  label: { fontSize: 13, fontWeight: '600', color: INK2 },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: INK,
    paddingVertical: 0,
    textAlign: 'right',
  },
});

// ─── Section group ────────────────────────────────────────────────────────────
function Group({ children }: { children: React.ReactNode }) {
  return <View style={grp.card}>{children}</View>;
}
const grp = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
});

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <AppText style={sl.text}>{text}</AppText>;
}
const sl = StyleSheet.create({
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
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
    setPhotoUrl(bioPage.photoUrl);
  }, [bioPage]);

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
        customLinks: bioPage?.customLinks ?? [],
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
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]} hitSlop={10}>
          <AppIcon name="ChevronLeft" size={22} color={INK2} />
        </Pressable>
        <AppText style={styles.headerTitle}>Edit Profile</AppText>
        <Pressable
          onPress={bioPage?.slug ? () => router.push(`/public/${bioPage.slug}`) : undefined}
          style={({ pressed }) => [styles.previewBtn, pressed && styles.pressed]}
          hitSlop={10}
        >
          <AppText style={styles.previewBtnT}>Preview</AppText>
        </Pressable>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <Pressable onPress={() => void pickImage(false)} style={styles.avatarWrap}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <AppText style={styles.avatarInitial}>{initial}</AppText>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <AppIcon name={isUploadingPhoto ? 'Loader' : 'Camera'} size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={styles.avatarMeta}>
            <AppText style={styles.avatarName}>{displayName || 'Your name'}</AppText>
            <AppText style={styles.avatarSub}>{tagline || 'Add a tagline'}</AppText>
          </View>
          <View style={styles.photoRow}>
            <Pressable onPress={() => void pickImage(false)} style={({ pressed }) => [styles.photoBtn, pressed && styles.pressed]} disabled={isUploadingPhoto}>
              <AppIcon name="Image" size={14} color={BRAND} />
              <AppText style={styles.photoBtnT}>Gallery</AppText>
            </Pressable>
            <Pressable onPress={() => void pickImage(true)} style={({ pressed }) => [styles.photoBtn, pressed && styles.pressed]} disabled={isUploadingPhoto}>
              <AppIcon name="ScanLine" size={14} color={INK2} />
              <AppText style={[styles.photoBtnT, { color: INK2 }]}>Camera</AppText>
            </Pressable>
          </View>
        </View>

        {/* ── Identity ── */}
        <SectionLabel text="Identity" />
        <Group>
          <FieldRow icon="User" label="Name" value={displayName} onChangeText={setDisplayName} placeholder="Sok Dara" autoCapitalize="words" />
          <FieldRow icon="Tag" label="Tagline" value={tagline} onChangeText={setTagline} placeholder="Coffee · Code · Khmer" />
          <FieldRow icon="Link" label="URL slug" value={slug} onChangeText={setSlug} placeholder="sokdara" autoCapitalize="none" last />
        </Group>

        {/* ── Contact ── */}
        <SectionLabel text="Contact" />
        <Group>
          <FieldRow icon="Mail" label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
          <FieldRow icon="Phone" label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="+855 12 345 678" keyboardType="phone-pad" />
          <FieldRow icon="Send" label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@yourhandle" autoCapitalize="none" />
          <FieldRow icon="Instagram" label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@yourhandle" autoCapitalize="none" last />
        </Group>

        {isGuest ? (
          <AppText style={styles.guestHint}>Guest preview — create an account to save changes.</AppText>
        ) : null}

        {/* ── Save button ── */}
        <Pressable
          onPress={() => void handleSave()}
          disabled={isSaving}
          style={({ pressed }) => [styles.saveBtn, isSaving && styles.saveBtnBusy, pressed && styles.pressed]}
        >
          {isSaving ? (
            <AppIcon name="Loader" size={18} color="#FFFFFF" />
          ) : (
            <AppIcon name="Check" size={18} color="#FFFFFF" />
          )}
          <AppText style={styles.saveBtnT}>{isSaving ? 'Saving…' : 'Save Profile'}</AppText>
        </Pressable>

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: BG,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  previewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: BRAND,
  },
  previewBtnT: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  pressed: { opacity: 0.72 },

  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120, gap: 12 },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: SURFACE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarFallback: {
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '900', color: '#FFFFFF' },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: INK2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BG,
  },
  avatarMeta: { alignItems: 'center', gap: 3 },
  avatarName: { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.3 },
  avatarSub: { fontSize: 12, fontWeight: '500', color: MUTED },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  photoBtnT: { fontSize: 13, fontWeight: '600', color: BRAND },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
    marginTop: 4,
  },
  saveBtnBusy: { opacity: 0.7 },
  saveBtnT: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },

  guestHint: { fontSize: 12, fontWeight: '500', color: MUTED, textAlign: 'center' },
});
