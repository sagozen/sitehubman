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
import { AppButton } from '@/src/components/AppButton';
import { PaymentMethodIcon } from '@/src/components/PaymentMethodIcon';
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
import { pageThemes } from '@/src/constants/pageThemes';
import React, { useCallback, useEffect, useState, useRef } from 'react';

// Studio tokens shared with the rest of the guest experience.
const DESIGN_THEME = pageThemes.studio;
const BRAND = DESIGN_THEME.accent;
const INK = DESIGN_THEME.text;
const INK2 = DESIGN_THEME.muted;
const MUTED = DESIGN_THEME.muted;
const BG = DESIGN_THEME.canvas;
const SURFACE = DESIGN_THEME.surface;
const SURFACE_ACTIVE = DESIGN_THEME.accent;
const BORDER = DESIGN_THEME.border;

const FLOW_STEPS = ['Design', 'Preview', 'Checkout', 'Track'];

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
      <AppIcon name={icon} size={20} color={BRAND} />
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
    borderColor: 'rgba(255, 255, 255, 0.28)'
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
  }, [user?.email, user?.phone]);

  const handleSave = useCallback(async () => {
    if (!infoComplete) return;

    await measure('Create and Activate NFC Card', async () => {
      HapticTap.medium();
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

        const [, session] = await Promise.all([
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

        if (cardType === 'physical') {
          router.push({ pathname: '/payments/checkout/[cardId]', params: { cardId: session.cardId } });
        } else {
          const slug = session.publicSlug || session.cardId;
          router.push(`/u/${encodeURIComponent(slug)}`);
        }
      } catch (error) {
        console.error('Card creation failed:', error);
        setSaveError('Failed to create card. Please check your connection.');
        HapticTap.error();
      } finally {
        setSaving(false);
      }
    });
  }, [infoComplete, name, jobTitle, company, email, phone, telegram, product, cardDesign, cardType, styleIdx, paymentMethod, measure]);

  if (loadingDraft) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={BRAND} size="large" />
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
          colors={['#050506', BG]}
          locations={[0, 1]}
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
          <AppText style={styles.headerTitle}>Design</AppText>
          <View style={styles.pricePill}>
            <LinearGradient
              colors={['#FFFFFF', '#F4F4F5']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <AppText style={styles.priceT}>{formatFooterDualPrice(priceUsd)}</AppText>
          </View>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.flowCard}>
            <AppText style={styles.flowTitle}>Launch flow</AppText>
            <View style={styles.flowSteps}>
              {FLOW_STEPS.map((step, index) => {
                const active = index === 0;
                return (
                  <View key={step} style={styles.flowStep}>
                    <View style={[styles.flowDot, active && styles.flowDotActive]}>
                      <AppText style={[styles.flowDotText, active && styles.flowDotTextActive]}>
                        {index + 1}
                      </AppText>
                    </View>
                    <AppText style={[styles.flowStepText, active && styles.flowStepTextActive]}>
                      {step}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Card Stage ── */}
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
              <AppText style={styles.previewHint}>Live preview</AppText>
            </View>
          </View>

          {/* ── Bento Form Grid ── */}
          <View style={styles.sectionsContainer}>
            
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <AppText style={styles.sectionTitle}>Identity</AppText>
                <Pressable
                  style={({ pressed }) => [styles.linkedInBtn, pressed && styles.pressed]}
                  onPress={() => {
                    HapticTap.medium();
                    setName((prev) => prev || 'Alexander Wright');
                    setJobTitle((prev) => prev || 'Senior Product Architect');
                    setCompany((prev) => prev || 'SiteHub Monorepo');
                    setEmail((prev) => prev || 'alex.wright@sitehub.io');
                    setPhone((prev) => prev || '+1 (415) 890-1234');
                  }}
                >
                  <AppIcon name="Linkedin" size={14} color="#FFFFFF" />
                  <AppText style={styles.linkedInText}>Import from LinkedIn</AppText>
                </Pressable>
              </View>
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
              <AppText style={styles.sectionTitle}>Format</AppText>
              <View style={styles.bentoGridHorizontal}>
                {(['virtual', 'physical'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => { setCardType(t); HapticTap.light(); }}
                    style={({ pressed }) => [
                      styles.segBtn,
                      {
                        backgroundColor: cardType === t ? SURFACE_ACTIVE : SURFACE,
                        borderColor: cardType === t ? '#FFFFFF' : BORDER,
                      },
                      pressed && styles.pressed
                    ]}
                  >
                    <AppText style={[styles.segBtnT, cardType === t && styles.segBtnTActive]}>
                      {t === 'virtual' ? 'Digital' : 'Physical'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Payment</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payScroll}>
                {paymentMethods.map((pm) => (
                  <Pressable
                    key={pm.id}
                    onPress={() => { setPaymentMethod(pm.id); HapticTap.light(); }}
                    style={({ pressed }) => [
                      styles.payPill,
                      {
                        backgroundColor: paymentMethod === pm.id ? SURFACE_ACTIVE : SURFACE,
                        borderColor: paymentMethod === pm.id ? '#FFFFFF' : BORDER,
                      },
                      pressed && styles.pressed
                    ]}
                  >
                    <PaymentMethodIcon
                      methodId={pm.id}
                      fallbackIcon={pm.icon}
                      size={24}
                      color={paymentMethod === pm.id ? '#000000' : INK2}
                    />
                    <AppText style={[styles.payPillT, paymentMethod === pm.id && styles.payPillTActive]}>
                      {pm.labelEn.replace('Pay with ', '')}
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
                <AppText style={styles.errorDismiss}>Dismiss</AppText>
              </Pressable>
            </View>
          )}

          <AppButton
            label={cardType === 'physical' ? 'Order NFC Physical Card' : 'Create & Activate Digital Card'}
            variant="white"
            size="bottomCTA"
            onPress={() => void handleSave()}
            disabled={!infoComplete}
            loading={saving}
            fullWidth={true}
            haptic="medium"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  pressed: { transform: [{ scale: MotionScale.pressed }] },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: '#111114' },
  headerTitle: { flex: 1, fontSize: 20, color: INK, letterSpacing: 0, fontFamily: 'SF-Pro-Display-Regular', textAlign: 'center' },
  pricePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  priceT: { fontSize: 13, color: '#000000', fontFamily: 'SF-Pro-Display-Regular' },

  scroll: { paddingBottom: 60, paddingTop: 10 },

  flowCard: {
    marginHorizontal: 20,
    marginBottom: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111114',
    padding: 14,
    gap: 12,
  },
  flowTitle: {
    color: 'rgba(255, 255, 255, 0.56)',
    fontSize: 12,
    fontWeight: '800',
  },
  flowSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowStep: {
    alignItems: 'center',
    gap: 4,
  },
  flowDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  flowDotActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  flowDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.56)',
  },
  flowDotTextActive: {
    color: '#000000',
  },
  flowStepText: {
    color: 'rgba(255, 255, 255, 0.56)',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  flowStepTextActive: {
    color: '#FFFFFF',
  },

  previewStage: { alignItems: 'center', position: 'relative', paddingVertical: 24, paddingHorizontal: 20 },
  glowBackdrop: {
    position: 'absolute',
    width: '80%',
    height: '60%',
    backgroundColor: '#FFFFFF',
    opacity: 0.02,
    borderRadius: 999,
    top: '20%',
  },
  previewWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  previewHint: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0, fontFamily: 'SF-Pro-Display-Regular' },

  sectionsContainer: { paddingHorizontal: 20, paddingTop: 10, gap: 40 },
  section: { gap: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 14, color: INK2, letterSpacing: 0, fontFamily: 'SF-Pro-Display-Regular' },
  linkedInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#0A66C2',
  },
  linkedInText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  bentoGrid: { gap: 12 },
  bentoGridHorizontal: { flexDirection: 'row', gap: 12 },

  segBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: '#111114' },
  segBtnT: { fontSize: 14, color: MUTED, fontFamily: 'SF-Pro-Display-Regular', letterSpacing: 0 },
  segBtnTActive: { color: '#000000' },

  payScroll: { gap: 12, paddingRight: 20 },
  payPill: { minWidth: 132, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: '#111114', alignItems: 'center', gap: 8 },
  payPillT: { fontSize: 13, color: MUTED, fontFamily: 'SF-Pro-Display-Regular', letterSpacing: 0 },
  payPillTActive: { color: '#000000' },

  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', backgroundColor: 'rgba(0, 0, 0, 0.85)' },
  errorBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 16 },
  errorText: { color: '#FCA5A5', fontSize: 13, fontFamily: 'SF-Pro-Display-Regular' },
  errorDismiss: { color: '#EF4444', fontSize: 13, fontFamily: 'SF-Pro-Display-Regular', letterSpacing: 0 },
});
