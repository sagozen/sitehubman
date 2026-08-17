/**
 * EditBioScreen — Apple Wallet × Nothing × Premium Fintech Edition.
 *
 * Architecture:
 *  - Solid black background (#000000)
 *  - Minimalist live phone identity preview (deep obsidian & frosted monochrome)
 *  - Clean borderless input rows separated by fine hairlines
 *  - High-contrast Apple-style save button
 *  - 130px bottom clearance for floating navigation dock
 */
import React, { useEffect, useRef, useState } from 'react';
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
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { uploadProfilePhoto } from '@/src/services/profilePhotoService';
import type { BioPage } from '@/src/types/models';
import { HapticTap } from '@/src/utils/haptics';

type CustomLinkDraft = BioPage['customLinks'][number];

// ─── Field Row (Borderless with hairline) ───────────────────────────────────
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
      style={[styles.fieldRow, last && styles.fieldRowLast]}
    >
      <View style={styles.fieldIconBox}>
        <AppIcon name={icon} size={16} color="rgba(255, 255, 255, 0.7)" />
      </View>
      <AppText style={styles.fieldLabel} weight="bold">{label}</AppText>
      <TextInput
        ref={inputRef}
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.3)"
        {...inputProps}
      />
    </Pressable>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <AppText style={styles.sectionLabel} weight="bold">
      {text}
    </AppText>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.fieldGroup}>{children}</View>;
}

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

  function updateCustomLink(index: number, next: Partial<CustomLinkDraft>) {
    setCustomLinks((links) => links.map((link, i) => (i === index ? { ...link, ...next } : link)));
  }

  function addCustomLink(label = '', url = '') {
    HapticTap.light();
    setCustomLinks((links) => [...links, { label, url }]);
  }

  function removeCustomLink(index: number) {
    HapticTap.light();
    setCustomLinks((links) => links.filter((_, i) => i !== index));
  }

  async function pickImage() {
    if (!requireAccount(undefined, { message: 'Create an account to upload a profile photo.' })) return;
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
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name is required.');
      return;
    }
    if (slug.trim() && !/^[a-z0-9-]{3,40}$/i.test(slug.trim())) {
      Alert.alert('Invalid slug', 'Use 3–40 letters, numbers, or hyphens.');
      return;
    }
    setIsSaving(true);
    HapticTap.medium();
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
        customLinks: customLinks.filter((l) => l.label.trim() && l.url.trim()),
        theme: bioPage?.theme ?? 'tech_noir',
        photoUrl,
      });
      Alert.alert('Saved', 'Your digital profile has been updated.');
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const initial = (displayName || user?.displayName || 'A')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.navBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
        </Pressable>

        <AppText style={styles.navTitle} weight="bold">
          Edit Bio Profile
        </AppText>

        <Pressable
          onPress={() => void handleSave()}
          disabled={isSaving}
          style={styles.doneBtn}
          hitSlop={10}
        >
          <AppText style={styles.doneBtnText} weight="extrabold">
            {isSaving ? 'Saving' : 'Save'}
          </AppText>
        </Pressable>
      </View>

      <IosScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Live Phone Identity Preview (Apple Wallet Style) ── */}
        <View style={styles.previewContainer}>
          <View style={styles.phoneFrame}>
            <View style={styles.phoneContent}>
              <Pressable onPress={() => void pickImage()} style={styles.avatarWrap}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <AppText style={styles.avatarInitial} weight="extrabold">{initial}</AppText>
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <AppIcon name={isUploadingPhoto ? 'Loader' : 'Camera'} size={12} color="#000000" />
                </View>
              </Pressable>

              <View style={styles.avatarMeta}>
                <AppText style={styles.avatarName} weight="extrabold">
                  {displayName || 'Alexander Wright'}
                </AppText>
                <AppText style={styles.avatarSub}>
                  {tagline || 'Founder & Managing Director · AVIO'}
                </AppText>
                <AppText style={styles.previewSlug}>
                  sitehubman.app/{slug.toLowerCase() || 'alexander'}
                </AppText>
              </View>

              {/* Dynamic Link Preview Pills */}
              <View style={styles.previewLinksContainer}>
                {customLinks.length > 0 ? (
                  customLinks.slice(0, 2).map((link, idx) => (
                    <View key={`prev-${idx}`} style={styles.previewLinkPill}>
                      <AppIcon name="Link" size={12} color="#FFFFFF" />
                      <AppText style={styles.previewLinkText} weight="bold" numberOfLines={1}>
                        {link.label || 'Digital Portfolio'}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <View style={styles.previewLinkPill}>
                    <AppIcon name="Send" size={12} color="#FFFFFF" />
                    <AppText style={styles.previewLinkText} weight="bold">Direct Message · Telegram</AppText>
                  </View>
                )}
              </View>
            </View>
          </View>

          <Pressable onPress={() => void pickImage()} style={styles.photoBtn}>
            <AppIcon name="Camera" size={14} color="#FFFFFF" />
            <AppText style={styles.photoBtnText} weight="bold">
              {photoUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}
            </AppText>
          </Pressable>
        </View>

        {/* ── 1. Identity Fields ── */}
        <SectionLabel text="IDENTITY" />
        <FieldGroup>
          <FieldRow
            icon="User"
            label="Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Alexander Wright"
            autoCapitalize="words"
          />
          <FieldRow
            icon="Tag"
            label="Tagline"
            value={tagline}
            onChangeText={setTagline}
            placeholder="Founder & Managing Director"
          />
          <FieldRow
            icon="Link"
            label="Bio URL"
            value={slug}
            onChangeText={setSlug}
            placeholder="alexander"
            autoCapitalize="none"
            last
          />
        </FieldGroup>

        {/* ── 2. Contact Fields ── */}
        <SectionLabel text="DIRECT CONTACT" />
        <FieldGroup>
          <FieldRow
            icon="Mail"
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="alexander@sitehub.app"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FieldRow
            icon="Phone"
            label="WhatsApp"
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="+1 555 019 2834"
            keyboardType="phone-pad"
          />
          <FieldRow
            icon="Globe"
            label="Website"
            value={website}
            onChangeText={setWebsite}
            placeholder="sitehubman.app"
            keyboardType="url"
            autoCapitalize="none"
            last
          />
        </FieldGroup>

        {/* ── 3. Social Channels ── */}
        <SectionLabel text="SOCIAL NETWORKS" />
        <FieldGroup>
          <FieldRow
            icon="Send"
            label="Telegram"
            value={telegram}
            onChangeText={setTelegram}
            placeholder="@alexander_tg"
            autoCapitalize="none"
          />
          <FieldRow
            icon="Instagram"
            label="Instagram"
            value={instagram}
            onChangeText={setInstagram}
            placeholder="@alexander_ig"
            autoCapitalize="none"
          />
          <FieldRow
            icon="Linkedin"
            label="LinkedIn"
            value={linkedin}
            onChangeText={setLinkedin}
            placeholder="alexander-wright"
            autoCapitalize="none"
            last
          />
        </FieldGroup>

        {/* ── 4. Quick Add Platform Chips ── */}
        <View style={styles.chipSection}>
          <AppText style={styles.sectionLabel} weight="bold">QUICK CHANNELS</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {[
              { label: 'Telegram Channel', url: 't.me/' },
              { label: 'LinkedIn Page', url: 'linkedin.com/in/' },
              { label: 'Instagram', url: 'instagram.com/' },
              { label: 'Portfolio URL', url: 'https://' },
            ].map((chip) => (
              <Pressable
                key={chip.label}
                onPress={() => addCustomLink(chip.label, chip.url)}
                style={styles.chipBtn}
              >
                <AppIcon name="Plus" size={13} color="#FFFFFF" />
                <AppText style={styles.chipText} weight="bold">{chip.label}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── 5. Custom Links List ── */}
        <View style={styles.sectionHeaderRow}>
          <SectionLabel text="CUSTOM LINKS" />
          <Pressable onPress={() => addCustomLink()} style={styles.addLinkBtn}>
            <AppText style={styles.addLinkText} weight="bold">+ Add Link</AppText>
          </Pressable>
        </View>

        {customLinks.length > 0 ? (
          <FieldGroup>
            {customLinks.map((link, index) => (
              <View
                key={`custom-link-${index}`}
                style={[
                  styles.customLinkBlock,
                  index === customLinks.length - 1 && styles.customLinkBlockLast,
                ]}
              >
                <View style={styles.customLinkTop}>
                  <AppText style={styles.customLinkTitle} weight="bold">Link #{index + 1}</AppText>
                  <Pressable onPress={() => removeCustomLink(index)} hitSlop={10}>
                    <AppIcon name="X" size={16} color="rgba(255, 255, 255, 0.45)" />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.customLinkInput}
                  value={link.label}
                  onChangeText={(value) => updateCustomLink(index, { label: value })}
                  placeholder="Link Title (e.g. Schedule Call, Company Deck)"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                />
                <TextInput
                  style={styles.customLinkInput}
                  value={link.url}
                  onChangeText={(value) => updateCustomLink(index, { url: value })}
                  placeholder="URL link (e.g. calendly.com/alexander)"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}
          </FieldGroup>
        ) : null}

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 130, // Clearance for floating capsule dock
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  doneBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  doneBtnText: {
    color: '#000000',
    fontSize: 13,
  },

  // ── Preview Container ──
  previewContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 14,
    marginVertical: 4,
  },
  phoneFrame: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    alignItems: 'center',
  },
  phoneContent: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    color: '#000000',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMeta: {
    alignItems: 'center',
    gap: 3,
  },
  avatarName: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  avatarSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
  previewSlug: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  previewLinksContainer: {
    width: '100%',
    gap: 6,
    marginTop: 4,
  },
  previewLinkPill: {
    width: '100%',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  previewLinkText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  photoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
  },

  // ── Sections & Fields ──
  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 10,
    marginLeft: 4,
  },
  fieldGroup: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    width: 80,
    color: '#FFFFFF',
    fontSize: 13,
  },
  fieldInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },

  // ── Chips ──
  chipSection: {
    gap: 8,
  },
  chipScroll: {
    gap: 8,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
  },

  // ── Custom Links ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  addLinkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  addLinkText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  customLinkBlock: {
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  customLinkBlockLast: {
    borderBottomWidth: 0,
  },
  customLinkTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customLinkTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  customLinkInput: {
    height: 40,
    borderRadius: 10,
    backgroundColor: '#16161A',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
});
