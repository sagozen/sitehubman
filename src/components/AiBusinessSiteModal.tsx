import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { AppText } from '@/src/components/AppText';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';
import { saveGuestCardDraft } from '@/src/services/guestDraftService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Business Category Data ───────────────────────────────────────────────────

export interface BusinessCategory {
  id: string;
  name: string;
  emoji: string;
  icon: AppIconName;
  tagline: string;
  sampleItems: { name: string; price: string; desc: string }[];
  defaultHours: string;
  ctaText: string;
  ctaAction: string;
  accentColor: string;
  cardGradient: readonly [string, string, string];
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: 'food',
    name: 'Café & Restaurant',
    emoji: '🍽️',
    icon: 'Coffee',
    tagline: 'Artisanal coffee, fresh brunch & organic pastries',
    sampleItems: [
      { name: 'Cold Brew Signature', price: '$5.50', desc: 'Single-origin Ethiopian 18hr slow drip' },
      { name: 'Truffle Avocado Toast', price: '$14.00', desc: 'Poached eggs, sourdough, shaved black truffle' },
      { name: 'Matcha Basque Cheesecake', price: '$8.50', desc: 'Kyoto Uji matcha with burnt caramelized crust' },
    ],
    defaultHours: 'Mon – Sun: 7:30 AM – 9:00 PM',
    ctaText: 'Order / Reserve Table',
    ctaAction: 'Order Online',
    accentColor: '#FF9F0A',
    cardGradient: ['#2D1B00', '#1C1200', '#0D0800'],
  },
  {
    id: 'consultant',
    name: 'Consultant & Agency',
    emoji: '💼',
    icon: 'Briefcase',
    tagline: 'High-ticket strategic advisory & growth consulting',
    sampleItems: [
      { name: '1-on-1 Growth Audit', price: '$350', desc: '60-min deep dive session + action plan document' },
      { name: 'Monthly Advisory Retainer', price: '$2,500/mo', desc: 'Bi-weekly sprints, Slack access & review' },
      { name: 'Enterprise Architecture Review', price: 'Custom', desc: 'Full infrastructure security & scale audit' },
    ],
    defaultHours: 'Mon – Fri: 9:00 AM – 6:00 PM (By Appt)',
    ctaText: 'Book 30-Min Discovery Call',
    ctaAction: 'Schedule Call',
    accentColor: '#0A84FF',
    cardGradient: ['#001230', '#000D22', '#000814'],
  },
  {
    id: 'salon',
    name: 'Salon & Beauty Clinic',
    emoji: '💇',
    icon: 'Sparkles',
    tagline: 'Luxury bespoke grooming, skincare & styling',
    sampleItems: [
      { name: 'Signature Executive Cut & Beard', price: '$65', desc: 'Hot towel ritual, scalp massage & finish' },
      { name: 'Hydra-Glow Facial Treatment', price: '$120', desc: 'Deep exfoliation, peptide infusion & LED mask' },
      { name: 'Balayage & Gloss Styling', price: '$180+', desc: 'Custom master colorist & bond builder treatment' },
    ],
    defaultHours: 'Tue – Sat: 10:00 AM – 8:00 PM',
    ctaText: 'Book Appointment',
    ctaAction: 'Book Now',
    accentColor: '#FF375F',
    cardGradient: ['#2D0014', '#1C000D', '#0D0007'],
  },
  {
    id: 'realestate',
    name: 'Real Estate & Property',
    emoji: '🏡',
    icon: 'Home',
    tagline: 'Prime residential & commercial property acquisitions',
    sampleItems: [
      { name: 'Penthouse Marina Bay View', price: '$1,850,000', desc: '3 Bed, 3 Bath, Private elevator, 2,400 sqft' },
      { name: 'Modern Minimalist Villa', price: '$920,000', desc: 'Infinity pool, smart home, 4 Bed 4 Bath' },
      { name: 'Free Property Valuation', price: 'FREE', desc: 'Comprehensive neighborhood comp & price estimate' },
    ],
    defaultHours: 'Mon – Sun: 8:00 AM – 7:00 PM',
    ctaText: 'Request Private Tour',
    ctaAction: 'View Listings',
    accentColor: '#30D158',
    cardGradient: ['#002820', '#001A14', '#000D0A'],
  },
  {
    id: 'contractor',
    name: 'Trades & Contractors',
    emoji: '🔧',
    icon: 'Tool',
    tagline: 'Licensed electrical, plumbing & HVAC engineering',
    sampleItems: [
      { name: 'Emergency Diagnostic Callout', price: '$89', desc: 'On-site within 45 minutes, 24/7 dispatched' },
      { name: 'Full HVAC System Tune-Up', price: '$180', desc: 'Refrigerant check, coil clean & safety test' },
      { name: 'Commercial Installation Quote', price: 'FREE', desc: 'Free on-premise inspection & detailed estimate' },
    ],
    defaultHours: '24/7 Dispatch Available',
    ctaText: 'Call Dispatch Now',
    ctaAction: 'Call Now',
    accentColor: '#FFD60A',
    cardGradient: ['#2D2500', '#1C1700', '#0D0B00'],
  },
  {
    id: 'fitness',
    name: 'Fitness & Personal Training',
    emoji: '💪',
    icon: 'Zap',
    tagline: 'Elite coaching, body transformation & peak performance',
    sampleItems: [
      { name: '1-on-1 Personal Training', price: '$120/hr', desc: 'Custom program design, form coaching & results' },
      { name: '12-Week Body Transformation', price: '$899', desc: 'Full nutrition plan, check-ins & app access' },
      { name: 'Online Coaching Program', price: '$199/mo', desc: 'Remote coaching, macro plans & weekly calls' },
    ],
    defaultHours: 'Mon – Sat: 6:00 AM – 9:00 PM',
    ctaText: 'Book Free Intro Session',
    ctaAction: 'Book Now',
    accentColor: '#BF5AF2',
    cardGradient: ['#1A0030', '#110020', '#080010'],
  },
  {
    id: 'retail',
    name: 'Retail & E-Commerce',
    emoji: '🛍️',
    icon: 'ShoppingBag',
    tagline: 'Premium curated products & exclusive limited collections',
    sampleItems: [
      { name: 'Signature Collection Drop', price: '$189', desc: 'Hand-picked, limited edition seasonal pieces' },
      { name: 'Custom Monogram Bundle', price: '$89', desc: 'Personalized gift sets, next-day dispatch' },
      { name: 'VIP Loyalty Member Offer', price: '20% OFF', desc: 'Exclusive pre-launch access & free shipping' },
    ],
    defaultHours: 'Mon – Sat: 10:00 AM – 7:00 PM',
    ctaText: 'Shop Latest Collection',
    ctaAction: 'Shop Now',
    accentColor: '#FF6B35',
    cardGradient: ['#2D1200', '#1C0C00', '#0D0600'],
  },
  {
    id: 'medical',
    name: 'Healthcare & Wellness',
    emoji: '⚕️',
    icon: 'Heart',
    tagline: 'Personalised healthcare, wellness & concierge medicine',
    sampleItems: [
      { name: 'Comprehensive Health Screening', price: '$250', desc: 'Full blood panel, cardiac & metabolic workup' },
      { name: 'Concierge GP Consult (Virtual)', price: '$95', desc: '30-min telemedicine with same-day prescriptions' },
      { name: 'IV Wellness Infusion Therapy', price: '$180', desc: 'Custom vitamin drips, NAD+, glutathione' },
    ],
    defaultHours: 'Mon – Fri: 8:00 AM – 6:00 PM',
    ctaText: 'Book Consultation',
    ctaAction: 'Book Now',
    accentColor: '#32D74B',
    cardGradient: ['#002810', '#001A0A', '#000D05'],
  },
];

