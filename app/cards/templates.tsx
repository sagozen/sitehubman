import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions, type TextStyle, type ViewStyle } from 'react-native';
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

const CATEGORIES = ['All', 'Premium', 'Classic', 'Special'];

// Custom descriptors for templates to make them sound extremely high-end
const DESIGN_DETAILS: Record<string, { material: string; desc: string; colors: string[] }> = {
  classic_black: { material: 'Carbon Matte Matte Black', desc: 'Minimalist obsidian finish with deep laser etching.', colors: ['#1F2937', '#111827'] },
  classic_white: { material: 'Chambery Ceramic White', desc: 'Gloss white ceramic compound with satin silver font.', colors: ['#F9FAFB', '#F3F4F6'] },
  gold_premium: { material: '18K Gold Brushed Metal', desc: 'Micro-brushed structural brass core plated in pure gold.', colors: ['#FCD34D', '#D97706'] },
  rose_gold: { material: 'Satin Rose Gold Steel', desc: 'Anodized rose gold base with micro-milled details.', colors: ['#FDA4AF', '#E11D48'] },
  matte_silver: { material: 'Titanium Matte Silver', desc: 'Blast-finished space aerospace grade aluminum.', colors: ['#E5E7EB', '#9CA3AF'] },
  green_orange: { material: 'Holographic Chameleon Fusion', desc: 'Chroma-shift layer reflecting warm sunset spectrum.', colors: ['#10B981', '#F59E0B'] },
  custom: { material: 'Bespoke Custom Print', desc: 'Full edge-to-edge custom graphics with UV spot varnish.', colors: ['#8B5CF6', '#EC4899'] },
};

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
    router.push({
      pathname: '/new-order',
      params: { design: designValue }
    });
  };

  const handleOrder = (designValue: string) => {
    router.push({
      pathname: '/new-order',
      params: { design: designValue, autoSelect: 'true' }
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Editorial Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.back();
          }}
          style={styles.backBtn}
          hitSlop={12}
        >
          <AppIcon name="ChevronLeft" size={22} color="#111827" />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText style={styles.subtitle}>Choose your physical canvas & setup your bio page</AppText>
        </View>
        <Card2BoldDuotone size={28} color="#007AFF" />
      </View>

      {/* Categories Horizontal Selector */}
      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCat(cat)}
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
        {filteredTemplates.map((item) => {
          const detail = DESIGN_DETAILS[item.value] || { material: 'Solid Composite', desc: 'NFC enabled card', colors: ['#E5E7EB', '#9CA3AF'] };
          return (
            <View key={item.value} style={styles.templateCard}>
              {/* Studio lighting stage wrapper */}
              <View style={styles.cardPreviewContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
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
                    <StarsBoldDuotone size={12} color="#007AFF" />
                    <AppText style={styles.tagText}>NFC 2026</AppText>
                  </View>
                </View>

                <AppText style={styles.descText}>{detail.desc}</AppText>

                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [styles.btn, styles.btnEdit, pressed && styles.btnPressed] as ViewStyle[]}
                    onPress={() => handleEdit(item.value)}
                  >
                    <CopyBoldDuotone size={18} color="#111827" />
                    <AppText style={styles.btnEditText}>Customize Bio</AppText>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.btn, styles.btnOrder, pressed && styles.btnPressed] as ViewStyle[]}
                    onPress={() => handleOrder(item.value)}
                  >
                    <BoxBoldDuotone size={18} color="#FFFFFF" />
                    <AppText style={styles.btnOrderText}>Order Card</AppText>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 } as ViewStyle,
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  } as ViewStyle,
  headerCopy: { flex: 1, gap: 1 } as ViewStyle,
  title: { fontSize: 26, fontWeight: '900', color: '#111827', letterSpacing: -0.6 } as TextStyle,
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93', lineHeight: 18 } as TextStyle,

  catContainer: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' } as ViewStyle,
  catScroll: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 } as ViewStyle,
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' } as ViewStyle,
  catBtnActive: { backgroundColor: '#111827' } as ViewStyle,
  catBtnText: { fontSize: 13, fontWeight: '800', color: '#6B7280' } as TextStyle,
  catBtnTextActive: { color: '#FFFFFF' } as TextStyle,

  scroll: { padding: 20, gap: 28, paddingBottom: 60 } as ViewStyle,
  templateCard: { backgroundColor: '#FFFFFF', borderRadius: 28, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 3 } as ViewStyle,
  cardPreviewContainer: { paddingVertical: 32, paddingHorizontal: 16, alignItems: 'center', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' } as ViewStyle,
  previewShadow: { shadowColor: '#000000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8 } as ViewStyle,
  cardDetails: { padding: 20, gap: 12 } as ViewStyle,
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 } as ViewStyle,
  titleCol: { flex: 1, gap: 2 } as ViewStyle,
  cardName: { fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.4 } as TextStyle,
  materialText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' } as TextStyle,
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(0,122,255,0.08)' } as ViewStyle,
  tagText: { fontSize: 10, fontWeight: '800', color: '#007AFF' } as TextStyle,
  descText: { fontSize: 13, fontWeight: '500', color: '#4B5563', lineHeight: 19 } as TextStyle,

  actions: { flexDirection: 'row', gap: 12, marginTop: 6 } as ViewStyle,
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 999 } as ViewStyle,
  btnEdit: { backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' } as ViewStyle,
  btnEditText: { fontSize: 14, fontWeight: '800', color: '#111827' } as TextStyle,
  btnOrder: { backgroundColor: '#111827' } as ViewStyle,
  btnOrderText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' } as TextStyle,
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] } as ViewStyle,
});
