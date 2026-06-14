import { IosScrollView } from '@/src/components/IosScrollView';
import { IosFlatList } from '@/src/components/IosFlatList';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';
import { AppText } from '@/src/components/AppText';
import { PhotoBanner } from '@/src/components/PhotoBanner';
import {
  formatFooterDualPrice,
  getEcardPriceUsd,
  getPhysicalPriceUsd,
} from '@/src/constants/cardProducts';
import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';
import { paymentMethodLabel } from '@/src/constants/cambodiaPayments';
import { guestCardFinishOptions, guestCarouselIndexToDesign, guestDesignToCarouselIndex } from '@/src/constants/guestCardDesign';
import { useProductCatalog } from '@/src/hooks/useProductCatalog';
import { getActiveMaterialProductOptions } from '@/src/services/productCatalogService';
import { CambodiaPaymentSelector } from '@/src/components/CambodiaPaymentSelector';
import { PaymentBrandStrip } from '@/src/components/PaymentBrandStrip';
import { iosDesign } from '@/src/design-system/ios';
import {
  GuestFormIconCard,
  GuestFormIconRow,
  GuestFormStepTabs,
  GuestFormSummaryRow,
  guestUi,
  type GuestFormTab,
} from '@/src/features/guest/GuestScreenUi';
import {
  CAROUSEL_CUSTOM_INDEX,
  CUSTOM_SLOT_PLACEHOLDER_GRADIENT,
  GuestChooseCardPreview,
  PHYSICAL_CARD_GRADIENTS,
  VIRTUAL_CARD_GRADIENTS,
  type ChooseCardGradient,
} from '@/src/features/guest/GuestChooseCardPreview';
import { useAuth } from '@/src/hooks/useAuth';
import type { ProductType } from '@/src/constants/options';
import type { CardDesign } from '@/src/types/models';
import {
  pickAndUploadGuestCardImage,
  resolveGuestCustomImageUri,
} from '@/src/features/guest/guestCardImagePicker';
import {
  loadGuestCardDraft,
  loadGuestCheckoutDraft,
  saveGuestCardDraft,
  saveGuestCheckoutDraft,
  type GuestCardChoice,
  type GuestCardDesignBackground,
} from '@/src/services/guestDraftService';
import { GuestDesignPreviewPanel } from '@/src/features/guest/components/GuestDesignPreviewPanel';
import { syncGuestCardDraft } from '@/src/services/guestCardDraftService';

const AUTO_SAVE_MS = 1200;

type CardSegment = 'virtual' | 'physical';

const SEGMENT_OPTIONS: { label: string; value: CardSegment }[] = [
  { label: 'Virtual Card', value: 'virtual' },
  { label: 'Physical Card', value: 'physical' },
];


const DESIGN_STEPS: { key: GuestFormTab; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'product', label: 'Product' },
  { key: 'payment', label: 'Payment' },
];

const PAYMENT_TRUST_ITEMS: { icon: AppIconName; title: string; body: string }[] = [
  {
    icon: 'ShieldCheck',
    title: 'Secure Cambodia checkout',
    body: 'ABA Pay, KHQR (Bakong), ACLEDA, Wing, Pi Pay, and TrueMoney supported.',
  },
  {
    icon: 'Shield',
    title: 'Your data stays private',
    body: 'Contact details are stored securely and only used for your card order.',
  },
  {
    icon: 'BadgeCheck',
    title: 'Verified production',
    body: 'Physical cards are printed, NFC-encoded, and QA-checked before shipping.',
  },
];

function segmentToChoice(segment: CardSegment): GuestCardChoice {
  return segment === 'virtual' ? 'ecard' : 'physical';
}

function choiceToSegment(choice: GuestCardChoice | undefined): CardSegment {
  return choice === 'physical' ? 'physical' : 'virtual';
}

type CarouselSlide =
  | { kind: 'gradient'; gradient: ChooseCardGradient; gradientIndex: number }
  | { kind: 'custom' };

function buildCarouselSlides(gradients: ChooseCardGradient[]): CarouselSlide[] {
  return [
    ...gradients.map((gradient, gradientIndex) => ({
      kind: 'gradient' as const,
      gradient,
      gradientIndex,
    })),
    { kind: 'custom' as const },
  ];
}

