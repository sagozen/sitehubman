/**
 * NfcCardFaceV2 — Premium SaaS Quality NFC Card Face
 * Replaces NfcGlobalCardFace with token-aware styling, refined gradients, 
 * glassmorphism effects, and highly optimized Reanimated loops.
 */

import React, { memo, useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/src/components/AppText';
import { HolographicShimmer } from '@/src/components/HolographicShimmer';
import { tokens } from '@/src/design-system/tokens';
import { createShadow } from '@/src/utils/shadows';

type NfcCardFaceV2Props = {
  fullName?: string;
  cardId?: string;
  width?: number;
  height?: number;
  compact?: boolean;
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
  theme?: 'dark' | 'light';
  paused?: boolean;
};

export const NfcCardFaceV2 = memo(function NfcCardFaceV2({
  fullName = '',
  cardId = '0000 0000 0000',
  width,
  height,
  compact = false,
  shimmer = true,
  style,
  theme = 'dark',
  paused = false,
}: NfcCardFaceV2Props) {
  const isLight = theme === 'light';
  const displayName = fullName.trim() || 'Your Name';
  const cardSizeStyle = width ? { width, height: height ?? width / 1.586 } : undefined;

  // ─── Animations ────────────────────────────────────────────────────────
  const breatheAnim = useSharedValue(1);

  useEffect(() => {
    if (compact || paused) {
      breatheAnim.value = 1;
      return;
    }
    breatheAnim.value = withRepeat(
      withTiming(1.015, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [compact, paused, breatheAnim]);

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheAnim.value }],
  }));

  // ─── Colors ────────────────────────────────────────────────────────────
  const baseBg = isLight ? '#F8FAFC' : '#0B0D12';
  const borderColor = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)';
  const textColor = isLight ? '#0F172A' : '#FFFFFF';
  const secondaryTextColor = isLight ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)';

  return (
    <Animated.View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: baseBg, borderColor },
        !isLight && styles.darkShadow,
        isLight && styles.lightShadow,
        cardSizeStyle,
        !compact && animatedScaleStyle,
        style,
      ]}
    >
      {/* Glossy Sheen Overlay */}
      {isLight ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : (
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'transparent', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {shimmer && !paused && !compact && (
        <HolographicShimmer enabled={true} opacity={isLight ? 0.15 : 0.25} />
      )}

      {/* Top Header Row */}
      <View style={styles.topRow}>
        <AppText
          style={[
            styles.brandTitle,
            compact && styles.brandTitleCompact,
            { color: textColor },
          ]}
        >
          GENNFC
        </AppText>

        <View style={styles.dotGrid}>
          {[...Array(9)].map((_, i) => (
            <View key={i} style={[styles.gridDot, { backgroundColor: textColor }]} />
          ))}
        </View>
      </View>

      {/* Smart Chip */}
      <View style={[styles.emvChip, compact && styles.emvChipCompact]}>
        <LinearGradient
          colors={isLight ? ['#E2E8F0', '#CBD5E1', '#94A3B8'] : ['#D4AF37', '#FFDF73', '#997000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emvLineVertical} />
        <View style={styles.emvLineHorizontal} />
      </View>

      {/* NFC Icon / Ring */}
      <View style={[styles.nfcRingContainer, compact && styles.nfcRingCompact]}>
        <LinearGradient
          colors={isLight ? ['#38BDF8', '#818CF8', '#C084FC'] : ['#00F0FF', '#A855F7', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nfcRingBorder}
        >
          <View style={[styles.nfcRingInner, { backgroundColor: baseBg }]}>
            <AppText style={[styles.nfcRingText, compact && styles.nfcRingTextCompact, { color: textColor }]}>
              NFC
            </AppText>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom Information */}
      <View style={[styles.bottomInfo, compact && styles.bottomInfoCompact]}>
        <AppText style={[styles.ownerName, compact && styles.ownerNameCompact, { color: textColor }]} numberOfLines={1}>
          {displayName.toUpperCase()}
        </AppText>

        <View style={styles.idRow}>
          <AppText style={[styles.idText, compact && styles.idTextCompact, { color: secondaryTextColor }]}>
            {cardId}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: tokens.radius['2xl'],
    padding: tokens.spacing[5],
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  cardCompact: {
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[3],
    borderWidth: 1,
  },
  darkShadow: {
    ...createShadow({ color: '#000000', offset: { width: 0, height: 20 }, opacity: 0.5, radius: 40, elevation: 16 }),
  },
  lightShadow: {
    ...createShadow({ color: '#0F172A', offset: { width: 0, height: 16 }, opacity: 0.12, radius: 32, elevation: 12 }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
  },
  brandTitleCompact: {
    fontSize: 12,
    letterSpacing: 2,
  },
  dotGrid: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-end',
    opacity: 0.2,
  },
  gridDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  emvChip: {
    width: 42,
    height: 30,
    borderRadius: tokens.radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: tokens.spacing[5],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  emvChipCompact: {
    width: 28,
    height: 20,
    marginTop: tokens.spacing[3],
  },
  emvLineVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  emvLineHorizontal: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  nfcRingContainer: {
    position: 'absolute',
    right: 24,
    top: '35%',
    width: 56,
    height: 56,
    zIndex: 2,
  },
  nfcRingCompact: {
    right: 16,
    width: 36,
    height: 36,
  },
  nfcRingBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    padding: 2,
  },
  nfcRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nfcRingText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nfcRingTextCompact: {
    fontSize: 8,
  },
  bottomInfo: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    zIndex: 2,
  },
  bottomInfoCompact: {
    left: 16,
    bottom: 16,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: tokens.spacing[1],
  },
  ownerNameCompact: {
    fontSize: 11,
    letterSpacing: 1.5,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'SF-Mono', android: 'monospace', default: 'monospace' }),
  },
  idTextCompact: {
    fontSize: 9,
    letterSpacing: 1.5,
  },
});
