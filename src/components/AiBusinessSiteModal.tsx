import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { AppText } from '@/src/components/AppText';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';
import { saveGuestCardDraft } from '@/src/services/guestDraftService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface BusinessCategory {
  id: string;
  name: string;
  icon: AppIconName;
  tagline: string;
  sampleItems: { name: string; price: string; desc: string }[];
  defaultHours: string;
  ctaText: string;
  ctaAction: string;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: 'food',
    name: 'Café & Restaurant',
    icon: 'Coffee',
    tagline: 'Artisanal coffee, fresh brunch & organic pastries',
    sampleItems: [
      { name: 'Cold Brew Signature', price: '$5.50', desc: 'Single-origin Ethiopian 18hr slow drip' },
      { name: 'Truffle Avocado Toast', price: '$14.00', desc: 'Poached eggs, sourdough, shaved black truffle' },
      { name: 'Matcha Basque Cheesecake', price: '$8.50', desc: 'Kyoto Uji matcha with burnt caramelized crust' },
    ],
    defaultHours: 'Mon - Sun: 7:30 AM – 9:00 PM',
    ctaText: 'Order / Reserve Table',
    ctaAction: 'Order Online',
  },
  {
    id: 'consultant',
    name: 'Consultant & Agency',
    icon: 'Briefcase',
    tagline: 'High-ticket strategic advisory & growth consulting',
    sampleItems: [
      { name: '1-on-1 Growth Audit', price: '$350', desc: '60-min deep dive session + action plan' },
      { name: 'Monthly Advisory Retainer', price: '$2,500/mo', desc: 'Bi-weekly sprints, team Slack access & review' },
      { name: 'Enterprise Architecture Review', price: 'Custom', desc: 'Full infrastructure security & scale audit' },
    ],
    defaultHours: 'Mon - Fri: 9:00 AM – 6:00 PM (By Appt)',
    ctaText: 'Book 30-Min Discovery Call',
    ctaAction: 'Schedule Call',
  },
  {
    id: 'salon',
    name: 'Salon & Aesthetic Clinic',
    icon: 'Sparkles',
    tagline: 'Luxury bespoke grooming, skincare & styling',
    sampleItems: [
      { name: 'Signature Executive Cut & Beard', price: '$65', desc: 'Hot towel ritual, scalp massage & styling' },
      { name: 'Hydra-Glow Facial Treatment', price: '$120', desc: 'Deep exfoliation, peptide infusion & LED mask' },
      { name: 'Balayage & Gloss Styling', price: '$180+', desc: 'Custom master colorist treatment & bond builder' },
    ],
    defaultHours: 'Tue - Sat: 10:00 AM – 8:00 PM',
    ctaText: 'Book Appointment',
    ctaAction: 'Book Now',
  },
  {
    id: 'realestate',
    name: 'Real Estate & Property',
    icon: 'Home',
    tagline: 'Prime residential & commercial acquisitions',
    sampleItems: [
      { name: 'Penthouse Marina Bay View', price: '$1,850,000', desc: '3 Bed, 3 Bath, Private elevator, 2,400 sqft' },
      { name: 'Modern Minimalist Villa', price: '$920,000', desc: 'Infinity pool, smart home automated, 4 Bed' },
      { name: 'Free Property Valuation Report', price: 'Free', desc: 'Comprehensive neighborhood comp & price estimate' },
    ],
    defaultHours: 'Mon - Sun: 8:00 AM – 7:00 PM',
    ctaText: 'Request Private Tour',
    ctaAction: 'View Listings',
  },
  {
    id: 'contractor',
    name: 'Trades & Contractors',
    icon: 'Tool',
    tagline: 'Licensed electrical, plumbing & HVAC engineering',
    sampleItems: [
      { name: 'Emergency Diagnostic Callout', price: '$89', desc: 'On-site within 45 minutes, 24/7 dispatched' },
      { name: 'Full HVAC System Tune-Up', price: '$180', desc: 'Refrigerant check, coil cleaning & safety test' },
      { name: 'Commercial Installation Quote', price: '$0', desc: 'Free on-premise inspection & detailed estimate' },
    ],
    defaultHours: '24/7 Dispatch Available',
    ctaText: 'Call Dispatch Now',
    ctaAction: 'Call Now',
  },
];

