import { IosScrollView } from '@/src/components/IosScrollView';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTap } from '@/src/utils/haptics';
import { MotionScale } from '@/src/utils/motion';
import { usePerformanceMonitor } from '@/src/utils/performanceMonitor';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { LinearGradient } from 'expo-linear-gradient';
import {
  formatFooterDualPrice,
  getEcardPriceUsd,
  getPhysicalPriceUsd,
} from '@/src/constants/cardProducts';
import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';
import { CAMBODIA_PAYMENT_METHODS } from '@/src/constants/cambodiaPayments';
import { useAuth } from '@/src/hooks/useAuth';
import type { ProductType } from '@/src/constants/options';
import type { CardDesign } from '@/src/types/models';
import {
  loadGuestCardDraft,
  saveGuestCardDraft,
  saveGuestCheckoutDraft,
} from '@/src/services/guestDraftService';
import { syncGuestCardDraft } from '@/src/services/guestCardDraftService';
import { useDebounceCallback } from '@/src/hooks/useDebounceCallback';
import React, { useCallback, useEffect, useState, useRef } from 'react';

// ─── Gen Z Bento Neon Tokens ──────────────────────────────────────────────────
const BRAND = '#9D4EDD';     // Cyber Neon Purple
const BRAND_CYAN = '#00F0FF'; // Cyber Neon Cyan
const INK = '#FFFFFF';       // High Contrast White
const INK2 = '#9CA3AF';      // Cool Gray
const MUTED = '#6B7280';     // Muted Gray
const BG = '#030305';        // Void Black
const SURFACE = 'rgba(255, 255, 255, 0.05)'; // Deep Glass
const SURFACE_ACTIVE = 'rgba(255, 255, 255, 0.15)'; // Active Glass
const BORDER = 'rgba(255, 255, 255, 0.08)';  // Subtle Glass Edge

