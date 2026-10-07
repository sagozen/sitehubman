import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon, { type AppIconName } from '@/src/components/AppIcon';
import IosScrollView from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const ACCENT = '#799A85';
const SURFACE = '#242424';
const BORDER = 'rgba(255,255,255,0.09)';
const TEXT = '#F5F5F7';
const MUTED = '#9A9AA0';

interface ProductData {
  name: string;
  price: string;
  tagline: string;
  icon: AppIconName;
  sections: { title: string; content: string }[];
}

const PRODUCTS: Record<string, ProductData> = {
  metal_card: {
    name: 'Metal Card',
    price: '$49',
    tagline: 'Brushed stainless steel with laser-engraved NFC.',
    icon: 'credit-card',
    sections: [
      { title: 'Material', content: '0.8mm 304 stainless steel with brushed matte or mirror polish finish.' },
      { title: 'Dimensions', content: '85.6 × 54 mm — standard ISO/IEC 7810 ID-1 size.' },
      { title: 'NFC Type', content: 'NTAG216, 924 bytes, ISO14443-A, up to 10 cm read range.' },
      { title: 'Available Finishes', content: 'Brushed Silver, Matte Black, Rose Gold, Gunmetal.' },
    ],
  },
  pvc_card: {
    name: 'PVC Card',
    price: '$19',
    tagline: 'Lightweight, full-color print with embedded NFC chip.',
    icon: 'card',
    sections: [
      { title: 'Material', content: '0.76mm PVC with UV-resistant gloss or matte lamination.' },
      { title: 'Dimensions', content: '85.6 × 54 mm — standard ISO/IEC 7810 ID-1 size.' },
      { title: 'NFC Type', content: 'NTAG213, 144 bytes, ISO14443-A.' },
      { title: 'Available Finishes', content: 'Gloss, Matte, Spot UV, Soft-Touch.' },
    ],
  },
  premium_card: {
    name: 'Premium Card',
    price: '$79',
    tagline: 'Carbon fiber composite with gold trim and dual-chip NFC.',
    icon: 'diamond',
    sections: [
      { title: 'Material', content: 'Carbon fiber weave composite with anodized aluminum inlay.' },
      { title: 'Dimensions', content: '85.6 × 54 mm — standard ISO/IEC 7810 ID-1 size.' },
      { title: 'NFC Type', content: 'Dual NTAG424 DNA + NTAG216 for dynamic data security.' },
      { title: 'Available Finishes', content: 'Carbon Black, Midnight Blue, Champagne Gold.' },
    ],
  },
  custom_card: {
    name: 'Custom Card',
    price: '$99',
    tagline: 'Fully bespoke design. Your brand, your material.',
    icon: 'brush',
    sections: [
      { title: 'Material', content: 'Your choice: Steel, PVC, Carbon, Wood veneer, or Bamboo.' },
      { title: 'Dimensions', content: 'Standard (85.6 × 54 mm) or custom cut.' },
      { title: 'NFC Type', content: 'NTAG213 / NTAG216 / NTAG424 DNA — configurable.' },
      { title: 'Available Finishes', content: 'Unlimited — specify during order configuration.' },
    ],
  },
};

const DEFAULT_PRODUCT: ProductData = {
  name: 'NFC Card',
  price: '$29',
  tagline: 'Premium NFC digital business card.',
  icon: 'credit-card',
  sections: [
    { title: 'Material', content: 'PVC composite.' },
    { title: 'Dimensions', content: '85.6 × 54 mm.' },
    { title: 'NFC Type', content: 'NTAG213.' },
    { title: 'Available Finishes', content: 'Standard.' },
  ],
};

function AccordionSection({
  title,
  content,
  isOpen,
  onToggle,
}: {
  title: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={styles.accordion}
      onPress={onToggle}
      hitSlop={4}
      android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
    >
      <View style={styles.accordionHeader}>
        <AppText style={styles.accordionTitle}>{title}</AppText>
        <AppIcon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={MUTED}
        />
      </View>
      {isOpen && (
        <AppText style={styles.accordionContent}>{content}</AppText>
      )}
    </Pressable>
  );
}

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const product = PRODUCTS[productId ?? ''] ?? DEFAULT_PRODUCT;

  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleSection = useCallback((idx: number) => {
    HapticTap.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection((prev) => (prev === idx ? null : idx));
  }, []);

  const handleOrder = useCallback(() => {
    HapticTap.confidentClick();
    router.push('/shop/preview-order' as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Back */}
        <Pressable
          style={styles.backBtn}
          onPress={() => { HapticTap.light(); router.back(); }}
          hitSlop={12}
        >
          <AppIcon name="arrow-left" size={20} color={TEXT} />
        </Pressable>

        {/* Hero image area */}
        <View style={styles.heroArea}>
          <View style={styles.heroGradientBg} />
          <View style={styles.heroIconContainer}>
            <View style={styles.heroIconRing}>
              <AppIcon name={product.icon} size={64} color={ACCENT} />
            </View>
          </View>
        </View>

        {/* Product info */}
        <View style={styles.infoBlock}>
          <AppText style={styles.productName}>{product.name}</AppText>
          <View style={styles.priceRow}>
            <AppText style={styles.price}>{product.price}</AppText>
            <View style={styles.priceBadge}>
              <AppText style={styles.priceBadgeText}>Starting from</AppText>
            </View>
          </View>
          <AppText style={styles.tagline}>{product.tagline}</AppText>
        </View>

        {/* Accordion sections */}
        <View style={styles.sectionsCard}>
          {product.sections.map((s, idx) => (
            <React.Fragment key={s.title}>
              <AccordionSection
                title={s.title}
                content={s.content}
                isOpen={openSection === idx}
                onToggle={() => toggleSection(idx)}
              />
              {idx < product.sections.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </IosScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleOrder}
          activeOpacity={0.86}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <AppText style={styles.ctaBtnText}>Customize &amp; Order</AppText>
          <AppIcon name="arrow-right" size={18} color="#000000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0E',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    gap: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: SURFACE,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  heroArea: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradientBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(37,150,190,0.07)',
  },
  heroIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37,150,190,0.1)',
    borderColor: 'rgba(37,150,190,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    gap: 8,
  },
  productName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: ACCENT,
  },
  priceBadge: {
    backgroundColor: 'rgba(37,150,190,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceBadgeText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 20,
  },
  sectionsCard: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 16,
    overflow: 'hidden',
  },
  accordion: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accordionContent: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 20,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
