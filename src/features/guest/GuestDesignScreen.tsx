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
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
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
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND = '#007AFF';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#FFFFFF';
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
      style={[fi.row, last && fi.rowLast] as ViewStyle[]}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(17,17,17,0.06)', backgroundColor: SURFACE } as ViewStyle,
  rowLast: { borderBottomWidth: 0 } as ViewStyle,
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: INK, padding: 0 } as TextStyle,
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
  const [styleIdx, setStyleIdx]   = useState(0);
  const [product, setProduct]     = useState<ProductType>('pvc_card');
  const [cardDesign, setCardDesign] = useState<CardDesign>('classic_black');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<CambodiaPaymentMethodId | null>(null);

  // State
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);

  const cardWidth = Math.min(sw - 48, 340);
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
        {/* ── Premium Apple-Editorial Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <AppIcon name="ChevronLeft" size={22} color={INK2} />
          </Pressable>
          <AppText style={styles.headerTitle}>Studio Design</AppText>
          <View style={styles.pricePill}>
            <AppText style={styles.priceT}>{formatFooterDualPrice(priceUsd)}</AppText>
          </View>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Edge-to-Edge Premium Hero Section with Glass Overlay */}
          <LinearGradient
            colors={['rgba(37,150,190,0.06)', 'rgba(255,255,255,0)']}
            style={styles.heroBanner}
          >
            <View style={styles.heroCopy}>
              <AppText style={styles.heroTitle}>Customize Identity</AppText>
              <AppText style={styles.heroSub}>Choose style options and fill profile credentials</AppText>
            </View>

            {/* Premium Card Stage with Depth Projection */}
            <View style={styles.previewStage}>
              <View style={styles.cardShadowBack} />
              <View style={styles.previewWrap}>
                <NfcGlobalCardFace
                  fullName={name || 'Your Full Name'}
                  title={jobTitle || 'Verified NFC Member'}
                  company={company || 'NFC Global'}
                  email={email || 'member@nfcglobal.co'}
                  phone={phone || undefined}
                  width={cardWidth}
                  height={cardHeight}
                />
              </View>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <AppText style={styles.previewHint}>Live Production Preview</AppText>
              </View>
            </View>
          </LinearGradient>

          {/* Sections with Soft Visual Grouping and comfortable whitespace */}
          <View style={styles.sectionsContainer}>
            {/* Identity Group */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Profile details</AppText>
              <View style={styles.card}>
                <FieldRow icon="User"  value={name}  onChange={setName}  placeholder="Full name *" autoCapitalize="words" />
                <FieldRow icon="Phone" value={phone} onChange={setPhone} placeholder="Phone *" keyboardType="phone-pad" />
                <FieldRow icon="Mail"  value={email} onChange={setEmail} placeholder="Email *" keyboardType="email-address" autoCapitalize="none" last />
              </View>
            </View>

            {/* Delivery / Choice Group */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Product format</AppText>
              <View style={styles.segmentRow}>
                {(['virtual', 'physical'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => { setCardType(t); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.segBtn, cardType === t && styles.segBtnActive] as ViewStyle[]}
                  >
                    <AppText style={[styles.segBtnT, cardType === t && styles.segBtnTActive] as TextStyle[]}>
                      {t === 'virtual' ? 'E-Card (Digital Only)' : 'Physical Card (Metal/Wood/PVC)'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Payment Method Group */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Checkout options</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payScroll}>
                {paymentMethods.map((pm) => (
                  <Pressable
                    key={pm.id}
                    onPress={() => { setPaymentMethod(pm.id); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.payPill, paymentMethod === pm.id && styles.payPillActive] as ViewStyle[]}
                  >
                    <AppText style={[styles.payPillT, paymentMethod === pm.id && styles.payPillTActive] as TextStyle[]}>
                      {pm.labelEn.replace('Pay with ', '')}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </IosScrollView>

        {/* ── Premium Fixed Footer ── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }] as ViewStyle[]}>
          <Pressable
            onPress={() => void handleSave()}
            disabled={saving || !infoComplete}
            style={({ pressed }) => [
              styles.saveBtn,
              (!infoComplete || saving) && styles.saveBtnOff,
              pressed && infoComplete && !saving && styles.saveBtnPressed,
            ] as ViewStyle[]}
            accessibilityRole="button"
            testID="guest-design-save"
          >
            {saving
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <>
                  <AppIcon name="Check" size={19} color="#FFFFFF" />
                  <AppText style={styles.saveBtnT}>
                    {cardType === 'physical' ? 'Order Premium Card' : 'Activate E-Card'}
                  </AppText>
                </>}
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

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 } as ViewStyle,
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 } as ViewStyle,
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: INK, letterSpacing: -0.4, fontFamily: 'Inter_800ExtraBold' } as TextStyle,
  pricePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: INK } as ViewStyle,
  priceT: { fontSize: 12, fontWeight: '900', color: BRAND, fontFamily: 'Inter_900Black' } as TextStyle,

  scroll: { paddingBottom: 40 } as ViewStyle,

  heroBanner: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' } as ViewStyle,
  heroCopy: { gap: 6, marginBottom: 24 } as ViewStyle,
  heroTitle: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -0.8, fontFamily: 'Inter_900Black' } as TextStyle,
  heroSub: { fontSize: 14, fontWeight: '600', color: MUTED, lineHeight: 20, fontFamily: 'Inter_600SemiBold' } as TextStyle,

  // Premium depth card preview stage
  previewStage: { alignItems: 'center', position: 'relative', paddingVertical: 12 } as ViewStyle,
  cardShadowBack: {
    position: 'absolute',
    bottom: 24,
    width: '75%',
    height: 18,
    backgroundColor: '#000000',
    opacity: 0.06,
    borderRadius: 99,
    transform: [{ scaleX: 1.1 }],
  } as ViewStyle,
  previewWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  } as ViewStyle,
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 } as ViewStyle,
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND } as ViewStyle,
  previewHint: { fontSize: 11, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Inter_800ExtraBold' } as TextStyle,

  sectionsContainer: { paddingHorizontal: 20, paddingTop: 32, gap: 32 } as ViewStyle,
  section: { gap: 12 } as ViewStyle,
  sectionTitle: { fontSize: 20, fontWeight: '800', color: INK, letterSpacing: -0.4, fontFamily: 'Inter_800ExtraBold' } as TextStyle,
  card: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10 } as ViewStyle,

  segmentRow: { flexDirection: 'column', gap: 10 } as ViewStyle,
  segBtn: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 24, backgroundColor: SURFACE, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)' } as ViewStyle,
  segBtnActive: { backgroundColor: INK, borderColor: INK } as ViewStyle,
  segBtnT: { fontSize: 14, fontWeight: '700', color: MUTED, fontFamily: 'Inter_700Bold' } as TextStyle,
  segBtnTActive: { color: '#FFFFFF' } as TextStyle,

  payScroll: { gap: 8, paddingRight: 4 } as ViewStyle,
  payPill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: SURFACE, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)' } as ViewStyle,
  payPillActive: { backgroundColor: INK, borderColor: INK } as ViewStyle,
  payPillT: { fontSize: 13, fontWeight: '800', color: INK, fontFamily: 'Inter_800ExtraBold' } as TextStyle,
  payPillTActive: { color: '#FFFFFF' } as TextStyle,

  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: BG, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' } as ViewStyle,
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, backgroundColor: '#111827' } as ViewStyle,
  saveBtnOff: { backgroundColor: '#C4CFDE', shadowOpacity: 0 } as ViewStyle,
  saveBtnPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] } as ViewStyle,
  saveBtnT: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, fontFamily: 'Inter_800ExtraBold' } as TextStyle,
});
