/**
 * GuestDesignScreen — MVP single-scroll card builder.
 * Inspired by HiHello / Taplink onboarding:
 * 1. Live card preview (always visible at top)
 * 2. Fill your info
 * 3. Pick card style (virtual or physical + color)
 * 4. Choose payment → save
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
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
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';

// ─── Info field row ───────────────────────────────────────────────────────────
function FieldRow({
  icon, value, onChange, placeholder, last, ...inputProps
}: {
  icon: AppIconName;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  last?: boolean;
} & Pick<React.ComponentProps<typeof TextInput>, 'keyboardType' | 'autoCapitalize'>) {
  const ref = useRef<TextInput>(null);
  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      style={[fi.row, last && fi.rowLast]}
    >
      <AppIcon name={icon} size={18} color={INK} />
      <TextInput
        ref={ref}
        style={fi.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#B8C0CC"
        {...inputProps}
      />
    </Pressable>
  );
}
const fi = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(17,17,17,0.06)', backgroundColor: SURFACE },
  rowLast: { borderBottomWidth: 0 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: INK, padding: 0 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export function GuestDesignScreen() {
  const { width: sw } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Info fields
  const [name, setName]       = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [phone, setPhone]     = useState(user?.phone ?? '');
  const [telegram, setTelegram] = useState('');

  // Card style
  const [cardType, setCardType]   = useState<'virtual' | 'physical'>('virtual');
  const [styleIdx, setStyleIdx]   = useState(0);           // 0 = black, 1 = green
  const [product, setProduct]     = useState<ProductType>('pvc_card');
  const [cardDesign, setCardDesign] = useState<CardDesign>('classic_black');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<CambodiaPaymentMethodId | null>(null);

  // State
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);

  const cardWidth = Math.min(sw - 48, 360);
  const cardHeight = cardWidth / 1.586;

  const priceUsd = cardType === 'virtual' ? getEcardPriceUsd() : getPhysicalPriceUsd(product);
  const infoComplete = name.trim().length > 0 && (phone.trim() || email.trim());

  // Load saved draft
  useEffect(() => {
    void loadGuestCardDraft().then((d) => {
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
  }, [user?.email, user?.phone]);

  const handleSave = useCallback(async () => {
    if (!infoComplete) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
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
      await saveGuestCardDraft(draft);
      await syncGuestCardDraft({ ...draft, savedAt });
      await saveGuestCheckoutDraft({
        cardChoice: cardType === 'physical' ? 'physical' : 'ecard',
        product,
        quantity: 1,
        displayName: name.trim(),
        phone: phone.trim(),
        currency: 'KHR',
        paymentMethod: paymentMethod ?? undefined,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  }, [infoComplete, name, jobTitle, company, email, phone, telegram, product, cardDesign, cardType, styleIdx, paymentMethod]);

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
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <AppIcon name="ChevronLeft" size={22} color={INK2} />
          </Pressable>
          <AppText style={styles.headerTitle}>Studio</AppText>
          <View style={styles.pricePill}>
            <AppText style={styles.priceT}>{formatFooterDualPrice(priceUsd)}</AppText>
          </View>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCopy}>
            <AppText style={styles.heroTitle}>Design your card</AppText>
            <AppText style={styles.heroSub}>Preview updates live — complete in 60 seconds.</AppText>
          </View>

          {/* ── CARD STAGE ── */}
          <View style={styles.previewStage}>
            <View style={styles.cardStackBack} />
            <View style={styles.previewWrap}>
              <NfcGlobalCardFace
                fullName={name || 'Your Name'}
                title={jobTitle}
                company={company}
                email={email}
                phone={phone}
                width={cardWidth}
                height={cardHeight}
              />
            </View>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <AppText style={styles.previewHint}>Live preview</AppText>
            </View>
          </View>

          {/* ── IDENTITY (ZARA-SIMPLE) ── */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Your details</AppText>
            <View style={styles.card}>
              <FieldRow icon="User"  value={name}  onChange={setName}  placeholder="Full name *" autoCapitalize="words" />
              <FieldRow icon="Phone" value={phone} onChange={setPhone} placeholder="Phone *" keyboardType="phone-pad" />
              <FieldRow icon="Mail"  value={email} onChange={setEmail} placeholder="Email *" keyboardType="email-address" autoCapitalize="none" last />
            </View>
          </View>

          {/* ── DELIVERY ── */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Card type</AppText>
            <View style={styles.segmentRow}>
              {(['virtual', 'physical'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setCardType(t); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.segBtn, cardType === t && styles.segBtnActive]}
                >
                  <AppText style={[styles.segBtnT, cardType === t && styles.segBtnTActive]}>
                    {t === 'virtual' ? 'Virtual' : 'Physical'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── PAYMENT ── */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Payment</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payScroll}>
              {paymentMethods.map((pm) => (
                <Pressable
                  key={pm.id}
                  onPress={() => { setPaymentMethod(pm.id); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.payPill, paymentMethod === pm.id && styles.payPillActive]}
                >
                  <AppText style={[styles.payPillT, paymentMethod === pm.id && styles.payPillTActive]}>
                    {pm.labelEn.replace('Pay with ', '')}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Spacer for footer */}
          <View style={{ height: 20 }} />
        </IosScrollView>

        {/* ── SAVE / ORDER BUTTON ── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            onPress={() => void handleSave()}
            disabled={saving || !infoComplete}
            style={({ pressed }) => [
              styles.saveBtn,
              (!infoComplete || saving) && styles.saveBtnOff,
              pressed && infoComplete && !saving && styles.saveBtnPressed,
            ]}
            accessibilityRole="button"
            testID="guest-design-save"
          >
            {saving
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <>
                  <AppIcon name="Check" size={19} color="#FFFFFF" />
                  <AppText style={styles.saveBtnT}>
                    {cardType === 'physical' ? 'Order card' : 'Save card'}
                  </AppText>
                </>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: BG },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: INK, letterSpacing: 0 },
  pricePill: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: INK },
  priceT: { fontSize: 12, fontWeight: '800', color: BRAND },

  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20, gap: 28 },

  heroCopy: { gap: 6 },
  heroTitle: { fontSize: 32, lineHeight: 36, fontWeight: '900', color: INK, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, fontWeight: '600', color: MUTED, lineHeight: 21 },

  // Preview
  previewStage: { alignItems: 'center', paddingTop: 14, gap: 12 },
  cardStackBack: {
    position: 'absolute',
    top: 0,
    width: '82%',
    height: 38,
    borderRadius: 24,
    backgroundColor: '#DADAE0',
  },
  previewWrap: {
    alignItems: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
    elevation: 10,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND },
  previewHint: { fontSize: 12, fontWeight: '800', color: MUTED },

  // Sections
  section: { gap: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: 0 },
  card: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },

  // Segment
  segmentRow: { flexDirection: 'row', gap: 10 },
  segBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)' },
  segBtnActive: { backgroundColor: INK, borderColor: INK },
  segBtnT: { fontSize: 14, fontWeight: '800', color: MUTED },
  segBtnTActive: { color: '#FFFFFF' },

  // Payment
  payScroll: { gap: 8, paddingRight: 4 },
  payPill: { paddingHorizontal: 17, paddingVertical: 13, borderRadius: 999, backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)' },
  payPillActive: { backgroundColor: INK, borderColor: INK },
  payPillT: { fontSize: 14, fontWeight: '800', color: INK },
  payPillTActive: { color: '#FFFFFF' },

  // Footer CTA
  footer: { paddingHorizontal: 24, paddingTop: 10, backgroundColor: BG },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 58, borderRadius: 29, backgroundColor: INK },
  saveBtnOff: { backgroundColor: '#C4CFDE', shadowOpacity: 0 },
  saveBtnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  saveBtnT: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
});
