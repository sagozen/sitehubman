import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions, type TextStyle, type ViewStyle } from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { cardDesignOptions } from '@/src/constants/options';
import { useAuth } from '@/src/hooks/useAuth';
import { Card2BoldDuotone, CopyBoldDuotone, BoxBoldDuotone, StarsBoldDuotone } from '@solar-icons/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticTap } from '@/src/utils/haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  FadeInDown 
} from 'react-native-reanimated';
import { iosDesign, premiumPalette } from '@/src/design-system/ios';

const CATEGORIES = ['All', 'Premium', 'Classic', 'Special'];

const DESIGN_DETAILS: Record<string, { material: string; desc: string; colors: string[] }> = {
  classic_black: { material: 'Carbon Matte Matte Black', desc: 'Minimalist obsidian finish with deep laser etching.', colors: ['#1F2937', '#111827'] },
  classic_white: { material: 'Chambery Ceramic White', desc: 'Gloss white ceramic compound with satin silver font.', colors: ['#F9FAFB', '#F3F4F6'] },
  gold_premium: { material: '18K Gold Brushed Metal', desc: 'Micro-brushed structural brass core plated in pure gold.', colors: ['#FCD34D', '#D97706'] },
  rose_gold: { material: 'Satin Rose Gold Steel', desc: 'Anodized rose gold base with micro-milled details.', colors: ['#FDA4AF', '#E11D48'] },
  matte_silver: { material: 'Titanium Matte Silver', desc: 'Blast-finished space aerospace grade aluminum.', colors: ['#E5E7EB', '#9CA3AF'] },
  green_orange: { material: 'Holographic Chameleon Fusion', desc: 'Chroma-shift layer reflecting warm sunset spectrum.', colors: ['#10B981', '#F59E0B'] },
  custom: { material: 'Bespoke Custom Print', desc: 'Full edge-to-edge custom graphics with UV spot varnish.', colors: ['#8B5CF6', '#EC4899'] },
};

/**
 * AnimatedButton - a tactile, high-end button that feels physical.
 */
