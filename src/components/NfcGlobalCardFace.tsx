import React, { memo, useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/src/components/AppText';
import { HolographicShimmer } from '@/src/components/HolographicShimmer';

const CARD_GRADIENTS = [
  ['#111111', '#202124', '#2596BE'], // 0: Classic Cyan-Blue (Dark)
  ['#0F2027', '#203A43', '#2C5364'], // 1: Matte Teal-Gray (Dark)
  ['#8A2387', '#E94057', '#F27121'], // 2: Cyber Sunset (Dark)
  ['#000000', '#434343', '#111111'], // 3: Pure Dark Carbon (Dark)
  ['#BF953F', '#FCF6BA', '#B38728'], // 4: Premium Gold (Metallic)
  ['#D3CBB8', '#6D604E', '#1D1A16'], // 5: Earth Sand (Dark)
  ['#FFFFFF', '#F8FAFC', '#E2E8F0'], // 6: Ultra Ceramic Snow (Light Mode)
] as const;

type NfcGlobalCardFaceProps = {
  fullName?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  profileUrl?: string;
  width?: number;
  height?: number;
  compact?: boolean;
  backgroundImageUri?: string | null;
  /** Toggle moving holographic shimmer overlay */
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
  gradientIndex?: number;
  /** Card color theme: 'dark' (default) or 'light' */
  theme?: 'dark' | 'light';
};

export const NfcGlobalCardFace = memo(function NfcGlobalCardFace({
  fullName = '',
  title = '',
  company = '',
  phone = '',
  email = '',
  website = '',
  profileUrl = '',
  width,
  height,
  compact = false,
  backgroundImageUri,
  shimmer = true,
  style,
  gradientIndex = 0,
  theme,
}: NfcGlobalCardFaceProps) {
  const isLight = theme === 'light' || gradientIndex === 6;

  const displayName = fullName.trim() || 'Your Name';
  const cardSizeStyle = width ? { width, height: height ?? width / 1.586 } : undefined;

  // Breathing animation — 60fps native driver
  const breatheAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (compact) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.015,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [compact, breatheAnim]);

  return (
    <Animated.View
      style={[
        styles.card,
        compact && styles.cardCompact,
        isLight && styles.cardLight,
        cardSizeStyle,
        style,
        !compact && { transform: [{ scale: breatheAnim }] },
      ]}
    >
      {/* Background Color Base */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isLight ? '#F8FAFC' : '#090A0E' },
        ]}
      />

      {/* Light / Dark Gradient Sheen */}
      {isLight ? (
        <LinearGradient
          colors={['#FFFFFF', '#F1F5F9', '#E2E8F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.16)',
            'rgba(255,255,255,0.02)',
            'transparent',
            'rgba(255,255,255,0.06)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {shimmer ? <HolographicShimmer enabled={!compact} opacity={isLight ? 0.25 : 0.4} /> : null}

      {/* Top Header Row */}
      <View style={styles.top}>
        <AppText
          style={[
            styles.brandTitle,
            compact && styles.brandTitleCompact,
            isLight && styles.textDark,
          ]}
        >
          GENNFC
        </AppText>

        {/* Top Right Dot Grid Pattern */}
        <View style={styles.dotGrid}>
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              style={[styles.gridDot, isLight && { backgroundColor: '#0F172A', opacity: 0.2 }]}
            />
          ))}
        </View>
      </View>

      {/* EMV Metallic Smart Chip */}
      <View style={[styles.emvChip, compact && styles.emvChipCompact]}>
        <LinearGradient
          colors={isLight ? ['#E2E8F0', '#CBD5E1', '#94A3B8'] : ['#D4AF37', '#FFF099', '#997000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emvChipLine} />
        <View style={styles.emvChipLineHoriz} />
      </View>

      {/* Center-Right NFC Target Ring */}
      <View style={[styles.nfcHaloRing, compact && styles.nfcHaloRingCompact]}>
        <LinearGradient
          colors={isLight ? ['#0284C7', '#6366F1', '#38BDF8'] : ['#00F0FF', '#A855F7', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nfcHaloBorder}
        >
          <View style={[styles.nfcHaloInner, isLight && styles.nfcHaloInnerLight]}>
            <AppText
              style={[
                styles.nfcHaloText,
                compact && styles.nfcHaloTextCompact,
                isLight && styles.textDark,
              ]}
            >
              NFC )))
            </AppText>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom Left Owner & ID Badge */}
      <View style={[styles.bottomLeft, compact && styles.bottomLeftCompact]}>
        <AppText
          style={[
            styles.ownerName,
            compact && styles.ownerNameCompact,
            isLight && styles.textDark,
          ]}
          numberOfLines={1}
        >
          {displayName.toUpperCase()}
        </AppText>

        <View style={styles.idRow}>
          <View style={[styles.idBadgeTag, isLight && styles.idBadgeTagLight]}>
            <AppText style={[styles.idBadgeTagText, isLight && styles.idBadgeTagTextLight]}>
              ID
            </AppText>
          </View>
          <AppText
            style={[
              styles.idCodeText,
              compact && styles.idCodeTextCompact,
              isLight && styles.idCodeTextLight,
            ]}
          >
            7A3F 8C21 9E4B
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
    borderRadius: 18,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#090A0E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...createShadow({ color: '#000000', offset: { width: 0, height: 24 }, opacity: 0.4, radius: 55, elevation: 12 }),
  },
  cardCompact: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  cardLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(15, 23, 42, 0.12)',
    ...createShadow({ color: '#0F172A', offset: { width: 0, height: 16 }, opacity: 0.12, radius: 32, elevation: 8 }),
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3.5,
    opacity: 0.95,
  },
  brandTitleCompact: {
    fontSize: 11,
    letterSpacing: 2,
  },
  textDark: {
    color: '#0F172A',
  },
  dotGrid: {
    width: 36,
    height: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-end',
    opacity: 0.25,
  },
  gridDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
  },
  emvChip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    zIndex: 2,
  },
  emvChipCompact: {
    width: 26,
    height: 19,
    borderRadius: 4,
    marginTop: 10,
  },
  emvChipLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  emvChipLineHoriz: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  nfcHaloRing: {
    position: 'absolute',
    right: 20,
    top: 24,
    bottom: 24,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nfcHaloRingCompact: {
    right: 12,
    top: 14,
    bottom: 14,
  },
  nfcHaloBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nfcHaloInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#090A0E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nfcHaloInnerLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(15, 23, 42, 0.1)',
  },
  nfcHaloText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  nfcHaloTextCompact: {
    fontSize: 9,
    letterSpacing: 1,
  },
  bottomLeft: {
    position: 'absolute',
    left: 22,
    bottom: 20,
    zIndex: 2,
    gap: 5,
  },
  bottomLeftCompact: {
    left: 14,
    bottom: 12,
    gap: 3,
  },
  ownerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  ownerNameCompact: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idBadgeTag: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#00F0FF',
  },
  idBadgeTagLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: '#0284C7',
  },
  idBadgeTagText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  idBadgeTagTextLight: {
    color: '#0284C7',
  },
  idCodeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    fontFamily: Platform.select({ ios: 'SF-Mono', android: 'monospace', default: 'monospace' }),
  },
  idCodeTextLight: {
    color: 'rgba(15, 23, 42, 0.7)',
  },
  idCodeTextCompact: {
    fontSize: 8,
    letterSpacing: 1,
  },
});