interface AiBusinessSiteModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (siteData: { businessName: string; category: BusinessCategory; contact: string }) => void;
  initialBusinessName?: string;
}

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

  const generationSteps = [
    'Analyzing business niche & target audience...',
    'Generating services, item descriptions & pricing...',
    'Configuring live business hours & fast booking engine...',
    'Designing Physical NFC Print-on-Demand card face...',
  ];

  const handleSelectCategory = (cat: BusinessCategory) => {
    HapticTap.light();
    setSelectedCategory(cat);
    setTagline(cat.tagline);
  };

  const handleStartAiGeneration = () => {
    if (!businessName.trim()) return;
    HapticTap.heavy();
    setStep('generating');
    setGenerationPhase(0);

    const timer1 = setTimeout(() => setGenerationPhase(1), 700);
    const timer2 = setTimeout(() => setGenerationPhase(2), 1400);
    const timer3 = setTimeout(() => setGenerationPhase(3), 2100);
    const timer4 = setTimeout(async () => {
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
      } catch (err) {
        // non-blocking
      }
      setStep('preview');
      HapticTap.success();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  const handleReset = () => {
    setStep('input');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.sparkleBadge}>
                <AppIcon name="Sparkles" size={12} color="#1DB954" />
                <AppText style={styles.badgeText} weight="bold">AI MINI-SITE ENGINE</AppText>
              </View>
              <View style={styles.podBadge}>
                <AppIcon name="Nfc" size={12} color="#FFFFFF" />
                <AppText style={styles.podBadgeText} weight="bold">NFC POD CARD</AppText>
              </View>
            </View>
            <AppText style={styles.headerTitle} weight="extrabold">
              {step === 'preview' ? 'Your AI Mini-Site is Live' : 'AI Business Mini-Site'}
            </AppText>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <AppIcon name="X" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* STEP 1: Input & Customization */}
        {step === 'input' && (
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.explainerCard}>
              <AppText style={styles.explainerQuote} weight="bold">
                "Most link-in-bios are just a list of buttons. SiteHub generates an actual site with your menu, prices, hours and 1-tap booking in 30 seconds."
              </AppText>
            </View>

            <AppText style={styles.sectionLabel} weight="bold">1. Select Your Business Industry</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
              {BUSINESS_CATEGORIES.map((cat) => {
                const isSelected = cat.id === selectedCategory.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleSelectCategory(cat)}
                    style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  >
                    <AppIcon name={cat.icon} size={16} color={isSelected ? '#000000' : '#FFFFFF'} />
                    <AppText
                      style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
                      weight="bold"
                    >
                      {cat.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <AppText style={styles.sectionLabel} weight="bold">2. Business Details</AppText>
            <View style={styles.inputGroup}>
              <AppText style={styles.fieldTitle}>Business or Professional Name *</AppText>
              <View style={styles.inputBox}>
                <AppIcon name="Building" size={18} color="#8E8E93" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Apex Architecture, Kroma Salon, Chef Daniel"
                  placeholderTextColor="#636366"
                  value={businessName}
                  onChangeText={setBusinessName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.fieldTitle}>One-Line Tagline or Specialty</AppText>
              <View style={styles.inputBox}>
                <AppIcon name="Tag" size={18} color="#8E8E93" />
                <TextInput
                  style={styles.textInput}
                  placeholder="What makes your service exceptional?"
                  placeholderTextColor="#636366"
                  value={tagline}
                  onChangeText={setTagline}
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
                  placeholderTextColor="#636366"
                  value={contact}
                  onChangeText={setContact}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Pressable
              onPress={handleStartAiGeneration}
              disabled={!businessName.trim()}
              style={({ pressed }) => [
                styles.generateCta,
                !businessName.trim() && styles.generateCtaDisabled,
                pressed && { opacity: 0.85 },
              ]}
            >
              <AppIcon name="Sparkles" size={20} color={businessName.trim() ? '#000000' : '#8E8E93'} />
              <AppText style={[styles.generateCtaText, !businessName.trim() && { color: '#8E8E93' }]} weight="extrabold">
                Generate AI Mini-Site & NFC Card (30s)
              </AppText>
            </Pressable>
            <AppText style={styles.bottomMicroText}>No credit card required · Instant mobile preview</AppText>
          </ScrollView>
        )}

        {/* STEP 2: Generating Sequence */}
        {step === 'generating' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.generatingContainer}>
            <View style={styles.loadingSpinnerRing}>
              <ActivityIndicator size="large" color="#1DB954" />
            </View>
            <AppText style={styles.generatingTitle} weight="extrabold">
              Synthesizing Business Mini-Site
            </AppText>
            <AppText style={styles.generatingStatus} weight="medium">
              {generationSteps[generationPhase]}
            </AppText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${(generationPhase + 1) * 25}%` }]} />
            </View>
          </Animated.View>
        )}

        {/* STEP 3: World-Class Dual Preview (Mini-Site + NFC POD Card) */}
        {step === 'preview' && (
          <Animated.View entering={FadeInDown} style={styles.previewContainer}>
            {/* Segmented Toggle: Mini-Site vs Physical NFC Card */}
            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => { HapticTap.light(); setActiveTab('site'); }}
                style={[styles.segmentBtn, activeTab === 'site' && styles.segmentBtnActive]}
              >
                <AppIcon name="Globe" size={16} color={activeTab === 'site' ? '#000000' : '#FFFFFF'} />
                <AppText style={[styles.segmentText, activeTab === 'site' && styles.segmentTextActive]} weight="bold">
                  AI Mini-Site (Live)
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => { HapticTap.light(); setActiveTab('card'); }}
                style={[styles.segmentBtn, activeTab === 'card' && styles.segmentBtnActive]}
              >
                <AppIcon name="CreditCard" size={16} color={activeTab === 'card' ? '#000000' : '#FFFFFF'} />
                <AppText style={[styles.segmentText, activeTab === 'card' && styles.segmentTextActive]} weight="bold">
                  Physical NFC POD Card
                </AppText>
              </Pressable>
            </View>

            {activeTab === 'site' ? (
              <ScrollView style={styles.siteScroll} showsVerticalScrollIndicator={false}>
                {/* Simulated Phone Shell for Mini-Site */}
                <View style={styles.phoneMockup}>
                  {/* Top Bar */}
                  <View style={styles.mockupHeader}>
                    <View style={styles.mockupAvatar}>
                      <AppText style={styles.mockupAvatarText} weight="bold">
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

                  {/* Hours & Instant Booking Bar */}
                  <View style={styles.hoursCard}>
                    <AppIcon name="Clock" size={16} color="#1DB954" />
                    <AppText style={styles.hoursText}>{selectedCategory.defaultHours}</AppText>
                  </View>

                  {/* Primary CTA */}
                  <Pressable style={styles.sitePrimaryCta}>
                    <AppText style={styles.sitePrimaryCtaText} weight="bold">
                      {selectedCategory.ctaText}
                    </AppText>
                  </Pressable>

                  {/* Menu / Services & Real Pricing Table */}
                  <View style={styles.menuSection}>
                    <View style={styles.menuHeaderRow}>
                      <AppText style={styles.menuTitle} weight="extrabold">
                        {selectedCategory.id === 'food' ? 'Featured Menu' : 'Services & Pricing'}
                      </AppText>
                      <AppText style={styles.currencyBadge}>USD ($)</AppText>
                    </View>

                    {selectedCategory.sampleItems.map((item, idx) => (
                      <View key={idx} style={styles.menuItemRow}>
                        <View style={styles.menuItemLeft}>
                          <AppText style={styles.menuItemName} weight="bold">{item.name}</AppText>
                          <AppText style={styles.menuItemDesc}>{item.desc}</AppText>
                        </View>
                        <View style={styles.menuPriceBadge}>
                          <AppText style={styles.menuPriceText} weight="extrabold">{item.price}</AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            ) : (
              <ScrollView style={styles.siteScroll} contentContainerStyle={styles.cardTabContainer}>
                {/* Physical NFC POD Card Mockup */}
                <View style={styles.physicalCardWrapper}>
                  <LinearGradient
                    colors={['#1c1c1e', '#000000', '#111114']}
                    style={styles.physicalCardFront}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardChipRow}>
                      <View style={styles.goldChip}>
                        <View style={styles.chipInner} />
                      </View>
                      <AppIcon name="Nfc" size={26} color="#FFFFFF" />
                    </View>
                    <View style={styles.cardBottomRow}>
                      <View>
                        <AppText style={styles.cardBizLabel} weight="medium">SMART NFC SMARTPASS</AppText>
                        <AppText style={styles.cardBizName} weight="extrabold">
                          {businessName.toUpperCase()}
                        </AppText>
                      </View>
                      <AppText style={styles.cardPodMark} weight="bold">SITEHUB POD</AppText>
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.podSpecsCard}>
                  <View style={styles.specRow}>
                    <AppIcon name="Check" size={16} color="#1DB954" />
                    <AppText style={styles.specText}>1-Tap Beams Your Mini-Site without Any App</AppText>
                  </View>
                  <View style={styles.specRow}>
                    <AppIcon name="Check" size={16} color="#1DB954" />
                    <AppText style={styles.specText}>Matte Black Luxury Scratch-Proof Finish</AppText>
                  </View>
                  <View style={styles.specRow}>
                    <AppIcon name="Check" size={16} color="#1DB954" />
                    <AppText style={styles.specText}>Print-on-Demand (POD) Worldwide Free Express</AppText>
                  </View>
                </View>

                <Pressable style={styles.orderPodCta} onPress={() => { HapticTap.heavy(); onClose(); }}>
                  <AppIcon name="ShoppingBag" size={18} color="#000000" />
                  <AppText style={styles.orderPodCtaText} weight="extrabold">
                    Order Physical NFC Card — $29.95
                  </AppText>
                </Pressable>
              </ScrollView>
            )}

            {/* Bottom Action Footer */}
            <View style={styles.footerActions}>
              <Pressable style={styles.editBtn} onPress={handleReset}>
                <AppText style={styles.editBtnText} weight="bold">Modify Details</AppText>
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
                  Publish Mini-Site Now
                </AppText>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  },
  badgeText: {
    fontSize: 10,
    color: '#1DB954',
    letterSpacing: 0.5,
  },
  podBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  podBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 60,
  },
  explainerCard: {
    backgroundColor: '#111114',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    marginBottom: 20,
  },
  explainerQuote: {
    color: '#E5E5EA',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 12,
  },
  categoryChips: {
    gap: 10,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryChipText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: '#000000',
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldTitle: {
    color: 'rgba(235,235,245,0.7)',
    fontSize: 12,
    marginBottom: 6,
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
  generateCta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  generateCtaDisabled: {
    backgroundColor: '#2C2C2E',
  },
  generateCtaText: {
    color: '#000000',
    fontSize: 16,
  },
  bottomMicroText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingSpinnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  generatingTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  generatingStatus: {
    color: '#1DB954',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressTrack: {
    width: 240,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  previewContainer: {
    flex: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
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
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#000000',
  },
  siteScroll: {
    flex: 1,
  },
  phoneMockup: {
    marginHorizontal: 20,
    backgroundColor: '#111114',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 18,
    marginBottom: 20,
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mockupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupAvatarText: {
    color: '#000000',
    fontSize: 22,
  },
  mockupMeta: {
    flex: 1,
  },
  mockupBizName: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  mockupCategory: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  liveOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  },
  mockupTagline: {
    color: '#E5E5EA',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181C',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  hoursText: {
    color: '#E5E5EA',
    fontSize: 12,
  },
  sitePrimaryCta: {
    backgroundColor: '#1DB954',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  sitePrimaryCtaText: {
    color: '#000000',
    fontSize: 15,
  },
  menuSection: {
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  menuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  currencyBadge: {
    color: '#8E8E93',
    fontSize: 11,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  menuItemLeft: {
    flex: 1,
    paddingRight: 12,
  },
  menuItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 3,
  },
  menuItemDesc: {
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 16,
  },
  menuPriceBadge: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  menuPriceText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  cardTabContainer: {
    padding: 20,
    alignItems: 'center',
  },
  physicalCardWrapper: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
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
    height: 34,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
    padding: 4,
    justifyContent: 'center',
  },
  chipInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#996515',
    borderRadius: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardBizLabel: {
    color: '#8E8E93',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 3,
  },
  cardBizName: {
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  cardPodMark: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    letterSpacing: 1,
  },
  podSpecsCard: {
    width: '100%',
    backgroundColor: '#111114',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specText: {
    color: '#E5E5EA',
    fontSize: 13,
  },
  orderPodCta: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  orderPodCtaText: {
    color: '#000000',
    fontSize: 15,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000000',
  },
  editBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  activateBtn: {
    flex: 1.5,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtnText: {
    color: '#000000',
    fontSize: 14,
  },
});