function draftToCarouselIndex(draft: {
  gradientIndex?: number;
  designBackground?: GuestCardDesignBackground;
  cardDesign?: CardDesign;
}): number {
  if (
    typeof draft.gradientIndex === 'number'
    && draft.gradientIndex >= 0
    && draft.gradientIndex <= CAROUSEL_CUSTOM_INDEX
  ) {
    return draft.gradientIndex;
  }
  if (draft.designBackground === 'custom') return CAROUSEL_CUSTOM_INDEX;
  return guestDesignToCarouselIndex(draft.cardDesign);
}

export function GuestDesignScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  useProductCatalog();
  const materialOptions = getActiveMaterialProductOptions();

  const [segment, setSegment] = useState<CardSegment>('virtual');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [telegram, setTelegram] = useState('');
  const [formTab, setFormTab] = useState<GuestFormTab>('customer');
  const [product, setProduct] = useState<ProductType>('pvc_card');
  const [cardDesign, setCardDesign] = useState<CardDesign>('classic_black');
  const [customImageUri, setCustomImageUri] = useState('');
  const [customImageUploading, setCustomImageUploading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<CambodiaPaymentMethodId | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const listRef = useRef<FlatList<CarouselSlide>>(null);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentFade = useRef(new Animated.Value(1)).current;
  const cardWidth = Math.min(screenWidth * 0.54, 220);
  const cardHeight = cardWidth * 0.63;
  const itemSpacing = 8;
  const sideInset = (screenWidth - cardWidth) / 2;

  const gradients = segment === 'virtual' ? VIRTUAL_CARD_GRADIENTS : PHYSICAL_CARD_GRADIENTS;
  const carouselSlides = useMemo(() => buildCarouselSlides(gradients), [gradients]);
  const priceUsd = segment === 'virtual' ? getEcardPriceUsd() : getPhysicalPriceUsd(product);
  const cardType = segment;
  const resolvedCustomImageUri = resolveGuestCustomImageUri(customImageUri);
  const isCustomCarouselSlot = carouselIndex === CAROUSEL_CUSTOM_INDEX;
  const designBackground: GuestCardDesignBackground = isCustomCarouselSlot ? 'custom' : 'gradient';
  const previewExtraData = {
    displayName,
    jobTitle,
    company,
    email,
    phone,
    segment,
    carouselIndex,
    customImageUri: resolvedCustomImageUri,
  };

  const activeSlide = carouselSlides[carouselIndex] ?? carouselSlides[0];
  const activeGradient = activeSlide.kind === 'gradient' ? activeSlide.gradient.colors : CUSTOM_SLOT_PLACEHOLDER_GRADIENT.colors;

  const loadDraft = useCallback(async () => {
    const [draft, checkout] = await Promise.all([loadGuestCardDraft(), loadGuestCheckoutDraft()]);
    if (checkout?.paymentMethod) {
      setPaymentMethod(checkout.paymentMethod as CambodiaPaymentMethodId);
    }
    if (draft) {
      setDisplayName(draft.displayName || '');
      setJobTitle(draft.jobTitle);
      setCompany(draft.company);
      setEmail(draft.email || user?.email || '');
      setPhone(draft.phone || user?.phone || '');
      setTelegram(draft.telegram ?? '');
      setProduct(draft.product);
      setCardDesign(draft.cardDesign);
      setCustomImageUri(
        resolveGuestCustomImageUri(draft.customImageUri ?? '') ?? '',
      );
      setSegment(choiceToSegment(draft.cardChoice));
      const idx = draftToCarouselIndex(draft);
      setCarouselIndex(idx);
      if (idx < CAROUSEL_CUSTOM_INDEX) {
        setCardDesign(guestCarouselIndexToDesign(idx));
      }
      if (idx > 0) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: idx, animated: false });
        });
      }
    }
    hydrated.current = true;
    setLoadingDraft(false);
  }, [user?.email, user?.phone]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    contentFade.setValue(0.88);
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [formTab, segment, carouselIndex, contentFade]);

  const currentDraft = useCallback(() => ({
    displayName,
    jobTitle,
    company,
    email,
    phone,
    telegram: telegram.trim() || undefined,
    product,
    cardDesign,
    cardChoice: segmentToChoice(segment),
    designBackground,
    gradientIndex: carouselIndex,
    customImageUri: resolvedCustomImageUri,
  }), [
    cardDesign,
    carouselIndex,
    company,
    designBackground,
    displayName,
    email,
    jobTitle,
    phone,
    product,
    resolvedCustomImageUri,
    segment,
    telegram,
  ]);

  const persistDraft = useCallback(async () => {
    if (!hydrated.current) return;
    const savedAt = new Date().toISOString();
    const draft = currentDraft();
    await saveGuestCardDraft(draft);
    await syncGuestCardDraft({ ...draft, savedAt });
  }, [currentDraft]);

  useEffect(() => {
    if (!hydrated.current || loadingDraft || !user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDraft();
    }, AUTO_SAVE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    displayName,
    jobTitle,
    company,
    email,
    phone,
    telegram,
    product,
    cardDesign,
    carouselIndex,
    segment,
    designBackground,
    customImageUri,
    loadingDraft,
    persistDraft,
    user,
  ]);

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (cardWidth + itemSpacing));
    const clamped = Math.max(0, Math.min(index, carouselSlides.length - 1));
    setCarouselIndex(clamped);
    if (clamped < CAROUSEL_CUSTOM_INDEX) {
      setCardDesign(guestCarouselIndexToDesign(clamped));
    } else {
      setCardDesign('custom');
    }
  }

  function handleSegmentChange(next: CardSegment) {
    if (next === segment) return;
    softHaptic();
    setSegment(next);
    setCarouselIndex(0);
    setCardDesign(guestCarouselIndexToDesign(0));
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }

  function handleFinishSelect(design: CardDesign) {
    if (cardDesign !== design) softHaptic();
    setCardDesign(design);
    if (design === 'custom') {
      setCarouselIndex(CAROUSEL_CUSTOM_INDEX);
      listRef.current?.scrollToIndex({ index: CAROUSEL_CUSTOM_INDEX, animated: true });
      return;
    }
    const idx = guestDesignToCarouselIndex(design);
    if (idx >= 0 && idx < CAROUSEL_CUSTOM_INDEX) {
      setCarouselIndex(idx);
      listRef.current?.scrollToIndex({ index: idx, animated: true });
    }
  }

  async function handlePickCustomImage(fromCamera: boolean) {
    if (customImageUploading) return;
    setCustomImageUploading(true);
    try {
      const ownerKey = user?.id ?? 'guest';
      const url = await pickAndUploadGuestCardImage(fromCamera, ownerKey);
      if (!url) return;
      setCustomImageUri(url);
      if (carouselIndex !== CAROUSEL_CUSTOM_INDEX) {
        setCarouselIndex(CAROUSEL_CUSTOM_INDEX);
        listRef.current?.scrollToIndex({ index: CAROUSEL_CUSTOM_INDEX, animated: true });
      }
    } finally {
      setCustomImageUploading(false);
    }
  }

  function handleRemoveCustomImage() {
    setCustomImageUri('');
  }

  async function handleApply() {
    if (!customerStepComplete) {
      setFormTab('customer');
      return;
    }
    softHaptic();
    const draft = currentDraft();
    const savedAt = new Date().toISOString();
    await saveGuestCardDraft(draft);
    await syncGuestCardDraft({ ...draft, savedAt });
    await saveGuestCheckoutDraft({
      cardChoice: segmentToChoice(segment),
      product,
      quantity: 1,
      displayName: displayName.trim() || user?.displayName || '',
      phone: phone.trim(),
      currency: 'KHR',
      paymentMethod: paymentMethod ?? undefined,
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  const finishLabel =
    guestCardFinishOptions.find((o) => o.value === cardDesign)?.label ?? 'Black';
  const materialLabel =
    materialOptions.find((o) => o.value === product)?.label ?? 'PVC Card';
  const cardTypeLabel = segment === 'virtual' ? 'Virtual NFC' : 'Physical NFC';
  const designSummary = isCustomCarouselSlot ? 'Custom photo' : finishLabel;
  const activeStepIndex = DESIGN_STEPS.findIndex((step) => step.key === formTab);
  const customerStepComplete =
    displayName.trim().length > 0 && Boolean(phone.trim() || email.trim());
  const canSwitchToTab = useCallback(
    (tab: GuestFormTab) => {
      if (tab === 'customer') return true;
      if (tab === 'product') return customerStepComplete;
      if (tab === 'payment') return customerStepComplete;
      return false;
    },
    [customerStepComplete]
  );
  const applyLabel = 'Save card';

  function softHaptic() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: contentFade }]}>
          <LinearGradient
            colors={activeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: guestUi.bg, opacity: 0.82 }]} />
        <LinearGradient
          colors={[guestUi.bg + '00', guestUi.bg, guestUi.bg]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerBack, pressed && styles.headerBackPressed]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="ChevronLeft" size={24} color={guestUi.text} />
          </Pressable>
          <AppText style={styles.headerTitle}>Design your card</AppText>
          <View style={styles.headerSegment}>
            {SEGMENT_OPTIONS.map((opt) => {
              const active = segment === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSegmentChange(opt.value)}
                  style={[styles.headerSegBtn, active && styles.headerSegBtnActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <AppIcon
                    name={opt.value === 'virtual' ? 'Phone' : 'CreditCard'}
                    size={12}
                    color={active ? '#FFFFFF' : guestUi.muted}
                  />
                  <AppText style={[styles.headerSegLabel, active && styles.headerSegLabelActive]}>
                    {opt.value === 'virtual' ? 'Virtual' : 'Physical'}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.socialComposer}>
          <View style={styles.socialCover}>
            <LinearGradient
              colors={activeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.socialCoverToolbar}>
              <Pressable
                onPress={() => void handlePickCustomImage(false)}
                style={({ pressed }) => [styles.coverTool, pressed && styles.socialPromptPressed]}
                accessibilityRole="button"
              >
                <AppIcon name="Camera" size={15} color="#FFFFFF" />
                <AppText style={styles.coverToolText}>Cover</AppText>
              </Pressable>
            </View>
          </View>
          <View style={styles.socialComposerBody}>
            <View style={styles.socialAvatar}>
              <AppText style={styles.socialAvatarText}>
                {(displayName.trim() || user?.displayName?.trim() || 'C')[0].toUpperCase()}
              </AppText>
              <Pressable
                onPress={() => void handlePickCustomImage(false)}
                style={({ pressed }) => [styles.avatarCamera, pressed && styles.socialPromptPressed]}
                accessibilityRole="button"
              >
                <AppIcon name="Camera" size={13} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.socialComposerCopy}>
              <AppText style={styles.socialName} numberOfLines={1}>
                {displayName.trim() || user?.displayName?.trim() || 'Your card profile'}
              </AppText>
              <AppText style={styles.socialSub} numberOfLines={1}>
                {[jobTitle, company].filter(Boolean).join(' · ') || 'Add a title and company'}
              </AppText>
              <Pressable
                onPress={() => setFormTab('customer')}
                style={({ pressed }) => [styles.socialPrompt, pressed && styles.socialPromptPressed]}
                accessibilityRole="button"
              >
                <AppText style={styles.socialPromptText} numberOfLines={1}>
                  What should people see when they tap your card?
                </AppText>
              </Pressable>
            </View>
          </View>
          <View style={styles.socialActions}>
            {[
              { label: 'Photo', icon: 'Image' as const, onPress: () => void handlePickCustomImage(false) },
              { label: 'Details', icon: 'User' as const, onPress: () => setFormTab('customer') },
              { label: 'Style', icon: 'Sparkles' as const, onPress: () => setFormTab('product') },
              { label: 'Checkout', icon: 'Wallet' as const, onPress: () => setFormTab('payment') },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={({ pressed }) => [styles.socialAction, pressed && styles.socialPromptPressed]}
                accessibilityRole="button"
              >
                <AppIcon name={item.icon} size={16} color={guestUi.accent} />
                <AppText style={styles.socialActionText}>{item.label}</AppText>
              </Pressable>
            ))}
          </View>
          <View style={styles.realShowcase}>
            <PhotoBanner
              marketingSceneId="design-card"
              cacheKey="marketing-design-card-top"
              variant="strip"
              overlay="product"
              style={styles.realProductBanner}
            >
              <View style={styles.realProductCopy}>
                <AppText style={styles.realProductTitle}>Real card preview</AppText>
                <AppText style={styles.realProductSub}>Material, finish, and payment all in one flow.</AppText>
              </View>
            </PhotoBanner>
            <View style={styles.realPaymentStrip}>
              <View style={styles.realPaymentHead}>
                <AppText style={styles.realPaymentTitle}>Pay with</AppText>
                <AppText style={styles.realPaymentSub}>Real logos</AppText>
              </View>
              <PaymentBrandStrip logoSize={30} gap={7} />
            </View>
          </View>
        </View>

        <View style={styles.previewSection}>
          <GuestDesignPreviewPanel
            expanded={previewExpanded}
            onToggle={() => {
              softHaptic();
              setPreviewExpanded((open) => !open);
            }}
            previewHeight={cardHeight + 8}
          >
            <IosFlatList
              ref={listRef}
              data={carouselSlides}
              extraData={previewExtraData}
              key={`${segment}-${carouselSlides.length}`}
              horizontal
              scrollEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={cardWidth + itemSpacing}
              snapToAlignment="start"
              style={styles.carouselList}
              contentContainerStyle={{
                paddingHorizontal: sideInset,
                gap: itemSpacing,
                paddingVertical: 2,
              }}
              onMomentumScrollEnd={onMomentumScrollEnd}
              getItemLayout={(_, index) => ({
                length: cardWidth + itemSpacing,
                offset: (cardWidth + itemSpacing) * index,
                index,
              })}
              renderItem={({ item, index }) => {
                const isActive = index === carouselIndex;
                const previewProps = {
                  fullName: displayName,
                  title: jobTitle,
                  company,
                  email,
                  phone,
                  cardType,
                  width: cardWidth,
                  height: cardHeight,
                } as const;

                return (
                  <View
                    style={[
                      styles.carouselItem,
                      {
                        width: cardWidth,
                        marginRight: itemSpacing,
                        opacity: isActive ? 1 : 0.55,
                        transform: [{ scale: isActive ? 1 : 0.965 }],
                      },
                    ]}
                  >
                    {item.kind === 'custom' ? (
                      <GuestChooseCardPreview
                        {...previewProps}
                        gradient={CUSTOM_SLOT_PLACEHOLDER_GRADIENT}
                        gradientIndex={CAROUSEL_CUSTOM_INDEX}
                        customImageUri={resolvedCustomImageUri}
                        isCustomSlot
                        onAddPhoto={
                          isActive ? () => void handlePickCustomImage(false) : undefined
                        }
                      />
                    ) : (
                      <GuestChooseCardPreview
                        {...previewProps}
                        gradient={item.gradient}
                        gradientIndex={item.gradientIndex}
                        customImageUri={null}
                      />
                    )}
                  </View>
                );
              }}
            />
          </GuestDesignPreviewPanel>
          {previewExpanded ? (
            <View style={styles.carouselDots}>
              {carouselSlides.map((slide, index) => (
                <View
                  key={slide.kind === 'custom' ? 'custom' : `g-${index}`}
                  style={[styles.carouselDot, index === carouselIndex && styles.carouselDotActive]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <IosScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formTabWrap}>
            <GuestFormStepTabs
              active={formTab}
              activeStepIndex={activeStepIndex}
              canSwitchTo={canSwitchToTab}
              compact
              onChange={(next) => {
                if (!canSwitchToTab(next)) return;
                if (next !== formTab) softHaptic();
                setFormTab(next);
              }}
            />
          </View>

          <Animated.View style={{ opacity: contentFade }}>
          {formTab === 'customer' ? (
            <View style={styles.formPanel}>
              <AppText style={styles.formSectionLabel}>Your details</AppText>
              <GuestFormIconCard inset>
                <GuestFormIconRow
                  inset
                  icon="User"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Full name"
                  autoCapitalize="words"
                />
                <GuestFormIconRow
                  inset
                  icon="Briefcase"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  placeholder="Job title"
                  autoCapitalize="words"
                />
                <GuestFormIconRow
                  inset
                  icon="Building2"
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Company"
                />
                <GuestFormIconRow
                  inset
                  icon="Mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <GuestFormIconRow
                  inset
                  icon="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                />
                <GuestFormIconRow
                  inset
                  icon="Send"
                  value={telegram}
                  onChangeText={setTelegram}
                  placeholder="Telegram (optional)"
                  autoCapitalize="none"
                  last
                />
              </GuestFormIconCard>
            </View>
          ) : null}

          {formTab === 'product' ? (
            <View style={styles.formPanel}>
              <PhotoBanner
                marketingSceneId="design-card"
                cacheKey="marketing-design-card"
                variant="strip"
                overlay="product"
              >
                <View style={styles.productBannerCopy}>
                  <AppText style={styles.productBannerTitle}>Choose the real card finish</AppText>
                  <AppText style={styles.productBannerSub}>
                    Preview color, material, and custom-photo card styles before checkout.
                  </AppText>
                </View>
              </PhotoBanner>

              {segment === 'physical' ? (
                <View style={styles.formSubsection}>
                  <AppText style={styles.formSubsectionTitle}>Material</AppText>
                  <View style={styles.pillRow}>
                    {materialOptions.map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={[styles.pill, product === opt.value && styles.pillActive]}
                        onPress={() => setProduct(opt.value)}
                          testID={`guest-material-${opt.value}`}
                      >
                        <AppText style={[styles.pillText, product === opt.value && styles.pillTextActive]}>
                          {opt.label}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.formSubsection}>
                <AppText style={styles.formSubsectionTitle}>Finish</AppText>
                <View style={styles.pillRow}>
                  {guestCardFinishOptions.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.pill,
                        (cardDesign === opt.value || (opt.value === 'custom' && isCustomCarouselSlot)) &&
                          styles.pillActive,
                      ]}
                      onPress={() => handleFinishSelect(opt.value)}
                      testID={`guest-finish-${opt.value}`}
                    >
                      <AppText
                        style={[
                          styles.pillText,
                          (cardDesign === opt.value || (opt.value === 'custom' && isCustomCarouselSlot)) &&
                            styles.pillTextActive,
                        ]}
                      >
                        {opt.label}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {isCustomCarouselSlot ? (
              <View style={styles.formSubsection}>
                <AppText style={styles.formSubsectionTitle}>Custom photo</AppText>
                {resolvedCustomImageUri ? (
                  <View style={styles.photoActions}>
                    <Pressable
                      onPress={() => void handlePickCustomImage(false)}
                      accessibilityRole="button"
                    >
                      <AppText style={styles.changePhotoText}>Change photo</AppText>
                    </Pressable>
                    <Pressable onPress={handleRemoveCustomImage} accessibilityRole="button">
                      <AppText style={styles.removePhotoText}>Remove photo</AppText>
                    </Pressable>
                  </View>
                ) : (
                  <AppText style={styles.fieldHint}>
                    Swipe to the custom card and tap the preview, or use the buttons below.
                  </AppText>
                )}
                <View style={styles.uploadRow}>
                  <Pressable
                    style={({ pressed }) => [styles.uploadBtn, pressed && styles.uploadBtnPressed]}
                    onPress={() => void handlePickCustomImage(false)}
                    accessibilityRole="button"
                    testID="guest-upload-gallery"
                  >
                    <SquircleIconTile name="Image" sizeKey="sm" />
                    <AppText style={styles.uploadBtnText}>Gallery</AppText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.uploadBtn, pressed && styles.uploadBtnPressed]}
                    onPress={() => void handlePickCustomImage(true)}
                    accessibilityRole="button"
                    testID="guest-upload-camera"
                  >
                    <SquircleIconTile name="ScanLine" sizeKey="sm" />
                    <AppText style={styles.uploadBtnText}>Camera</AppText>
                  </Pressable>
                </View>
              </View>
              ) : null}
            </View>
          ) : null}

          {formTab === 'payment' ? (
            <View style={styles.formPanel}>
              <View style={styles.paymentHero}>
                <View style={styles.paymentHeroHead}>
                  <View style={styles.paymentHeroIcon}>
                    <AppIcon name="Wallet" size={20} color={guestUi.accent} />
                  </View>
                  <View style={styles.paymentHeroCopy}>
                    <AppText style={styles.paymentHeroTitle}>Pay with real Cambodia methods</AppText>
                    <AppText style={styles.paymentHeroSub}>
                      ABA Pay, ACLEDA, Wing, Pi Pay, TrueMoney, and KHQR.
                    </AppText>
                  </View>
                </View>
                <PaymentBrandStrip logoSize={34} gap={8} />
              </View>

              <GuestFormIconCard flat>
                <GuestFormSummaryRow compact icon="CreditCard" label="Card" value={cardTypeLabel} />
                {segment === 'physical' ? (
                  <GuestFormSummaryRow compact icon="Package" label="Material" value={materialLabel} />
                ) : null}
                <GuestFormSummaryRow compact icon="Sparkles" label="Finish" value={designSummary} />
                <GuestFormSummaryRow
                  compact
                  icon="Wallet"
                  label="Total"
                  value={formatFooterDualPrice(priceUsd)}
                  last={!paymentMethod}
                />
                {paymentMethod ? (
                  <GuestFormSummaryRow
                    compact
                    icon="CircleDollarSign"
                    label="Pay with"
                    value={paymentMethodLabel(paymentMethod)}
                    last
                  />
                ) : null}
              </GuestFormIconCard>

              <View style={styles.formSubsection}>
                <AppText style={styles.formSubsectionTitle}>Payment</AppText>
                <CambodiaPaymentSelector
                  value={paymentMethod}
                  onChange={(id) => {
                    softHaptic();
                    setPaymentMethod(id);
                  }}
                  allowCashOnDelivery={segment === 'physical'}
                  accentColor={guestUi.accent}
                  borderColor={guestUi.border}
                  mutedColor={guestUi.muted}
                  textColor={guestUi.text}
                />
              </View>

              <View style={styles.trustList}>
                {PAYMENT_TRUST_ITEMS.map((item) => (
                  <View key={item.title} style={styles.trustRow}>
                    <AppIcon name={item.icon} size={14} color={guestUi.muted} />
                    <AppText style={styles.trustRowBody}>{item.body}</AppText>
                  </View>
                ))}
              </View>

            </View>
          ) : null}
          </Animated.View>
        </IosScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, iosDesign.spacing.md) }]}>
          <Pressable
            onPress={() => void handleApply()}
            style={({ pressed }) => [styles.applyBtn, pressed && styles.applyBtnPressed]}
            accessibilityRole="button"
            testID="guest-design-continue"
          >
            <AppIcon name="Save" size={20} color="#FFFFFF" />
            <AppText style={styles.applyBtnText}>{applyLabel}</AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: iosDesign.spacing.xs,
    paddingVertical: 6,
    gap: 6,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackPressed: { opacity: 0.55 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: guestUi.text,
    letterSpacing: -0.2,
  },
  headerSegment: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  headerSegBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: guestUi.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  headerSegBtnActive: {
    backgroundColor: guestUi.accent,
    borderColor: guestUi.accent,
  },
  headerSegLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: guestUi.muted,
    letterSpacing: -0.1,
  },
  headerSegLabelActive: {
    color: '#FFFFFF',
  },
  previewSection: {
    flexShrink: 0,
    paddingBottom: 2,
  },
  socialComposer: {
    marginHorizontal: 14,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    ...guestUi.shadow,
  },
  socialCover: {
    height: 116,
    backgroundColor: guestUi.accent,
  },
  socialCoverToolbar: {
    position: 'absolute',
    right: 12,
    bottom: 10,
  },
  coverTool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  coverToolText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter_800ExtraBold',
  },
  socialComposerBody: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 14,
    marginTop: -38,
  },
  socialAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 4,
    borderColor: guestUi.surface,
  },
  socialAvatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Inter_900Black',
  },
  avatarCamera: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: guestUi.accent,
    borderWidth: 2,
    borderColor: guestUi.surface,
  },
  socialComposerCopy: {
    width: '100%',
    gap: 7,
    alignItems: 'center',
  },
  socialName: {
    fontSize: 21,
    fontWeight: '900',
    color: guestUi.text,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
  },
  socialSub: {
    fontSize: 12,
    fontWeight: '700',
    color: guestUi.muted,
    fontFamily: 'Inter_700Bold',
  },
  socialPrompt: {
    width: '100%',
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: guestUi.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  socialPromptPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  socialPromptText: {
    fontSize: 14,
    fontWeight: '600',
    color: guestUi.muted,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  socialActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: guestUi.border,
  },
  socialAction: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  socialActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: guestUi.text,
    fontFamily: 'Inter_800ExtraBold',
  },
  realShowcase: {
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: guestUi.border,
    backgroundColor: guestUi.surfaceSoft,
  },
  realProductBanner: {
    height: 92,
    shadowOpacity: 0,
    elevation: 0,
  },
  realProductCopy: {
    gap: 3,
  },
  realProductTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.4,
  },
  realProductSub: {
    maxWidth: 250,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'Inter_700Bold',
  },
  realPaymentStrip: {
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  realPaymentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  realPaymentTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: guestUi.text,
    fontFamily: 'Inter_900Black',
  },
  realPaymentSub: {
    fontSize: 11,
    fontWeight: '700',
    color: guestUi.accent,
    fontFamily: 'Inter_700Bold',
  },
  formScroll: { flex: 1 },
  scroll: {
    paddingTop: 2,
    paddingBottom: 100,
    gap: 10,
  },
  formTabWrap: {
    marginHorizontal: 14,
    marginTop: 0,
    marginBottom: 2,
  },
  formPanel: {
    marginHorizontal: 14,
    gap: 10,
  },
  formSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: guestUi.muted,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginBottom: -2,
    paddingHorizontal: 4,
  },
  formSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  formSectionCopy: {
    flex: 1,
    gap: 1,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: guestUi.text,
    letterSpacing: -0.2,
  },
  formSectionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: guestUi.muted,
  },
  formSubsection: {
    gap: 6,
  },
  formSubsectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: guestUi.text,
    letterSpacing: -0.1,
  },
  productBannerCopy: {
    gap: 4,
  },
  productBannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.4,
  },
  productBannerSub: {
    maxWidth: 260,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 17,
    fontFamily: 'Inter_700Bold',
  },
  paymentHero: {
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    ...guestUi.shadow,
  },
  paymentHeroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: guestUi.accentSoft,
  },
  paymentHeroCopy: {
    flex: 1,
    gap: 3,
  },
  paymentHeroTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: guestUi.text,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.2,
  },
  paymentHeroSub: {
    fontSize: 11,
    fontWeight: '600',
    color: guestUi.muted,
    lineHeight: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  trustList: {
    gap: 8,
    paddingTop: 4,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  trustRowBody: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: guestUi.muted,
    lineHeight: 15,
  },
  carouselList: { flexGrow: 0 },
  carouselItem: {
    transform: [{ scale: 1 }],
  },
  carouselDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 6,
    paddingBottom: 2,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(60,60,67,0.18)',
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: guestUi.accent,
  },
  fieldHint: { fontSize: 11, fontWeight: '500', color: guestUi.muted, marginBottom: 2 },
  photoActions: {
    flexDirection: 'row',
    gap: iosDesign.spacing.md,
    marginBottom: 4,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: guestUi.accent,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: guestUi.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  pillActive: { backgroundColor: guestUi.accent, borderColor: guestUi.accent },
  pillText: { fontSize: 12, fontWeight: '600', color: guestUi.muted },
  pillTextActive: { color: '#fff' },
  uploadRow: { flexDirection: 'row', gap: 8 },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: guestUi.radiusMd,
    backgroundColor: guestUi.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  uploadBtnPressed: { opacity: 0.88 },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: guestUi.text,
  },
  removePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: guestUi.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: guestUi.border,
  },
  applyBtn: {
    backgroundColor: guestUi.accent,
    flexDirection: 'row',
    borderRadius: iosDesign.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
});