function AnimatedButton({ children, onPress, style }: { 
  children: React.ReactNode; 
  onPress: () => void; 
  style?: ViewStyle; 
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        HapticTap.light();
        scale.value = withSpring(iosDesign.animation.softPressScale);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function CustomerTemplatesRoute() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [selectedCat, setSelectedCat] = useState('All');

  const filteredTemplates = cardDesignOptions.filter((t) => {
    if (selectedCat === 'All') return true;
    if (selectedCat === 'Premium') return ['gold_premium', 'rose_gold', 'matte_silver'].includes(t.value);
    if (selectedCat === 'Classic') return ['classic_black', 'classic_white'].includes(t.value);
    if (selectedCat === 'Special') return ['green_orange', 'custom'].includes(t.value);
    return true;
  });

  const cardWidth = Math.min(width - 48, 340);
  const cardHeight = cardWidth / 1.586;

  const handleEdit = (designValue: string) => {
    router.push({ pathname: '/new-order', params: { design: designValue } });
  };

  const handleOrder = (designValue: string) => {
    router.push({ pathname: '/new-order', params: { design: designValue, autoSelect: 'true' } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.back();
          }}
          style={styles.backBtn}
          hitSlop={12}
        >
          <AppIcon name="ChevronLeft" size={22} color={premiumPalette.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText style={styles.subtitle}>Choose your physical canvas & setup your bio page</AppText>
        </View>
        <Card2BoldDuotone size={28} color={premiumPalette.accent} />
      </View>

      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                HapticTap.light();
                setSelectedCat(cat);
              }}
              style={[styles.catBtn, selectedCat === cat && styles.catBtnActive]}
            >
              <AppText style={[styles.catBtnText, selectedCat === cat && styles.catBtnTextActive]}>
                {cat}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredTemplates.map((item, index) => {
          const detail = DESIGN_DETAILS[item.value] || { material: 'Solid Composite', desc: 'NFC enabled card', colors: ['#E5E7EB', '#9CA3AF'] };
          return (
            <Animated.View 
              key={item.value} 
              entering={FadeInDown.delay(index * 100).springify()} 
              style={styles.templateCard}
            >
              <View style={styles.cardPreviewContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.previewShadow}>
                  <NfcGlobalCardFace
                    fullName={user?.displayName || 'Your Full Name'}
                    title="Verified NFC Member"
                    company="Global Identity"
                    email={user?.email || 'member@nfcglobal.co'}
                    width={cardWidth}
                    height={cardHeight}
                  />
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.nameRow}>
                  <View style={styles.titleCol}>
                    <AppText style={styles.cardName}>{item.label}</AppText>
                    <AppText style={styles.materialText}>{detail.material}</AppText>
                  </View>
                  <View style={styles.tag}>
                    <StarsBoldDuotone size={12} color={premiumPalette.accent} />
                    <AppText style={styles.tagText}>NFC 2026</AppText>
                  </View>
                </View>

                <AppText style={styles.descText}>{detail.desc}</AppText>

                <View style={styles.actions}>
                  <AnimatedButton 
                    onPress={() => handleEdit(item.value)} 
                    style={styles.btnEdit}
                  >
                    <View style={styles.btnInner}>
                      <CopyBoldDuotone size={18} color={premiumPalette.textPrimary} />
                      <AppText style={styles.btnEditText}>Customize Bio</AppText>
                    </View>
                  </AnimatedButton>

                  <AnimatedButton 
                    onPress={() => handleOrder(item.value)} 
                    style={styles.btnOrder} 
                  >
                    <View style={styles.btnInner}>
                      <BoxBoldDuotone size={18} color="#FFFFFF" />
                      <AppText style={styles.btnOrderText}>Order Card</AppText>
                    </View>
                  </AnimatedButton>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: premiumPalette.background } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 } as ViewStyle,
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: premiumPalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: premiumPalette.border,
    ...iosDesign.shadows.subtle,
  } as ViewStyle,
  headerCopy: { flex: 1, gap: 1 } as ViewStyle,
  subtitle: { fontSize: 13, fontWeight: '500', color: premiumPalette.textSecondary, lineHeight: 18 } as TextStyle,

  catContainer: { borderBottomWidth: 1, borderBottomColor: premiumPalette.divider } as ViewStyle,
  catScroll: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 } as ViewStyle,
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: iosDesign.radius.pill, backgroundColor: premiumPalette.surfaceSoft, borderWidth: 1, borderColor: 'transparent' } as ViewStyle,
  catBtnActive: { backgroundColor: premiumPalette.textPrimary, borderColor: premiumPalette.textPrimary } as ViewStyle,
  catBtnText: { fontSize: 13, fontWeight: '800', color: premiumPalette.textSecondary } as TextStyle,
  catBtnTextActive: { color: premiumPalette.background } as TextStyle,

  scroll: { padding: 20, gap: 28, paddingBottom: 60 } as ViewStyle,
  templateCard: { 
    backgroundColor: premiumPalette.surface, 
    borderRadius: iosDesign.radius.hero, 
    overflow: 'hidden', 
    borderWidth: 1.5, 
    borderColor: premiumPalette.border, 
    ...iosDesign.shadows.card,
  } as ViewStyle,
  cardPreviewContainer: { 
    paddingVertical: 32, 
    paddingHorizontal: 16, 
    alignItems: 'center', 
    backgroundColor: premiumPalette.surfaceSoft, 
    borderBottomWidth: 1, 
    borderBottomColor: premiumPalette.divider,
  } as ViewStyle,
  previewShadow: { ...iosDesign.shadows.floating },
  cardDetails: { padding: 20, gap: 12 } as ViewStyle,
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 } as ViewStyle,
  titleCol: { flex: 1, gap: 2 } as ViewStyle,
  cardName: { fontSize: 19, fontWeight: '900', color: premiumPalette.textPrimary, letterSpacing: -0.4 } as TextStyle,
  materialText: { fontSize: 12, fontWeight: '600', color: premiumPalette.textSecondary } as TextStyle,
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: iosDesign.radius.pill, backgroundColor: premiumPalette.accentSoft } as ViewStyle,
  tagText: { fontSize: 10, fontWeight: '800', color: premiumPalette.accent } as TextStyle,
  descText: { fontSize: 13, fontWeight: '500', color: premiumPalette.textSecondary, lineHeight: 19 } as TextStyle,

  actions: { flexDirection: 'row', gap: 12, marginTop: 6 } as ViewStyle,
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: iosDesign.radius.pill } as ViewStyle,
  btnEdit: { backgroundColor: premiumPalette.surfaceSoft, borderWidth: 1, borderColor: premiumPalette.border } as ViewStyle,
  btnEditText: { fontSize: 14, fontWeight: '800', color: premiumPalette.textPrimary } as TextStyle,
  btnOrder: { backgroundColor: premiumPalette.textPrimary } as ViewStyle,
  btnOrderText: { fontSize: 14, fontWeight: '800', color: premiumPalette.background } as TextStyle,
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50 } as ViewStyle,
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] } as ViewStyle,
});
