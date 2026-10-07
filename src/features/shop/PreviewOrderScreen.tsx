import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon, { type AppIconName } from '@/src/components/AppIcon';
import IosScrollView from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const ACCENT = '#799A85';
const SURFACE = '#242424';
const BORDER = 'rgba(255,255,255,0.09)';
const TEXT = '#F5F5F7';
const MUTED = '#9A9AA0';

function NfcCardPreview({ flipValue }: { flipValue: Animated.Value }) {
  const frontOpacity = flipValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const backOpacity = flipValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const rotateY = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ rotateY }] }]}>
      {/* Front face */}
      <Animated.View style={[styles.cardFace, styles.cardFront, { opacity: frontOpacity }]}>
        <View style={styles.cardGradientLayer} />
        <View style={styles.cardChip}>
          <AppIcon name="wifi" size={16} color="rgba(255,255,255,0.6)" />
        </View>
        <View style={styles.cardBottomRow}>
          <View>
            <AppText style={styles.cardName}>Alex Johnson</AppText>
            <AppText style={styles.cardTitle}>Product Designer</AppText>
          </View>
          <View style={styles.cardNfcDot}>
            <AppIcon name="wifi" size={18} color={ACCENT} />
          </View>
        </View>
      </Animated.View>

      {/* Back face */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          { opacity: backOpacity, transform: [{ rotateY: '180deg' }] },
        ]}
      >
        <View style={styles.cardBackStripe} />
        <View style={styles.cardBackContent}>
          <AppText style={styles.cardBackLabel}>sitehubman.com</AppText>
          <AppText style={styles.cardBackSub}>Tap to connect</AppText>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

interface SummaryRow {
  label: string;
  value: string;
  icon: AppIconName;
}

const SUMMARY_ROWS: SummaryRow[] = [
  { label: 'Name', value: 'Alex Johnson', icon: 'user' },
  { label: 'Style', value: 'PVC Card — Matte Black', icon: 'layers' },
  { label: 'Color', value: '#2596BE Accent', icon: 'droplet' },
];

export default function PreviewOrderScreen() {
  const flipValue = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handleRotate = useCallback(() => {
    HapticTap.medium();
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipValue, {
      toValue,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipValue]);

  const handleZoom = useCallback(() => {
    HapticTap.light();
    const nextZoom = !isZoomed;
    Animated.spring(scaleValue, {
      toValue: nextZoom ? 1.18 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 9,
    }).start();
    setIsZoomed(nextZoom);
  }, [isZoomed, scaleValue]);

  const handleCheckout = useCallback(() => {
    HapticTap.confidentClick();
    router.push('/payments/checkout/pvc_card' as any);
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

        <View style={styles.headerBlock}>
          <AppText style={styles.headerTitle}>Your NFC Card</AppText>
          <AppText style={styles.headerSub}>Preview your design before ordering</AppText>
        </View>

        {/* 3D Card Preview */}
        <View style={styles.cardStage}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <NfcCardPreview flipValue={flipValue} />
          </Animated.View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleRotate}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.78}
          >
            <AppIcon name="refresh-cw" size={16} color={TEXT} />
            <AppText style={styles.actionBtnText}>Rotate</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, isZoomed && styles.actionBtnActive]}
            onPress={handleZoom}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.78}
          >
            <AppIcon name="zoom-in" size={16} color={isZoomed ? ACCENT : TEXT} />
            <AppText style={[styles.actionBtnText, isZoomed && { color: ACCENT }]}>
              {isZoomed ? 'Zoom Out' : 'Zoom'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Design Summary */}
        <View style={styles.summaryCard}>
          <AppText style={styles.summaryTitle}>Design Summary</AppText>
          {SUMMARY_ROWS.map((row, idx) => (
            <React.Fragment key={row.label}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryIconWrap}>
                  <AppIcon name={row.icon} size={16} color={ACCENT} />
                </View>
                <View style={styles.summaryTextBlock}>
                  <AppText style={styles.summaryLabel}>{row.label}</AppText>
                  <AppText style={styles.summaryValue}>{row.value}</AppText>
                </View>
              </View>
              {idx < SUMMARY_ROWS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </IosScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleCheckout}
          activeOpacity={0.86}
        >
          <AppText style={styles.ctaBtnText}>Confirm Design &amp; Checkout</AppText>
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
  headerBlock: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 14,
    color: MUTED,
  },
  cardStage: {
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: 320,
    height: 190,
  },
  cardFace: {
    position: 'absolute',
    width: 320,
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#0F1923',
    borderColor: 'rgba(37,150,190,0.4)',
    padding: 20,
    justifyContent: 'space-between',
  },
  cardGradientLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(37,150,190,0.08)',
  },
  cardChip: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  cardNfcDot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBack: {
    backgroundColor: '#0A0F14',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  cardBackStripe: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 42,
    backgroundColor: '#1A1A1A',
  },
  cardBackContent: {
    alignItems: 'center',
    gap: 4,
    marginTop: 50,
  },
  cardBackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  cardBackSub: {
    fontSize: 11,
    color: MUTED,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: SURFACE,
    borderRadius: 12,
    paddingVertical: 13,
  },
  actionBtnActive: {
    backgroundColor: 'rgba(37,150,190,0.12)',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
  },
  summaryCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextBlock: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: MUTED,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
  },
  divider: {
    height: 0,
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
