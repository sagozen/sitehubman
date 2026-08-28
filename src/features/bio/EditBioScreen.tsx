/**
 * EditBioScreen.tsx — Ban Nguyen Business Specification Bio Profile Editor.
 *
 * Full implementation of Ban Nguyen's exact business specifications:
 *  1. Danh tính (Identity): Printed Name, Handle/Slug, Multilingual Job Titles (VI/EN), Organization, Positioning Lines (VI/EN), Email, Photo, Logo.
 *  2. Trang tap (Tap Page Content): Hero Titles (VI/EN), Hero Org, VI/EN Language Toggle switch, Primary Action (Icon, VI/EN Labels, VI/EN Sublines, Link), 3 Action Blocks with up to 4 items each.
 *  3. Khối tin cậy (Trust Footnote): Owner Line (VI/EN), Trust Note (VI/EN).
 *  4. Giao diện trang tap (Appearance Settings): Color Palette, Light/Dark Mode, Border Radius, Hero Style, Card Style, Avatar Style.
 *  5. "Khôi phục nội dung mẫu": Reset to Ban Nguyen sample seed preset.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type TextInputProps,
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
import type { BioPage, TapActionBlock, TapActionItem } from '@/src/types/models';
import { BAN_NGUYEN_SEED_BIO } from '@/src/data/seedBanNguyenBio';
import { HapticTap } from '@/src/utils/haptics';

// ─── Field Row Component ───────────────────────────────────────────────────
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

function SectionLabel({ text, sub }: { text: string; sub?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionLabel} weight="extrabold">{text}</AppText>
      {sub ? <AppText style={styles.sectionSub}>{sub}</AppText> : null}
    </View>
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

  // Section 1: Identity
  const [displayName, setDisplayName] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [slug, setSlug] = useState('');
  const [jobTitleVi, setJobTitleVi] = useState('');
  const [jobTitleEn, setJobTitleEn] = useState('');
  const [organization, setOrganization] = useState('');
  const [positioningLineVi, setPositioningLineVi] = useState('');
  const [positioningLineEn, setPositioningLineEn] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  // Section 2: Tap Page Content
  const [heroTitleVi, setHeroTitleVi] = useState('');
  const [heroTitleEn, setHeroTitleEn] = useState('');
  const [heroOrg, setHeroOrg] = useState('');
  const [showLanguageToggle, setShowLanguageToggle] = useState(true);

  // Primary Action
  const [primaryActionIcon, setPrimaryActionIcon] = useState('file-text');
  const [primaryActionLabelVi, setPrimaryActionLabelVi] = useState('');
  const [primaryActionLabelEn, setPrimaryActionLabelEn] = useState('');
  const [primaryActionSubVi, setPrimaryActionSubVi] = useState('');
  const [primaryActionSubEn, setPrimaryActionSubEn] = useState('');
  const [primaryActionUrl, setPrimaryActionUrl] = useState('');

  // Action Blocks (Up to 3 blocks)
  const [actionBlocks, setActionBlocks] = useState<TapActionBlock[]>([]);

  // Section 3: Trust Block
  const [ownerLineVi, setOwnerLineVi] = useState('');
  const [ownerLineEn, setOwnerLineEn] = useState('');
  const [trustNoteVi, setTrustNoteVi] = useState('');
  const [trustNoteEn, setTrustNoteEn] = useState('');

  // Section 4: Theme Settings
  const [colorPalette, setColorPalette] = useState('Professional');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');
  const [borderRadiusStyle, setBorderRadiusStyle] = useState<'balanced' | 'rounded' | 'sharp'>('balanced');
  const [heroStyle, setHeroStyle] = useState<'gradient' | 'solid' | 'minimal'>('gradient');
  const [cardStyle, setCardStyle] = useState<'bordered' | 'solid' | 'glass'>('bordered');
  const [avatarStyle, setAvatarStyle] = useState<'circle' | 'square' | 'hexagon'>('circle');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Load existing bio data or load seed defaults
  useEffect(() => {
    const data = bioPage ?? (BAN_NGUYEN_SEED_BIO as BioPage);
    setDisplayName(data.displayName ?? 'Ban Nguyen');
    setPrintedName(data.printedName ?? data.displayName ?? 'Ban Nguyen');
    setSlug(data.slug ?? 'pandev00');
    setJobTitleVi(data.jobTitleVi ?? 'Tech Lead · AI Coaching 1-1');
    setJobTitleEn(data.jobTitleEn ?? 'Tech Lead · 1-1 AI Coaching');
    setOrganization(data.organization ?? data.company ?? 'SAGOZEN LLC');
    setPositioningLineVi(data.positioningLineVi ?? data.tagline ?? 'AI Coaching 1-1 — làm phần mềm bài bản');
    setPositioningLineEn(data.positioningLineEn ?? '1-1 AI Coaching — build software properly');
    setEmail(data.email ?? 'pandev00@sagozen.digital');
    setPhotoUrl(data.photoUrl);
    setLogoUrl(data.logoUrl);

    setHeroTitleVi(data.heroTitleVi ?? data.jobTitleVi ?? 'Tech Lead · AI Coaching 1-1');
    setHeroTitleEn(data.heroTitleEn ?? data.jobTitleEn ?? 'Tech Lead · 1-1 AI Coaching');
    setHeroOrg(data.heroOrg ?? data.organization ?? 'SAGOZEN LLC');
    setShowLanguageToggle(data.showLanguageToggle ?? true);

    setPrimaryActionIcon(data.primaryActionIcon ?? 'file-text');
    setPrimaryActionLabelVi(data.primaryActionLabelVi ?? 'Xem khoá AI Coaching 1-1');
    setPrimaryActionLabelEn(data.primaryActionLabelEn ?? 'See the 1-1 AI Coaching programme');
    setPrimaryActionSubVi(data.primaryActionSubVi ?? 'Lộ trình 9 bước · học phí theo đợt');
    setPrimaryActionSubEn(data.primaryActionSubEn ?? 'Nine stages · paid in stages');
    setPrimaryActionUrl(data.primaryActionUrl ?? 'https://t.me/pandev00');

    setActionBlocks(data.actionBlocks?.length ? data.actionBlocks : BAN_NGUYEN_SEED_BIO.actionBlocks ?? []);

    setOwnerLineVi(data.ownerLineVi ?? 'Nội dung do Ban Nguyen cung cấp.');
    setOwnerLineEn(data.ownerLineEn ?? 'Content provided by Ban Nguyen.');
    setTrustNoteVi(data.trustNoteVi ?? 'Avio lưu trữ trang này và không xác minh danh tính.');
    setTrustNoteEn(data.trustNoteEn ?? 'Avio hosts this page and does not verify identity.');

    setColorPalette(data.colorPalette ?? 'Professional');
    setColorMode(data.colorMode ?? 'dark');
    setBorderRadiusStyle(data.borderRadiusStyle ?? 'balanced');
    setHeroStyle(data.heroStyle ?? 'gradient');
    setCardStyle(data.cardStyle ?? 'bordered');
    setAvatarStyle(data.avatarStyle ?? 'circle');
  }, [bioPage]);

  // Seed Reset Helper
  function handleLoadSeedPreset() {
    HapticTap.medium();
    const seed = BAN_NGUYEN_SEED_BIO;
    setDisplayName(seed.displayName ?? '');
    setPrintedName(seed.printedName ?? '');
    setSlug(seed.slug ?? '');
    setJobTitleVi(seed.jobTitleVi ?? '');
    setJobTitleEn(seed.jobTitleEn ?? '');
    setOrganization(seed.organization ?? '');
    setPositioningLineVi(seed.positioningLineVi ?? '');
    setPositioningLineEn(seed.positioningLineEn ?? '');
    setEmail(seed.email ?? '');
    setPhotoUrl(seed.photoUrl);

    setHeroTitleVi(seed.heroTitleVi ?? '');
    setHeroTitleEn(seed.heroTitleEn ?? '');
    setHeroOrg(seed.heroOrg ?? '');
    setShowLanguageToggle(seed.showLanguageToggle ?? true);

    setPrimaryActionIcon(seed.primaryActionIcon ?? 'file-text');
    setPrimaryActionLabelVi(seed.primaryActionLabelVi ?? '');
    setPrimaryActionLabelEn(seed.primaryActionLabelEn ?? '');
    setPrimaryActionSubVi(seed.primaryActionSubVi ?? '');
    setPrimaryActionSubEn(seed.primaryActionSubEn ?? '');
    setPrimaryActionUrl(seed.primaryActionUrl ?? '');

    setActionBlocks(seed.actionBlocks ?? []);

    setOwnerLineVi(seed.ownerLineVi ?? '');
    setOwnerLineEn(seed.ownerLineEn ?? '');
    setTrustNoteVi(seed.trustNoteVi ?? '');
    setTrustNoteEn(seed.trustNoteEn ?? '');

    setColorPalette(seed.colorPalette ?? 'Professional');
    setColorMode(seed.colorMode ?? 'dark');
    setBorderRadiusStyle(seed.borderRadiusStyle ?? 'balanced');
    setHeroStyle(seed.heroStyle ?? 'gradient');
    setCardStyle(seed.cardStyle ?? 'bordered');
    setAvatarStyle(seed.avatarStyle ?? 'circle');
    Alert.alert('Khôi phục thành công', 'Đã tải dữ liệu mẫu của Ban Nguyen.');
  }

  // Helper for Action Blocks
  function updateBlockTitle(bIndex: number, vi: string, en: string) {
    setActionBlocks((blocks) =>
      blocks.map((b, i) => (i === bIndex ? { ...b, titleVi: vi, titleEn: en } : b))
    );
  }

  function addActionBlock() {
    if (actionBlocks.length >= 3) {
      Alert.alert('Giới hạn', 'Tối đa 3 khối hành động.');
      return;
    }
    HapticTap.light();
    setActionBlocks((blocks) => [
      ...blocks,
      { id: `block-${Date.now()}`, titleVi: 'Khối hành động mới', titleEn: 'New Action Block', items: [] },
    ]);
  }

  function removeActionBlock(bIndex: number) {
    HapticTap.light();
    setActionBlocks((blocks) => blocks.filter((_, i) => i !== bIndex));
  }

  function updateActionItem(bIndex: number, iIndex: number, next: Partial<TapActionItem>) {
    setActionBlocks((blocks) =>
      blocks.map((b, bi) => {
        if (bi !== bIndex) return b;
        const nextItems = b.items.map((item, ii) => (ii === iIndex ? { ...item, ...next } : item));
        return { ...b, items: nextItems };
      })
    );
  }

  function addActionItem(bIndex: number) {
    const block = actionBlocks[bIndex];
    if (block && block.items.length >= 4) {
      Alert.alert('Giới hạn', 'Tối đa 4 mục mỗi khối.');
      return;
    }
    HapticTap.light();
    setActionBlocks((blocks) =>
      blocks.map((b, i) => {
        if (i !== bIndex) return b;
        return {
          ...b,
          items: [
            ...b.items,
            {
              id: `item-${Date.now()}`,
              icon: 'link',
              labelVi: 'Mục mới',
              labelEn: 'New Item',
              subVi: '',
              subEn: '',
              url: 'https://',
            },
          ],
        };
      })
    );
  }

  function removeActionItem(bIndex: number, iIndex: number) {
    HapticTap.light();
    setActionBlocks((blocks) =>
      blocks.map((b, bi) => {
        if (bi !== bIndex) return b;
        return { ...b, items: b.items.filter((_, ii) => ii !== iIndex) };
      })
    );
  }

  async function pickImage() {
    if (!requireAccount(undefined, { message: 'Tạo tài khoản để tải ảnh chân dung.' })) return;
    if (!user?.id) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Cần cấp quyền', 'Quyền truy cập thư viện ảnh bị từ chối.');
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
        Alert.alert('Tải lên thất bại', err instanceof Error ? err.message : 'Thử lại.');
      } finally {
        setIsUploadingPhoto(false);
      }
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không mở được ảnh.');
    }
  }

  async function handleSave() {
    if (!requireAccount(undefined, { message: 'Tạo tài khoản để lưu thông tin trang.' })) return;
    if (!displayName.trim()) {
      Alert.alert('Yêu cầu', 'Vui lòng nhập tên hiển thị.');
      return;
    }
    setIsSaving(true);
    HapticTap.medium();
    try {
      await saveBioPage({
        displayName: displayName.trim(),
        printedName: printedName.trim() || displayName.trim(),
        slug: slug.trim().toLowerCase() || 'pandev00',
        publicSlug: slug.trim().toLowerCase() || 'pandev00',
        jobTitleVi: jobTitleVi.trim(),
        jobTitleEn: jobTitleEn.trim(),
        organization: organization.trim(),
        company: organization.trim(),
        positioningLineVi: positioningLineVi.trim(),
        positioningLineEn: positioningLineEn.trim(),
        tagline: positioningLineVi.trim() || jobTitleVi.trim(),
        email: email.trim(),
        photoUrl,
        logoUrl,

        heroTitleVi: heroTitleVi.trim() || jobTitleVi.trim(),
        heroTitleEn: heroTitleEn.trim() || jobTitleEn.trim(),
        heroOrg: heroOrg.trim() || organization.trim(),
        showLanguageToggle,

        primaryActionIcon: primaryActionIcon.trim(),
        primaryActionLabelVi: primaryActionLabelVi.trim(),
        primaryActionLabelEn: primaryActionLabelEn.trim(),
        primaryActionSubVi: primaryActionSubVi.trim(),
        primaryActionSubEn: primaryActionSubEn.trim(),
        primaryActionUrl: primaryActionUrl.trim(),

        actionBlocks,

        ownerLineVi: ownerLineVi.trim(),
        ownerLineEn: ownerLineEn.trim(),
        trustNoteVi: trustNoteVi.trim(),
        trustNoteEn: trustNoteEn.trim(),

        colorPalette,
        colorMode,
        borderRadiusStyle,
        heroStyle,
        cardStyle,
        avatarStyle,

        theme: 'tech_noir',
        customLinks: [],
      });
      Alert.alert('Thành công', 'Đã lưu thông tin trang danh tính thành công.');
    } catch (err) {
      Alert.alert('Lưu thất bại', (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const initial = (displayName || 'B')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.navBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
        </Pressable>

        <AppText style={styles.navTitle} weight="bold">
          Chỉnh sửa thông tin
        </AppText>

        <Pressable
          onPress={() => void handleSave()}
          disabled={isSaving}
          style={styles.doneBtn}
          hitSlop={10}
        >
          <AppText style={styles.doneBtnText} weight="extrabold">
            {isSaving ? 'Lưu...' : 'Lưu'}
          </AppText>
        </Pressable>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Live Identity Card Preview */}
        <View style={styles.previewCard}>
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

          <View style={styles.previewMeta}>
            <AppText style={styles.previewName} weight="extrabold">
              {displayName || 'Ban Nguyen'}
            </AppText>
            <AppText style={styles.previewSub}>
              {jobTitleVi || 'Tech Lead · AI Coaching 1-1'}
            </AppText>
            <AppText style={styles.previewOrg}>
              {organization || 'SAGOZEN LLC'}
            </AppText>
            <AppText style={styles.previewSlug}>
              sitehubman.app/{slug || 'pandev00'}
            </AppText>
          </View>
        </View>

        {/* ── 1. Danh tính (Identity) ── */}
        <SectionLabel
          text="DANH TÍNH"
          sub="Đọc bởi cả ba mặt. Sửa ở đây là sửa mọi nơi."
        />
        <FieldGroup>
          <FieldRow
            icon="User"
            label="Tên in trên thẻ*"
            value={displayName}
            onChangeText={(t) => {
              setDisplayName(t);
              setPrintedName(t);
            }}
            placeholder="Ban Nguyen"
            autoCapitalize="words"
          />
          <FieldRow
            icon="Tag"
            label="Handle / Slug"
            value={slug}
            onChangeText={setSlug}
            placeholder="pandev00"
            autoCapitalize="none"
          />
          <FieldRow
            icon="Briefcase"
            label="Chức danh (VI)*"
            value={jobTitleVi}
            onChangeText={setJobTitleVi}
            placeholder="Tech Lead · AI Coaching 1-1"
          />
          <FieldRow
            icon="Briefcase"
            label="Chức danh (EN)*"
            value={jobTitleEn}
            onChangeText={setJobTitleEn}
            placeholder="Tech Lead · 1-1 AI Coaching"
          />
          <FieldRow
            icon="Globe"
            label="Tổ chức"
            value={organization}
            onChangeText={setOrganization}
            placeholder="SAGOZEN LLC"
          />
          <FieldRow
            icon="Award"
            label="Dòng định vị (VI)"
            value={positioningLineVi}
            onChangeText={setPositioningLineVi}
            placeholder="AI Coaching 1-1 — làm phần mềm bài bản"
          />
          <FieldRow
            icon="Award"
            label="Dòng định vị (EN)"
            value={positioningLineEn}
            onChangeText={setPositioningLineEn}
            placeholder="1-1 AI Coaching — build software properly"
          />
          <FieldRow
            icon="Mail"
            label="Email*"
            value={email}
            onChangeText={setEmail}
            placeholder="pandev00@sagozen.digital"
            keyboardType="email-address"
            autoCapitalize="none"
            last
          />
        </FieldGroup>

        {/* ── 2. Trang Tap (Tap Page Setup) ── */}
        <SectionLabel
          text="TRANG TAP"
          sub="Một hành động chính, tối đa 3 khối, mỗi khối tối đa 4 hành động."
        />
        <FieldGroup>
          <FieldRow
            icon="Briefcase"
            label="Hero Title (VI)*"
            value={heroTitleVi}
            onChangeText={setHeroTitleVi}
            placeholder="Tech Lead · AI Coaching 1-1"
          />
          <FieldRow
            icon="Briefcase"
            label="Hero Title (EN)"
            value={heroTitleEn}
            onChangeText={setHeroTitleEn}
            placeholder="Tech Lead · 1-1 AI Coaching"
          />
          <FieldRow
            icon="Globe"
            label="Hero Organization"
            value={heroOrg}
            onChangeText={setHeroOrg}
            placeholder="SAGOZEN LLC"
            last
          />
        </FieldGroup>

        {/* Language Toggle Switch */}
        <View style={styles.switchRow}>
          <AppText style={styles.switchLabel} weight="bold">Hiện nút chuyển ngôn ngữ VI / EN</AppText>
          <Switch
            value={showLanguageToggle}
            onValueChange={setShowLanguageToggle}
            trackColor={{ false: '#333', true: '#FFFFFF' }}
            thumbColor={showLanguageToggle ? '#000000' : '#888'}
          />
        </View>

        {/* Primary Action Box */}
        <AppText style={styles.subSectionTitle} weight="extrabold">HÀNH ĐỘNG CHÍNH</AppText>
        <FieldGroup>
          <FieldRow
            icon="FileText"
            label="Biểu tượng (Lucide)"
            value={primaryActionIcon}
            onChangeText={setPrimaryActionIcon}
            placeholder="file-text"
          />
          <FieldRow
            icon="Sparkles"
            label="Hành động (VI)*"
            value={primaryActionLabelVi}
            onChangeText={setPrimaryActionLabelVi}
            placeholder="Xem khoá AI Coaching 1-1"
          />
          <FieldRow
            icon="Sparkles"
            label="Hành động (EN)*"
            value={primaryActionLabelEn}
            onChangeText={setPrimaryActionLabelEn}
            placeholder="See the 1-1 AI Coaching programme"
          />
          <FieldRow
            icon="AlignLeft"
            label="Dòng phụ (VI)"
            value={primaryActionSubVi}
            onChangeText={setPrimaryActionSubVi}
            placeholder="Lộ trình 9 bước · học phí theo đợt"
          />
          <FieldRow
            icon="AlignLeft"
            label="Dòng phụ (EN)"
            value={primaryActionSubEn}
            onChangeText={setPrimaryActionSubEn}
            placeholder="Nine stages · paid in stages"
          />
          <FieldRow
            icon="Link"
            label="Liên kết (URL)*"
            value={primaryActionUrl}
            onChangeText={setPrimaryActionUrl}
            placeholder="https://t.me/pandev00"
            last
          />
        </FieldGroup>

        {/* ── Action Blocks (Khối hành động) ── */}
        <View style={styles.blocksHeader}>
          <AppText style={styles.subSectionTitle} weight="extrabold">
            KHỐI HÀNH ĐỘNG ({actionBlocks.length} / 3)
          </AppText>
          {actionBlocks.length < 3 && (
            <Pressable onPress={addActionBlock} style={styles.addBlockBtn}>
              <AppIcon name="Plus" size={14} color="#FFFFFF" />
              <AppText style={styles.addBlockBtnText} weight="bold">Thêm khối</AppText>
            </Pressable>
          )}
        </View>

        {actionBlocks.map((block, bIndex) => (
          <View key={block.id || `block-${bIndex}`} style={styles.blockCard}>
            <View style={styles.blockCardHeader}>
              <AppText style={styles.blockCardTitle} weight="extrabold">
                Khối {bIndex + 1}: {block.titleVi || 'Chưa đặt tên'}
              </AppText>
              <Pressable onPress={() => removeActionBlock(bIndex)} hitSlop={10}>
                <AppIcon name="Trash2" size={16} color="#FF3B30" />
              </Pressable>
            </View>

            <FieldGroup>
              <FieldRow
                icon="Type"
                label="Tiêu đề (VI)"
                value={block.titleVi}
                onChangeText={(t) => updateBlockTitle(bIndex, t, block.titleEn)}
                placeholder="Tư vấn qua kênh bạn quen"
              />
              <FieldRow
                icon="Type"
                label="Tiêu đề (EN)"
                value={block.titleEn}
                onChangeText={(t) => updateBlockTitle(bIndex, block.titleVi, t)}
                placeholder="Talk on your usual channel"
                last
              />
            </FieldGroup>

            {/* Items inside Block */}
            <View style={styles.itemsHeader}>
              <AppText style={styles.itemsTitle} weight="bold">
                Mục ({block.items.length} / 4)
              </AppText>
              {block.items.length < 4 && (
                <Pressable onPress={() => addActionItem(bIndex)} style={styles.addItemBtn}>
                  <AppIcon name="Plus" size={12} color="#FFFFFF" />
                  <AppText style={styles.addItemBtnText} weight="bold">Thêm mục</AppText>
                </Pressable>
              )}
            </View>

            {block.items.map((item, iIndex) => (
              <View key={item.id || `item-${iIndex}`} style={styles.itemBox}>
                <View style={styles.itemBoxHeader}>
                  <AppText style={styles.itemBoxTitle} weight="bold">
                    #{iIndex + 1} - {item.labelVi || 'Mục'}
                  </AppText>
                  <Pressable onPress={() => removeActionItem(bIndex, iIndex)} hitSlop={8}>
                    <AppIcon name="X" size={14} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                <FieldGroup>
                  <FieldRow
                    icon="Smile"
                    label="Icon (Lucide)"
                    value={item.icon}
                    onChangeText={(t) => updateActionItem(bIndex, iIndex, { icon: t })}
                    placeholder="send"
                  />
                  <FieldRow
                    icon="Tag"
                    label="Nhãn (VI)"
                    value={item.labelVi}
                    onChangeText={(t) => updateActionItem(bIndex, iIndex, { labelVi: t })}
                    placeholder="Telegram"
                  />
                  <FieldRow
                    icon="Tag"
                    label="Nhãn (EN)"
                    value={item.labelEn}
                    onChangeText={(t) => updateActionItem(bIndex, iIndex, { labelEn: t })}
                    placeholder="Telegram"
                  />
                  <FieldRow
                    icon="AlignLeft"
                    label="Dòng phụ (VI)"
                    value={item.subVi || ''}
                    onChangeText={(t) => updateActionItem(bIndex, iIndex, { subVi: t })}
                    placeholder="@pandev00"
                  />
                  <FieldRow
                    icon="Link"
                    label="Liên kết"
                    value={item.url}
                    onChangeText={(t) => updateActionItem(bIndex, iIndex, { url: t })}
                    placeholder="https://t.me/pandev00"
                    last
                  />
                </FieldGroup>
              </View>
            ))}
          </View>
        ))}

        {/* ── 3. Khối tin cậy (Trust Footnote) ── */}
        <SectionLabel
          text="KHỐI TIN CẬY"
          sub="Hiển thị ở chân trang danh tính."
        />
        <FieldGroup>
          <FieldRow
            icon="ShieldCheck"
            label="Chủ sở hữu (VI)"
            value={ownerLineVi}
            onChangeText={setOwnerLineVi}
            placeholder="Nội dung do Ban Nguyen cung cấp."
          />
          <FieldRow
            icon="ShieldCheck"
            label="Chủ sở hữu (EN)"
            value={ownerLineEn}
            onChangeText={setOwnerLineEn}
            placeholder="Content provided by Ban Nguyen."
          />
          <FieldRow
            icon="Info"
            label="Ghi chú tin cậy (VI)"
            value={trustNoteVi}
            onChangeText={setTrustNoteVi}
            placeholder="Avio lưu trữ trang này và không xác minh danh tính."
          />
          <FieldRow
            icon="Info"
            label="Ghi chú tin cậy (EN)"
            value={trustNoteEn}
            onChangeText={setTrustNoteEn}
            placeholder="Avio hosts this page and does not verify identity."
            last
          />
        </FieldGroup>

        {/* ── 4. Giao diện trang tap (Appearance) ── */}
        <SectionLabel
          text="GIAO DIỆN TRANG TAP"
          sub="Cấu trúc, kích thước vùng chạm và khối tin cậy không đổi được."
        />
        <View style={styles.themeOptionsGrid}>
          <View style={styles.themeOptionRow}>
            <AppText style={styles.themeOptionLabel} weight="bold">Bộ màu</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
              {['Professional', 'Charcoal', 'Gold', 'Titanium', 'Emerald'].map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setColorPalette(p)}
                  style={[styles.pillBtn, colorPalette === p && styles.pillBtnActive]}
                >
                  <AppText style={[styles.pillBtnText, colorPalette === p && styles.pillBtnTextActive]} weight="bold">
                    {p}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.themeOptionRow}>
            <AppText style={styles.themeOptionLabel} weight="bold">Sáng / Tối</AppText>
            <View style={styles.segmentedRow}>
              {(['dark', 'light'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setColorMode(mode)}
                  style={[styles.segmentBtn, colorMode === mode && styles.segmentBtnActive]}
                >
                  <AppText style={[styles.segmentText, colorMode === mode && styles.segmentTextActive]} weight="bold">
                    {mode === 'dark' ? 'Tối (Dark)' : 'Sáng (Light)'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.themeOptionRow}>
            <AppText style={styles.themeOptionLabel} weight="bold">Bo góc</AppText>
            <View style={styles.segmentedRow}>
              {(['balanced', 'rounded', 'sharp'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setBorderRadiusStyle(r)}
                  style={[styles.segmentBtn, borderRadiusStyle === r && styles.segmentBtnActive]}
                >
                  <AppText style={[styles.segmentText, borderRadiusStyle === r && styles.segmentTextActive]} weight="bold">
                    {r === 'balanced' ? 'Cân bằng' : r === 'rounded' ? 'Tròn' : 'Vuông'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Restore Sample Preset Button */}
        <Pressable onPress={handleLoadSeedPreset} style={styles.resetSeedBtn}>
          <AppIcon name="RotateCcw" size={16} color="#FFFFFF" />
          <AppText style={styles.resetSeedBtnText} weight="extrabold">
            Khôi phục nội dung mẫu (Ban Nguyen)
          </AppText>
        </Pressable>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  doneBtnText: {
    color: '#000000',
    fontSize: 13,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 140,
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#000000',
    fontSize: 24,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111114',
  },
  previewMeta: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  previewSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  previewOrg: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  previewSlug: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 4,
  },
  sectionHeader: {
    gap: 2,
    marginTop: 8,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  sectionSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
  subSectionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 6,
  },
  fieldGroup: {
    backgroundColor: '#111114',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldIconBox: {
    width: 24,
    alignItems: 'center',
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    width: 115,
  },
  fieldInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111114',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  switchLabel: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  blocksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  addBlockBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  blockCard: {
    backgroundColor: '#0D0D10',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    gap: 10,
  },
  blockCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemsTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  addItemBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  itemBox: {
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  itemBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemBoxTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  themeOptionsGrid: {
    gap: 12,
  },
  themeOptionRow: {
    gap: 6,
  },
  themeOptionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  pillsScroll: {
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  pillBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  pillBtnTextActive: {
    color: '#000000',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  segmentTextActive: {
    color: '#000000',
  },
  resetSeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginTop: 12,
  },
  resetSeedBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
});