// ─── Generation Phase Steps ───────────────────────────────────────────────────

const GENERATION_STEPS = [
  { icon: '🎯', text: 'Analyzing business niche & target audience...' },
  { icon: '📋', text: 'Generating services, pricing & descriptions...' },
  { icon: '📅', text: 'Configuring booking engine & business hours...' },
  { icon: '🎴', text: 'Designing Physical NFC Print-on-Demand card...' },
  { icon: '✅', text: 'Mini-site is live and ready to share!' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AiBusinessSiteModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (siteData: {
    businessName: string;
    category: BusinessCategory;
    contact: string;
  }) => void;
  initialBusinessName?: string;
}

// ─── Pulsing Ring Component ───────────────────────────────────────────────────

function PulsingRing({ color = '#1DB954' }: { color?: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 600, easing: Easing.in(Easing.quad) })
      ),
      -1
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(0.5, { duration: 600 })
      ),
      -1
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={pulseStyles.wrapper}>
      <Animated.View
        style={[
          pulseStyles.ring,
          { borderColor: color },
          animStyle,
        ]}
      />
      <View style={[pulseStyles.innerCircle, { backgroundColor: `${color}20` }]}>
        <AppIcon name="Sparkles" size={32} color={color} />
      </View>
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  wrapper: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export function AiBusinessSiteModal({
  visible,
  onClose,
  onComplete,
  initialBusinessName = '',
}: AiBusinessSiteModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>(BUSINESS_CATEGORIES[0]);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [tagline, setTagline] = useState(BUSINESS_CATEGORIES[0].tagline);
  const [contact, setContact] = useState('');
  const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
  const [generationPhase, setGenerationPhase] = useState(0);
  const [activeTab, setActiveTab] = useState<'site' | 'card'>('site');

  // Reset on open
  useEffect(() => {
    if (visible) {
      setStep('input');
      setBusinessName(initialBusinessName);
      setSelectedCategory(BUSINESS_CATEGORIES[0]);
      setTagline(BUSINESS_CATEGORIES[0].tagline);
      setContact('');
      setGenerationPhase(0);
      setActiveTab('site');
    }
  }, [visible]);

  const handleSelectCategory = useCallback((cat: BusinessCategory) => {
    HapticTap.light();
    setSelectedCategory(cat);
    setTagline(cat.tagline);
  }, []);

  const handleStartAiGeneration = useCallback(() => {
    if (!businessName.trim()) return;
    HapticTap.heavy();
    setStep('generating');
    setGenerationPhase(0);

    const timers = GENERATION_STEPS.map((_, idx) =>
      setTimeout(() => setGenerationPhase(idx), idx * 600)
    );

    setTimeout(async () => {
      try {
        await saveGuestCardDraft({
          displayName: businessName.trim(),
          jobTitle: selectedCategory.name,
          company: businessName.trim(),
          email: contact.includes('@') ? contact.trim() : '',
          phone: !contact.includes('@') ? contact.trim() : '',
          product: 'pvc_card',
          cardDesign: 'classic_black',
          cardChoice: 'physical',
          gradientIndex: 0,
        });
      } catch {
        // non-blocking
      }
      setStep('preview');
      HapticTap.success();
    }, GENERATION_STEPS.length * 600 + 400);

    return () => timers.forEach(clearTimeout);
  }, [businessName, selectedCategory, contact]);

  const handleShareSite = useCallback(async () => {
    HapticTap.light();
    try {
      await Share.share({
        message: `Check out my business mini-site powered by SiteHub!\n\n📍 ${businessName}\n🔗 sitehub.app/${businessName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${businessName} — Business Mini-Site`,
      });
    } catch {
      // ignore
    }
  }, [businessName]);

  const handleReset = useCallback(() => {
    HapticTap.light();
    setStep('input');
  }, []);

  const accent = selectedCategory.accentColor;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.container}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.sparkleBadge}>
                <AppIcon name="Sparkles" size={11} color="#1DB954" />
                <AppText style={styles.badgeText} weight="bold">AI MINI-SITE ENGINE</AppText>
              </View>
              <View style={styles.podBadge}>
                <AppIcon name="Nfc" size={11} color="#FFFFFF" />
                <AppText style={styles.podBadgeText} weight="bold">NFC POD CARD</AppText>
              </View>
            </View>
            <AppText style={styles.headerTitle} weight="extrabold">
              {step === 'preview' ? '🚀 Your Mini-Site is Live!' : 'AI Business Mini-Site'}
            </AppText>
            <AppText style={styles.headerSubtitle}>
              {step === 'preview'
                ? 'Share it, publish it, or order your NFC card'
                : 'From nothing to a real business site in 30 seconds'}
            </AppText>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <AppIcon name="X" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── STEP 1: Input ──────────────────────────────────────────────── */}
        {step === 'input' && (
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Value Prop Card */}
            <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.explainerCard}>
              <View style={styles.explainerIconRow}>
                <AppText style={styles.explainerEmoji}>⚡</AppText>
                <AppText style={styles.explainerQuote} weight="medium">
                  "Most link-in-bios are just a list of buttons. SiteHub generates an actual site with your menu, prices, hours & 1-tap booking in 30 seconds."
                </AppText>
              </View>
            </Animated.View>

            {/* Step 1 – Industry */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <AppText style={styles.sectionLabel} weight="bold">1. Select Your Industry</AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChips}
              >
                {BUSINESS_CATEGORIES.map((cat, idx) => {
                  const isSelected = cat.id === selectedCategory.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => handleSelectCategory(cat)}
                      style={[
                        styles.categoryChip,
                        isSelected && {
                          backgroundColor: cat.accentColor,
                          borderColor: cat.accentColor,
                        },
                      ]}
                    >
                      <AppText style={styles.categoryChipEmoji}>{cat.emoji}</AppText>
                      <AppText
                        style={[styles.categoryChipText, isSelected && { color: '#000000' }]}
                        weight="bold"
                      >
                        {cat.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Step 2 – Business Details */}
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <AppText style={styles.sectionLabel} weight="bold">2. Business Details</AppText>
              <View style={styles.inputGroup}>
                <AppText style={styles.fieldTitle}>Business or Professional Name *</AppText>
                <View style={styles.inputBox}>
                  <AppIcon name="Building" size={18} color="#8E8E93" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Apex Architects, Kroma Salon, Chef Daniel"
                    placeholderTextColor="#555558"
                    value={businessName}
                    onChangeText={setBusinessName}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.fieldTitle}>One-Line Tagline (or your specialty)</AppText>
                <View style={styles.inputBox}>
                  <AppIcon name="Tag" size={18} color="#8E8E93" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="What makes your service exceptional?"
                    placeholderTextColor="#555558"
                    value={tagline}
                    onChangeText={setTagline}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.fieldTitle}>WhatsApp, Phone or Booking URL</AppText>
                <View style={styles.inputBox}>
                  <AppIcon name="Phone" size={18} color="#8E8E93" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+1 555 019 2831 or calendly.com/you"
                    placeholderTextColor="#555558"
                    value={contact}
                    onChangeText={setContact}
                    autoCapitalize="none"
                    keyboardType="url"
                    returnKeyType="done"
                  />
                </View>
              </View>
            </Animated.View>

            {/* Feature Bullets */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.featureBullets}>
              {[
                { icon: '📋', text: 'AI-generated services & pricing table' },
                { icon: '📅', text: 'Live booking & business hours engine' },
                { icon: '🎴', text: 'Physical NFC Print-on-Demand card' },
                { icon: '🔗', text: 'Custom shareable link for all platforms' },
              ].map((f, i) => (
                <View key={i} style={styles.featureBullet}>
                  <AppText style={styles.featureBulletEmoji}>{f.icon}</AppText>
                  <AppText style={styles.featureBulletText}>{f.text}</AppText>
                </View>
              ))}
            </Animated.View>

            {/* CTA */}
            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <Pressable
                onPress={handleStartAiGeneration}
                disabled={!businessName.trim()}
                style={({ pressed }) => [
                  styles.generateCta,
                  !businessName.trim() && styles.generateCtaDisabled,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
              >
                <LinearGradient
                  colors={
                    businessName.trim()
                      ? ['#FFFFFF', '#E5E5EA']
                      : ['#2C2C2E', '#2C2C2E']
                  }
                  style={styles.generateCtaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <AppText style={styles.generateCtaEmoji}>✨</AppText>
                  <AppText
                    style={[styles.generateCtaText, !businessName.trim() && { color: '#8E8E93' }]}
                    weight="extrabold"
                  >
                    Generate AI Mini-Site & NFC Card
                  </AppText>
                  <View style={styles.generateCtaBadge}>
                    <AppText style={styles.generateCtaBadgeText} weight="bold">30s</AppText>
                  </View>
                </LinearGradient>
              </Pressable>
              <AppText style={styles.bottomMicroText}>
                No credit card required · Instant mobile preview
              </AppText>
            </Animated.View>
          </ScrollView>
        )}

        {/* ── STEP 2: Generating ─────────────────────────────────────────── */}
        {step === 'generating' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.generatingContainer}>
            <PulsingRing color={accent} />

            <AppText style={styles.generatingTitle} weight="extrabold">
              Synthesizing Your Mini-Site
            </AppText>
            <AppText style={[styles.generatingBiz, { color: accent }]} weight="bold">
              {businessName}
            </AppText>

            {/* Step List */}
            <View style={styles.stepsList}>
              {GENERATION_STEPS.map((s, idx) => {
                const isDone = idx < generationPhase;
                const isActive = idx === generationPhase;
                return (
                  <View key={idx} style={styles.stepRow}>
                    <View style={[
                      styles.stepDot,
                      isDone && { backgroundColor: '#30D158' },
                      isActive && { backgroundColor: accent, borderColor: accent },
                    ]}>
                      {isDone
                        ? <AppIcon name="Check" size={10} color="#000000" />
                        : isActive
                          ? <ActivityIndicator size="small" color="#000000" />
                          : null
                      }
                    </View>
                    <AppText
                      style={[
                        styles.stepText,
                        isDone && { color: '#30D158' },
                        isActive && { color: '#FFFFFF' },
                      ]}
                    >
                      {GENERATION_STEPS[idx].icon} {s.text}
                    </AppText>
                  </View>
                );
              })}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(100, ((generationPhase + 1) / GENERATION_STEPS.length) * 100)}%`,
                    backgroundColor: accent,
                  },
                ]}
              />
            </View>
          </Animated.View>
        )}

        {/* ── STEP 3: Preview ────────────────────────────────────────────── */}
        {step === 'preview' && (
          <Animated.View entering={FadeInUp.springify()} style={styles.previewContainer}>

            {/* Tab Switcher */}
            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => { HapticTap.light(); setActiveTab('site'); }}
                style={[styles.segmentBtn, activeTab === 'site' && styles.segmentBtnActive]}
              >
                <AppText style={[styles.segmentText, activeTab === 'site' && styles.segmentTextActive]}>
                  🌐 AI Mini-Site
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => { HapticTap.light(); setActiveTab('card'); }}
                style={[styles.segmentBtn, activeTab === 'card' && styles.segmentBtnActive]}
              >
                <AppText style={[styles.segmentText, activeTab === 'card' && styles.segmentTextActive]}>
                  🎴 NFC POD Card
                </AppText>
              </Pressable>
            </View>

            {activeTab === 'site' ? (
              <ScrollView style={styles.siteScroll} showsVerticalScrollIndicator={false}>
                {/* Phone Mockup */}
                <View style={styles.phoneMockup}>
                  {/* URL Bar */}
                  <View style={styles.urlBar}>
                    <AppIcon name="Globe" size={12} color="#30D158" />
                    <AppText style={styles.urlText} weight="medium">
                      sitehub.app/{businessName.toLowerCase().replace(/\s+/g, '-')}
                    </AppText>
                    <View style={styles.secureBadge}>
                      <AppIcon name="Lock" size={10} color="#30D158" />
                    </View>
                  </View>

                  {/* Business Header */}
                  <View style={styles.mockupHeader}>
                    <View style={[styles.mockupAvatar, { backgroundColor: accent }]}>
                      <AppText style={styles.mockupAvatarText} weight="extrabold">
                        {(businessName[0] || 'B').toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.mockupMeta}>
                      <AppText style={styles.mockupBizName} weight="extrabold">{businessName}</AppText>
                      <AppText style={styles.mockupCategory}>{selectedCategory.name}</AppText>
                    </View>
                    <View style={styles.liveOpenBadge}>
                      <View style={styles.liveGreenDot} />
                      <AppText style={styles.liveOpenText} weight="bold">OPEN</AppText>
                    </View>
                  </View>

                  <AppText style={styles.mockupTagline}>{tagline}</AppText>

                  {/* Hours Card */}
                  <View style={[styles.hoursCard, { borderLeftColor: accent }]}>
                    <AppIcon name="Clock" size={14} color={accent} />
                    <AppText style={styles.hoursText}>{selectedCategory.defaultHours}</AppText>
                  </View>

                  {/* Primary CTA */}
                  <Pressable style={[styles.sitePrimaryCta, { backgroundColor: accent }]}>
                    <AppText
                      style={[styles.sitePrimaryCtaText, { color: '#000000' }]}
                      weight="extrabold"
                    >
                      {selectedCategory.ctaText}
                    </AppText>
                  </Pressable>

                  {/* Contact Row */}
                  {contact.trim() !== '' && (
                    <View style={styles.contactRow}>
                      <AppIcon name="Phone" size={14} color="#8E8E93" />
                      <AppText style={styles.contactText}>{contact}</AppText>
                    </View>
                  )}

                  {/* Services & Pricing Table */}
                  <View style={styles.menuSection}>
                    <View style={styles.menuHeaderRow}>
                      <AppText style={styles.menuTitle} weight="extrabold">
                        {selectedCategory.id === 'food' ? '🍽️ Featured Menu' : '📋 Services & Pricing'}
                      </AppText>
                      <View style={[styles.aiGenBadge, { backgroundColor: `${accent}20` }]}>
                        <AppText style={[styles.aiGenBadgeText, { color: accent }]} weight="bold">
                          AI GENERATED
                        </AppText>
                      </View>
                    </View>

                    {selectedCategory.sampleItems.map((item, idx) => (
                      <Animated.View
                        key={idx}
                        entering={FadeInDown.delay(idx * 80).springify()}
                        style={styles.menuItemRow}
                      >
                        <View style={styles.menuItemLeft}>
                          <AppText style={styles.menuItemName} weight="bold">{item.name}</AppText>
                          <AppText style={styles.menuItemDesc}>{item.desc}</AppText>
                        </View>
                        <View style={[styles.menuPriceBadge, { borderColor: `${accent}40` }]}>
                          <AppText style={[styles.menuPriceText, { color: accent }]} weight="extrabold">
                            {item.price}
                          </AppText>
                        </View>
                      </Animated.View>
                    ))}
                  </View>

                  {/* Social Share Row */}
                  <View style={styles.socialShareRow}>
                    <AppText style={styles.socialShareLabel}>Share via:</AppText>
                    {['Share2', 'MessageCircle', 'Instagram', 'Linkedin'].map((icon, i) => (
                      <Pressable key={i} style={styles.socialShareIcon} onPress={handleShareSite}>
                        <AppIcon name={icon as AppIconName} size={18} color="#FFFFFF" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.siteScroll}
                contentContainerStyle={styles.cardTabContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Physical Card Mockup */}
                <Animated.View entering={ZoomIn.springify()} style={styles.physicalCardWrapper}>
                  <LinearGradient
                    colors={selectedCategory.cardGradient}
                    style={styles.physicalCardFront}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Card Top */}
                    <View style={styles.cardChipRow}>
                      <View style={styles.goldChip}>
                        <View style={styles.chipGrid}>
                          {[0, 1, 2, 3, 4, 5].map(i => (
                            <View key={i} style={styles.chipCell} />
                          ))}
                        </View>
                      </View>
                      <AppIcon name="Nfc" size={24} color="rgba(255,255,255,0.7)" />
                    </View>

                    {/* Card Middle — Category Accent Line */}
                    <View style={[styles.cardAccentLine, { backgroundColor: accent }]} />

                    {/* Card Bottom */}
                    <View style={styles.cardBottomRow}>
                      <View>
                        <AppText style={styles.cardBizLabel} weight="medium">
                          {selectedCategory.name.toUpperCase()}
                        </AppText>
                        <AppText style={styles.cardBizName} weight="extrabold">
                          {businessName.toUpperCase()}
                        </AppText>
                        {contact.trim() !== '' && (
                          <AppText style={styles.cardContact}>{contact}</AppText>
                        )}
                      </View>
                      <View style={styles.cardPodMarkContainer}>
                        <AppText style={styles.cardPodMark} weight="bold">SITEHUB</AppText>
                        <AppText style={styles.cardPodSubMark}>POD</AppText>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>

                {/* POD Specs */}
                <View style={styles.podSpecsCard}>
                  {[
                    { icon: '✅', text: '1-Tap beams your mini-site to any phone without an app' },
                    { icon: '🎨', text: 'Matte luxury scratch-proof finish, full-color print' },
                    { icon: '🌍', text: 'Print-on-Demand worldwide with free express shipping' },
                    { icon: '🔄', text: 'Update your site anytime — card always stays current' },
                  ].map((spec, i) => (
                    <Animated.View
                      key={i}
                      entering={FadeInDown.delay(i * 60).springify()}
                      style={styles.specRow}
                    >
                      <AppText style={styles.specEmoji}>{spec.icon}</AppText>
                      <AppText style={styles.specText}>{spec.text}</AppText>
                    </Animated.View>
                  ))}
                </View>

                {/* Order CTA */}
                <Pressable
                  style={({ pressed }) => [
                    styles.orderPodCta,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => { HapticTap.heavy(); onClose(); }}
                >
                  <AppText style={styles.orderPodCtaEmoji}>🛍️</AppText>
                  <AppText style={styles.orderPodCtaText} weight="extrabold">
                    Order Physical NFC Card — $29.95
                  </AppText>
                </Pressable>

                <AppText style={styles.podFreeShipping}>✈️ Free worldwide express shipping · Delivered in 5–7 days</AppText>
              </ScrollView>
            )}

            {/* Footer Actions */}
            <View style={styles.footerActions}>
              <Pressable style={styles.shareBtn} onPress={handleShareSite}>
                <AppIcon name="Share2" size={18} color="#FFFFFF" />
                <AppText style={styles.shareBtnText} weight="bold">Share</AppText>
              </Pressable>
              <Pressable style={styles.editBtn} onPress={handleReset}>
                <AppIcon name="Edit3" size={16} color="#FFFFFF" />
                <AppText style={styles.editBtnText} weight="bold">Edit</AppText>
              </Pressable>
              <Pressable
                style={styles.activateBtn}
                onPress={() => {
                  HapticTap.success();
                  onComplete?.({ businessName, category: selectedCategory, contact });
                  onClose();
                }}
              >
                <AppText style={styles.activateBtnText} weight="extrabold">
                  🚀 Publish Mini-Site
                </AppText>
              </Pressable>
            </View>
          </Animated.View>
        )}

      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 54 : 30,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.3)',
  },
  badgeText: {
    fontSize: 9,
    color: '#1DB954',
    letterSpacing: 0.8,
  },
  podBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  podBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // ── Input Step
  bodyScroll: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 60 },

  explainerCard: {
    backgroundColor: '#111114',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 24,
  },
  explainerIconRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  explainerEmoji: { fontSize: 22, marginTop: 2 },
  explainerQuote: {
    flex: 1,
    color: '#E5E5EA',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  categoryChips: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipEmoji: { fontSize: 15 },
  categoryChipText: {
    color: '#FFFFFF',
    fontSize: 13,
  },

  inputGroup: { marginBottom: 14 },
  fieldTitle: {
    color: 'rgba(235,235,245,0.6)',
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18181C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    height: 50,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },

  featureBullets: {
    backgroundColor: '#0D0D10',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  featureBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureBulletEmoji: { fontSize: 16 },
  featureBulletText: {
    color: 'rgba(235,235,245,0.75)',
    fontSize: 13,
  },

  generateCta: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  generateCtaDisabled: {
    opacity: 0.5,
  },
  generateCtaGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  generateCtaEmoji: { fontSize: 20 },
  generateCtaText: {
    color: '#000000',
    fontSize: 16,
  },
  generateCtaBadge: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  generateCtaBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  bottomMicroText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },

  // ── Generating Step
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  generatingTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: 4,
    textAlign: 'center',
  },
  generatingBiz: {
    fontSize: 16,
    marginBottom: 28,
    textAlign: 'center',
  },
  stepsList: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    flex: 1,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },

  // ── Preview Step
  previewContainer: { flex: 1 },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  segmentBtnActive: { backgroundColor: '#FFFFFF' },
  segmentText: { color: '#FFFFFF', fontSize: 13 },
  segmentTextActive: { color: '#000000' },

  siteScroll: { flex: 1 },

  phoneMockup: {
    marginHorizontal: 20,
    backgroundColor: '#0D0D10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    marginBottom: 24,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 14,
  },
  urlText: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
  },
  secureBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(48,209,88,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  mockupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupAvatarText: {
    color: '#000000',
    fontSize: 20,
  },
  mockupMeta: { flex: 1 },
  mockupBizName: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  mockupCategory: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 2,
  },
  liveOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.3)',
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  liveOpenText: {
    color: '#30D158',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  mockupTagline: {
    color: '#E5E5EA',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181C',
    padding: 11,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  hoursText: { color: '#E5E5EA', fontSize: 12 },
  sitePrimaryCta: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  sitePrimaryCtaText: { fontSize: 15 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  contactText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  menuSection: {
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingTop: 14,
  },
  menuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: { color: '#FFFFFF', fontSize: 15 },
  aiGenBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  aiGenBadgeText: { fontSize: 9, letterSpacing: 0.5 },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  menuItemLeft: { flex: 1, paddingRight: 12 },
  menuItemName: { color: '#FFFFFF', fontSize: 13, marginBottom: 3 },
  menuItemDesc: { color: '#8E8E93', fontSize: 11, lineHeight: 16 },
  menuPriceBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuPriceText: { fontSize: 13 },
  socialShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  socialShareLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    flex: 1,
  },
  socialShareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // NFC Card
  cardTabContainer: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  physicalCardWrapper: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 16,
    marginBottom: 20,
  },
  physicalCardFront: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  cardChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goldChip: {
    width: 44,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#D4AF37',
    overflow: 'hidden',
    padding: 3,
  },
  chipGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  chipCell: {
    width: '30%',
    height: 8,
    backgroundColor: '#B8860B',
    borderRadius: 1,
  },
  cardAccentLine: {
    height: 2,
    borderRadius: 1,
    width: '40%',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardBizLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 8,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  cardBizName: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.8,
  },
  cardContact: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 3,
  },
  cardPodMarkContainer: { alignItems: 'flex-end' },
  cardPodMark: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  cardPodSubMark: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    letterSpacing: 2,
    textAlign: 'right',
  },

  podSpecsCard: {
    width: '100%',
    backgroundColor: '#111114',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specEmoji: { fontSize: 16 },
  specText: { color: '#E5E5EA', fontSize: 13, flex: 1, lineHeight: 18 },

  orderPodCta: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  orderPodCtaEmoji: { fontSize: 20 },
  orderPodCtaText: { color: '#000000', fontSize: 15 },
  podFreeShipping: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
  },

  // Footer
  footerActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#000000',
  },
  shareBtn: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  shareBtnText: { color: '#FFFFFF', fontSize: 13 },
  editBtn: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  editBtnText: { color: '#FFFFFF', fontSize: 13 },
  activateBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  activateBtnText: { color: '#000000', fontSize: 14 },
});
