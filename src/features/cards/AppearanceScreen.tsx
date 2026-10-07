import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const BG_SWATCHES = ['#000000', '#111111', '#1a1a2e', '#0d2137', '#2596BE'];
const ACCENT_SWATCHES = ['#2596BE', '#5E5CE6', '#30D158', '#FF9F0A', '#FF453A'];
const LAYOUTS = ['Minimal', 'Professional', 'Premium'] as const;
const FONTS = ['SF Pro', 'Serif', 'Mono'] as const;

type Layout = typeof LAYOUTS[number];
type Font = typeof FONTS[number];

export default function AppearanceScreen() {
  const [selectedBg, setSelectedBg] = useState('#000000');
  const [selectedAccent, setSelectedAccent] = useState('#2596BE');
  const [selectedLayout, setSelectedLayout] = useState<Layout>('Professional');
  const [selectedFont, setSelectedFont] = useState<Font>('SF Pro');

  const handleBack = useCallback(() => {
    HapticTap.light();
    router.back();
  }, []);

  const handleSave = useCallback(() => {
    HapticTap.success();
    router.back();
  }, []);

  const handleBg = useCallback((color: string) => {
    HapticTap.light();
    setSelectedBg(color);
  }, []);

  const handleAccent = useCallback((color: string) => {
    HapticTap.light();
    setSelectedAccent(color);
  }, []);

  const handleLayout = useCallback((layout: Layout) => {
    HapticTap.light();
    setSelectedLayout(layout);
  }, []);

  const handleFont = useCallback((font: Font) => {
    HapticTap.light();
    setSelectedFont(font);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={24} color="#F5F5F7" />
        </Pressable>
        <AppText style={styles.headerTitle}>Appearance</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Background Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Background</AppText>
          <View style={styles.swatchRow}>
            {BG_SWATCHES.map((color) => (
              <Pressable
                key={color}
                onPress={() => handleBg(color)}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  selectedBg === color && styles.swatchSelected,
                ]}
                hitSlop={6}
              />
            ))}
          </View>
        </View>

        {/* Accent Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Accent Color</AppText>
          <View style={styles.swatchRow}>
            {ACCENT_SWATCHES.map((color) => (
              <Pressable
                key={color}
                onPress={() => handleAccent(color)}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  selectedAccent === color && styles.swatchSelected,
                ]}
                hitSlop={6}
              />
            ))}
          </View>
        </View>

        {/* Layout Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Layout</AppText>
          <View style={styles.pillRow}>
            {LAYOUTS.map((layout) => (
              <Pressable
                key={layout}
                onPress={() => handleLayout(layout)}
                style={[
                  styles.pill,
                  selectedLayout === layout && styles.pillSelected,
                ]}
                hitSlop={4}
              >
                <AppText
                  style={[
                    styles.pillText,
                    selectedLayout === layout && styles.pillTextSelected,
                  ]}
                >
                  {layout}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Typography Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Typography</AppText>
          <View style={styles.pillRow}>
            {FONTS.map((font) => (
              <Pressable
                key={font}
                onPress={() => handleFont(font)}
                style={[
                  styles.pill,
                  selectedFont === font && styles.pillSelected,
                ]}
                hitSlop={4}
              >
                <AppText
                  style={[
                    styles.pillText,
                    selectedFont === font && styles.pillTextSelected,
                  ]}
                >
                  {font}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
          onPress={handleSave}
        >
          <AppText style={styles.saveBtnText}>Save Appearance</AppText>
        </Pressable>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 130,
    paddingTop: 8,
  },
  section: {
    marginTop: 28,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#9A9AA0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 14,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  swatchSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#242424',
  },
  pillSelected: {
    backgroundColor: '#2596BE',
    borderColor: '#2596BE',
  },
  pillText: {
    fontSize: 14,
    color: '#9A9AA0',
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 40,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
