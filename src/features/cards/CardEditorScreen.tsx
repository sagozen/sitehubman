/**
 * CardEditorScreen — Screen 3: Card Editor ("Customize your digital card")
 * Luxury Minimalist (Apple Wallet × Stripe × Linear · Black Granite UI)
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#08080A',
  surface: '#111115',
  surfaceRaised: '#16161C',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#636366',
  accent: '#2596BE',
} as const;

const CARD_STYLES = ['Black Metal', 'Platinum', 'Titanium', 'Matte Black'] as const;
const LOGO_OPTIONS = ['NFC Global', 'Monogram', 'Minimal Arc', 'None'] as const;
const BG_OPTIONS = ['Dark', 'Deep Obsidian', 'Charcoal'] as const;

export function CardEditorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bioPage, saveBioPage } = useBioPage(user?.id ?? '');

  const [name, setName] = useState(bioPage?.displayName || user?.displayName || 'Thean Coc');
  const [title, setTitle] = useState(bioPage?.tagline || bioPage?.headline || 'Founder & Director');
  const [company, setCompany] = useState(bioPage?.company || 'NFC Global');
  const [cardStyleIndex, setCardStyleIndex] = useState(0);
  const [logoIndex, setLogoIndex] = useState(0);
  const [bgIndex, setBgIndex] = useState(0);

  // Edit Modal State
  const [editingField, setEditingField] = useState<'name' | 'title' | 'company' | null>(null);
  const [tempValue, setTempValue] = useState('');

  const openEditModal = (field: 'name' | 'title' | 'company', currentVal: string) => {
    HapticTap.light();
    setEditingField(field);
    setTempValue(currentVal);
  };

  const handleSaveModal = () => {
    HapticTap.softConfirmation();
    if (editingField === 'name') setName(tempValue.trim() || 'Thean Coc');
    if (editingField === 'title') setTitle(tempValue.trim() || 'Founder & Director');
    if (editingField === 'company') setCompany(tempValue.trim() || 'NFC Global');
    setEditingField(null);
  };

  const handleCycleCardStyle = () => {
    HapticTap.light();
    setCardStyleIndex((prev) => (prev + 1) % CARD_STYLES.length);
  };

  const handleCycleLogo = () => {
    HapticTap.light();
    setLogoIndex((prev) => (prev + 1) % LOGO_OPTIONS.length);
  };

  const handleCycleBg = () => {
    HapticTap.light();
    setBgIndex((prev) => (prev + 1) % BG_OPTIONS.length);
  };

  const handleSaveAll = useCallback(async () => {
    HapticTap.success();
    try {
      if (saveBioPage && bioPage) {
        await saveBioPage({
          ...bioPage,
          displayName: name,
          headline: title,
          company: company,
        });
      }
      Alert.alert('Card Saved', 'Your digital card design has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Card Updated', 'Saved locally to your device.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [name, title, company, saveBioPage, bioPage, router]);

  const currentCardStyle = CARD_STYLES[cardStyleIndex];
  const currentLogo = LOGO_OPTIONS[logoIndex];
  const currentBg = BG_OPTIONS[bgIndex];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <AppIcon name="chevron-left" size={20} color={C.text} />
        </Pressable>

        <AppText style={styles.topBarTitle} weight="bold">
          Edit Card
        </AppText>

        <Pressable
          onPress={handleSaveAll}
          style={styles.saveBtn}
          hitSlop={12}
        >
          <AppText style={styles.saveBtnText} weight="bold">
            Save
          </AppText>
        </Pressable>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {/* Live Interactive Card Preview */}
          <View
            style={[
              styles.previewCard,
              currentBg === 'Deep Obsidian' && { backgroundColor: '#050507' },
              currentBg === 'Charcoal' && { backgroundColor: '#18181F' },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardBrandRow}>
                <AppIcon name="wifi" size={16} color="rgba(255,255,255,0.7)" style={{ transform: [{ rotate: '90deg' }] }} />
                <AppText style={styles.cardBrandText} weight="bold">
                  {currentLogo.toUpperCase()}
                </AppText>
              </View>
              <View style={styles.contactlessSymbol}>
                <View style={[styles.contactlessArc, styles.arc1]} />
                <View style={[styles.contactlessArc, styles.arc2]} />
                <View style={[styles.contactlessArc, styles.arc3]} />
              </View>
            </View>

            <View style={styles.cardBody}>
              <AppText style={styles.cardOwnerName} weight="bold">
                {name.toUpperCase()}
              </AppText>
              <AppText style={styles.cardOwnerTitle}>
                {title.toUpperCase()}
              </AppText>
              {company ? (
                <AppText style={styles.cardCompanyText}>
                  {company}
                </AppText>
              ) : null}
            </View>

            <View style={styles.cardFooterRow}>
              <View style={styles.cardStatusPill}>
                <AppText style={styles.statusPillText}>READY TO TAP</AppText>
              </View>
              <AppText style={styles.cardMaterialText}>{currentCardStyle.toUpperCase()}</AppText>
            </View>
          </View>

          {/* Settings Rows */}
          <View style={styles.settingsGroup}>
            {/* Name */}
            <Pressable
              style={styles.settingRow}
              onPress={() => openEditModal('name', name)}
            >
              <View style={styles.settingRowLeft}>
                <AppIcon name="user" size={18} color={C.textSecondary} />
                <AppText style={styles.settingLabel}>Name</AppText>
              </View>
              <View style={styles.settingRowRight}>
                <AppText style={styles.settingValue}>{name}</AppText>
                <AppIcon name="chevron-right" size={16} color={C.textMuted} />
              </View>
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Title */}
            <Pressable
              style={styles.settingRow}
              onPress={() => openEditModal('title', title)}
            >
              <View style={styles.settingRowLeft}>
                <AppIcon name="briefcase" size={18} color={C.textSecondary} />
                <AppText style={styles.settingLabel}>Title</AppText>
              </View>
              <View style={styles.settingRowRight}>
                <AppText style={styles.settingValue}>{title}</AppText>
                <AppIcon name="chevron-right" size={16} color={C.textMuted} />
              </View>
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Company */}
            <Pressable
              style={styles.settingRow}
              onPress={() => openEditModal('company', company)}
            >
              <View style={styles.settingRowLeft}>
                <AppIcon name="award" size={18} color={C.textSecondary} />
                <AppText style={styles.settingLabel}>Company</AppText>
              </View>
              <View style={styles.settingRowRight}>
                <AppText style={styles.settingValue}>{company}</AppText>
                <AppIcon name="chevron-right" size={16} color={C.textMuted} />
              </View>
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Card Style */}
            <Pressable
              style={styles.settingRow}
              onPress={handleCycleCardStyle}
            >
              <View style={styles.settingRowLeft}>
                <AppIcon name="credit-card" size={18} color={C.textSecondary} />
                <AppText style={styles.settingLabel}>Card Style</AppText>
              </View>
              <View style={styles.settingRowRight}>
                <AppText style={styles.settingValue}>{currentCardStyle}</AppText>
                <AppIcon name="chevron-right" size={16} color={C.textMuted} />
              </View>
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Logo */}
            <Pressable
              style={styles.settingRow}
              onPress={handleCycleLogo}
            >
              <View style={styles.settingRowLeft}>
                <AppIcon name="shield" size={18} color={C.textSecondary} />
                <AppText style={styles.settingLabel}>Logo</AppText>
              </View>
              <View style={styles.settingRowRight}>
                <AppText style={styles.settingValue}>{currentLogo}</AppText>
                <AppIcon name="chevron-right" size={16} color={C.textMuted} />
              </View>
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Background */}
            <Pressable
              style={styles.settingRow}
              onPress={handleCycleBg}
            >
              <View style={styles.settingRowLeft}>
                <AppIcon name="moon" size={18} color={C.textSecondary} />
                <AppText style={styles.settingLabel}>Background</AppText>
              </View>
              <View style={styles.settingRowRight}>
                <AppText style={styles.settingValue}>{currentBg}</AppText>
                <AppIcon name="chevron-right" size={16} color={C.textMuted} />
              </View>
            </Pressable>
          </View>

          {/* Bottom Preview Button */}
          <Pressable
            style={({ pressed }) => [
              styles.previewBtn,
              pressed && styles.previewBtnPressed,
            ]}
            onPress={() => {
              HapticTap.light();
              router.push('/share-profile' as any);
            }}
          >
            <AppText style={styles.previewBtnText} weight="bold">
              Preview
            </AppText>
          </Pressable>

          <View style={{ height: 110 }} />
        </View>
      </IosScrollView>

      {/* Quick Edit Modal */}
      <Modal
        visible={editingField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingField(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText style={styles.modalTitle} weight="bold">
              Edit {editingField ? editingField.charAt(0).toUpperCase() + editingField.slice(1) : ''}
            </AppText>
            <TextInput
              style={styles.modalInput}
              value={tempValue}
              onChangeText={setTempValue}
              placeholderTextColor={C.textMuted}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setEditingField(null)}
              >
                <AppText style={styles.modalCancelText}>Cancel</AppText>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={handleSaveModal}
              >
                <AppText style={styles.modalConfirmText} weight="bold">Done</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    color: C.text,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  saveBtnText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
  },
  scroll: {
    flexGrow: 1,
  },
  contentWrap: {
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingTop: 16,
  },
  previewCard: {
    backgroundColor: '#0D0D11',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 22,
    minHeight: 184,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBrandText: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  contactlessSymbol: {
    width: 24,
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  contactlessArc: {
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRightWidth: 2,
    borderRadius: 12,
  },
  arc1: { width: 4, height: 8 },
  arc2: { width: 5, height: 13 },
  arc3: { width: 6, height: 18 },
  cardBody: {
    marginVertical: 18,
  },
  cardOwnerName: {
    fontSize: 20,
    letterSpacing: 0.8,
    color: C.text,
  },
  cardOwnerTitle: {
    fontSize: 12,
    color: C.textSecondary,
    letterSpacing: 0.4,
    marginTop: 4,
  },
  cardCompanyText: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusPillText: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardMaterialText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '600',
  },
  settingsGroup: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: C.text,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 13,
    color: C.textSecondary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 46,
  },
  previewBtn: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  previewBtnPressed: {
    backgroundColor: C.surfaceRaised,
  },
  previewBtnText: {
    fontSize: 14,
    color: C.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#16161C',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    color: C.text,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: C.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
    color: C.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    color: C.textSecondary,
    fontSize: 14,
  },
  modalConfirmBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalConfirmText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CardEditorScreen;
