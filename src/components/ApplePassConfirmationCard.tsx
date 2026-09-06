/**
 * ApplePassConfirmationCard.tsx
 *
 * 100% Native Apple Cash / Apple Pay Confirmation Card Design.
 * Features:
 *  - Pure Apple dark slate canvas (#1C1C1E / #000000)
 *  - Floating card visual with Apple Cash style layout
 *  - Bold typography: 'Smart Card Active ✓' with Apple Blue checkmark (#0A84FF)
 *  - Clean Apple Human Interface Guidelines micro-copy
 */
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

interface ApplePassConfirmationCardProps {
  cardName?: string;
  title?: string;
  subtitle?: string;
  isCompleted?: boolean;
  onPress?: () => void;
}

export function ApplePassConfirmationCard({
  cardName = 'AVIO Smart Pass',
  title = 'Pass Active ✓',
  subtitle = 'Your executive profile and NFC chip are ready for instant client contact exchange.',
  isCompleted = true,
  onPress,
}: ApplePassConfirmationCardProps) {
  return (
    <Pressable
      onPress={() => {
        HapticTap.medium();
        onPress?.();
      }}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {/* ── Apple Cash Floating Mini Card ── */}
      <View style={styles.cardGraphicWrap}>
        <Image
          source={require('@/assets/images/marketing/hero-home.png')}
          style={styles.cardGraphic}
          resizeMode="cover"
        />
        <View style={styles.cardGraphicOverlay} />
        <View style={styles.cardHeaderRow}>
          <View style={styles.appleLogoRow}>
            <AppIcon name="CreditCard" size={14} color="#FFFFFF" />
            <AppText style={styles.cardLogoText} weight="extrabold">AVIO Pass</AppText>
          </View>
          <View style={styles.nfcChipSeal}>
            <AppIcon name="Nfc" size={12} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
        <View style={styles.cardBottomRow}>
          <AppText style={styles.cardHolderName} weight="bold">EXECUTIVE MEMBER</AppText>
          <AppText style={styles.cardPassType} weight="extrabold">TITANIUM</AppText>
        </View>
      </View>

      {/* ── Apple Cash Native Title & Body ── */}
      <View style={styles.contentBlock}>
        <View style={styles.titleRow}>
          <AppText style={styles.mainTitle} weight="extrabold">
            {title}
          </AppText>
          <AppIcon name="Check" size={20} color="#1DB954" />
        </View>
        <AppText style={styles.subText}>
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  cardGraphicWrap: {
    width: 220,
    height: 135,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    position: 'relative',
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cardGraphic: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  cardGraphicOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appleLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLogoText: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  nfcChipSeal: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHolderName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  cardPassType: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 1,
  },
  contentBlock: {
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  pressed: {
    opacity: 0.88,
  },
});