// ─── Performance Optimized Glass Field ──────────────────────────────────────
function FieldRow({
  icon,
  value,
  onChange,
  placeholder,
  ...inputProps
}: {
  icon: AppIconName;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
} & Pick<React.ComponentProps<typeof TextInput>, 'keyboardType' | 'autoCapitalize'>) {
  const ref = useRef<TextInput>(null);

  const debouncedOnChange = useDebounceCallback((text: string) => {
    onChange(text);
  }, 300);

  return (
    <Pressable
      onPress={() => { HapticTap.light(); ref.current?.focus(); }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={({ pressed }) => [
        fi.row,
        pressed && fi.rowPressed
      ] as ViewStyle[]}
    >
      <AppIcon name={icon} size={20} color={BRAND_CYAN} />
      <TextInput
        ref={ref}
        style={fi.input}
        defaultValue={value}
        onChangeText={debouncedOnChange}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        accessibilityLabel={placeholder}
        {...inputProps}
      />
    </Pressable>
  );
}

const fi = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    minHeight: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    overflow: 'hidden'
  } as ViewStyle,
  rowPressed: {
    transform: [{ scale: MotionScale.pressed }],
    borderColor: 'rgba(0, 240, 255, 0.3)'
  } as ViewStyle,
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: INK,
    padding: 0,
    fontFamily: 'Inter_800ExtraBold'
  } as TextStyle,
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function GuestDesignScreen() {
  const { width: sw } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { measure } = usePerformanceMonitor();

  const [name, setName]       = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [phone, setPhone]     = useState(user?.phone ?? '');
  const [telegram, setTelegram] = useState('');

  const [cardType, setCardType]   = useState<'virtual' | 'physical'>('virtual');
  const [styleIdx, setStyleIdx]   = useState(0);
  const [product, setProduct]     = useState<ProductType>('pvc_card');
  const [cardDesign, setCardDesign] = useState<CardDesign>('classic_black');

  const [paymentMethod, setPaymentMethod] = useState<CambodiaPaymentMethodId | null>(null);

  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cardWidth = Math.min(sw - 48, 340);
  const cardHeight = cardWidth / 1.586;

  const priceUsd = cardType === 'virtual' ? getEcardPriceUsd() : getPhysicalPriceUsd(product);
  const infoComplete = name.trim().length > 0 && (phone.trim() || email.trim());

  useEffect(() => {
    void measure('Load Guest Card Draft', async () => {
      await loadGuestCardDraft().then((d) => {
        if (d) {
          setName(d.displayName || '');
          setJobTitle(d.jobTitle || '');
          setCompany(d.company || '');
          setEmail(d.email || user?.email || '');
          setPhone(d.phone || user?.phone || '');
          setTelegram(d.telegram ?? '');
          setCardType(d.cardChoice === 'physical' ? 'physical' : 'virtual');
          if (d.product) setProduct(d.product);
          setCardDesign(d.cardDesign ?? 'classic_black');
          setStyleIdx(d.gradientIndex ?? 0);
        }
      }).finally(() => setLoadingDraft(false));
    });
  }, [user?.email, user?.phone, measure]);

  const handleSave = useCallback(async () => {
    if (!infoComplete) return;

    await measure('Save Guest Card Design', async () => {
      HapticTap.light();
      setSaving(true);
      setSaveError(null);

      try {
        const draft = {
          displayName: name.trim(),
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim(),
          telegram: telegram.trim() || undefined,
          product,
          cardDesign,
          cardChoice: (cardType === 'physical' ? 'physical' : 'ecard') as 'physical' | 'ecard',
          gradientIndex: styleIdx,
          customImageUri: null,
          designBackground: 'gradient' as const,
        };
        const savedAt = new Date().toISOString();

        await Promise.all([
          saveGuestCardDraft(draft),
          syncGuestCardDraft({ ...draft, savedAt }),
          saveGuestCheckoutDraft({
            cardChoice: cardType === 'physical' ? 'physical' : 'ecard',
            product,
            quantity: 1,
            displayName: name.trim(),
            phone: phone.trim(),
            currency: 'KHR',
            paymentMethod: paymentMethod ?? undefined,
          })
        ]);

        HapticTap.success();
        router.back();
      } catch (error) {
        console.error('Save failed:', error);
        setSaveError('Failed to save. Check your connection.');
        HapticTap.error();
      } finally {
        setSaving(false);
      }
    });
  }, [infoComplete, name, jobTitle, company, email, phone, telegram, product, cardDesign, cardType, styleIdx, paymentMethod, measure]);

  if (loadingDraft) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={BRAND_CYAN} size="large" />
      </View>
    );
  }

  const paymentMethods = CAMBODIA_PAYMENT_METHODS.slice(0, cardType === 'physical' ? 7 : 6);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <LinearGradient
          colors={['rgba(157,78,221,0.15)', 'rgba(0,240,255,0.05)', BG]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => { HapticTap.light(); router.back(); }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AppIcon name="ChevronLeft" size={22} color={INK} />
          </Pressable>
          <AppText style={styles.headerTitle}>STUDIO</AppText>
          <View style={styles.pricePill}>
            <LinearGradient
              colors={[BRAND, BRAND_CYAN]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <AppText style={styles.priceT}>{formatFooterDualPrice(priceUsd)}</AppText>
          </View>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* ── Gen Z Neon Card Stage ── */}
          <View style={styles.previewStage}>
            <View style={styles.glowBackdrop} />
            <View style={styles.previewWrap}>
              <NfcGlobalCardFace
                fullName={name || 'Your Name'}
                title={jobTitle || 'Verified Member'}
                company={company || 'NFC Global'}
                email={email || 'hello@nfcglobal.co'}
                phone={phone || undefined}
                width={cardWidth}
                height={cardHeight}
              />
            </View>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <AppText style={styles.previewHint}>LIVE PREVIEW</AppText>
            </View>
          </View>

          {/* ── Bento Form Grid ── */}
          <View style={styles.sectionsContainer}>
            
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>IDENTITY</AppText>
              <View style={styles.bentoGrid}>
                <FieldRow
                  icon="User"
                  value={name}
                  onChange={setName}
                  placeholder="Full Name *"
                  autoCapitalize="words"
                />
                <FieldRow
                  icon="Phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Phone *"
                  keyboardType="phone-pad"
                />
                <FieldRow
                  icon="Mail"
                  value={email}
                  onChange={setEmail}
                  placeholder="Email *"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>FORMAT</AppText>
              <View style={styles.bentoGridHorizontal}>
                {(['virtual', 'physical'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => { setCardType(t); HapticTap.light(); }}
                    style={({ pressed }) => [
                      styles.segBtn,
                      { backgroundColor: cardType === t ? SURFACE_ACTIVE : SURFACE },
                      pressed && styles.pressed
                    ]}
                  >
                    <AppText style={[styles.segBtnT, cardType === t && styles.segBtnTActive]}>
                      {t === 'virtual' ? 'E-CARD' : 'PHYSICAL'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>CHECKOUT</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payScroll}>
                {paymentMethods.map((pm) => (
                  <Pressable
                    key={pm.id}
                    onPress={() => { setPaymentMethod(pm.id); HapticTap.light(); }}
                    style={({ pressed }) => [
                      styles.payPill,
                      { backgroundColor: paymentMethod === pm.id ? SURFACE_ACTIVE : SURFACE },
                      pressed && styles.pressed
                    ]}
                  >
                    <AppText style={[styles.payPillT, paymentMethod === pm.id && styles.payPillTActive]}>
                      {pm.labelEn.replace('Pay with ', '').toUpperCase()}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

          </View>
        </IosScrollView>

        {/* ── Immersive Neon Footer ── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          
          {saveError && (
            <View style={styles.errorBanner}>
              <AppText style={styles.errorText}>{saveError}</AppText>
              <Pressable onPress={() => setSaveError(null)}>
                <AppText style={styles.errorDismiss}>DISMISS</AppText>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => void handleSave()}
            disabled={saving || !infoComplete}
            style={({ pressed }) => [
              styles.saveBtn,
              (!infoComplete || saving) && styles.saveBtnOff,
              pressed && infoComplete && !saving && styles.pressed,
            ]}
          >
            {(!infoComplete || saving) ? null : (
              <LinearGradient
                colors={[BRAND, BRAND_CYAN]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            
            {saving ? (
              <ActivityIndicator color={INK} size="small" />
            ) : (
              <AppText style={styles.saveBtnT}>
                {cardType === 'physical' ? 'ORDER METAL CARD' : 'ACTIVATE DIGITAL CARD'}
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG } as ViewStyle,
  flex: { flex: 1 } as ViewStyle,
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG } as ViewStyle,
  pressed: { transform: [{ scale: MotionScale.pressed }] } as ViewStyle,

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 } as ViewStyle,
  backBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE } as ViewStyle,
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: INK, letterSpacing: 2, fontFamily: 'Inter_900Black', textAlign: 'center' } as TextStyle,
  pricePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, overflow: 'hidden' } as ViewStyle,
  priceT: { fontSize: 13, fontWeight: '900', color: INK, fontFamily: 'Inter_900Black' } as TextStyle,

  scroll: { paddingBottom: 60, paddingTop: 10 } as ViewStyle,

  previewStage: { alignItems: 'center', position: 'relative', paddingVertical: 24, paddingHorizontal: 20 } as ViewStyle,
  glowBackdrop: {
    position: 'absolute',
    width: '80%',
    height: '60%',
    backgroundColor: BRAND_CYAN,
    opacity: 0.15,
    borderRadius: 999,
    top: '20%',
    filter: 'blur(40px)',
  } as ViewStyle,
  previewWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  } as ViewStyle,
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 } as ViewStyle,
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND_CYAN, shadowColor: BRAND_CYAN, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } } as ViewStyle,
  previewHint: { fontSize: 11, fontWeight: '900', color: BRAND_CYAN, letterSpacing: 1.5, fontFamily: 'Inter_900Black' } as TextStyle,

  sectionsContainer: { paddingHorizontal: 20, paddingTop: 10, gap: 40 } as ViewStyle,
  section: { gap: 16 } as ViewStyle,
  sectionTitle: { fontSize: 14, fontWeight: '900', color: INK2, letterSpacing: 3, fontFamily: 'Inter_900Black' } as TextStyle,
  
  bentoGrid: { gap: 12 } as ViewStyle,
  bentoGridHorizontal: { flexDirection: 'row', gap: 12 } as ViewStyle,

  segBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: BORDER } as ViewStyle,
  segBtnActive: { borderColor: BRAND_CYAN } as ViewStyle,
  segBtnT: { fontSize: 14, fontWeight: '900', color: MUTED, fontFamily: 'Inter_900Black', letterSpacing: 1 } as TextStyle,
  segBtnTActive: { color: BRAND_CYAN } as TextStyle,

  payScroll: { gap: 12, paddingRight: 20 } as ViewStyle,
  payPill: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: BORDER } as ViewStyle,
  payPillActive: { borderColor: BRAND } as ViewStyle,
  payPillT: { fontSize: 13, fontWeight: '900', color: MUTED, fontFamily: 'Inter_900Black', letterSpacing: 1 } as TextStyle,
  payPillTActive: { color: BRAND } as TextStyle,

  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: BORDER, overflow: 'hidden', backgroundColor: 'rgba(3, 3, 5, 0.85)' } as ViewStyle,
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 60, borderRadius: 20, overflow: 'hidden', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER } as ViewStyle,
  saveBtnOff: { opacity: 0.5 } as ViewStyle,
  saveBtnT: { fontSize: 15, fontWeight: '900', color: INK, letterSpacing: 1.5, fontFamily: 'Inter_900Black' } as TextStyle,

  errorBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 16 } as ViewStyle,
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' } as TextStyle,
  errorDismiss: { color: '#EF4444', fontSize: 13, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: 1 } as TextStyle,
});