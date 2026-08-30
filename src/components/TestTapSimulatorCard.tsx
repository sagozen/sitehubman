/**
 * TestTapSimulatorCard.tsx — 100% Native Apple Cash / Apple Pay Confirmation Edition.
 *
 * Modeled directly after Apple Cash & Apple Pay native iOS interface:
 *  - Native slate container (#1C1C1E)
 *  - Floating black Apple Pass card with gold/titanium chip
 *  - Bold Apple Headline: 'Smart Card Active ✓' with Apple Blue Check (#0A84FF)
 *  - Crisp HIG typography & haptic response
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap, HapticPattern } from '@/src/utils/haptics';

interface TestTapSimulatorCardProps {
  onSimulateTap: () => void;
}

export function TestTapSimulatorCard({ onSimulateTap }: TestTapSimulatorCardProps) {
  const [simulating, setSimulating] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleTestTap = () => {
    if (simulating || completed) return;
    HapticTap.heavy();
    setSimulating(true);

    setTimeout(() => {
      HapticPattern.tapSuccess();
      setSimulating(false);
      setCompleted(true);
      onSimulateTap();
    }, 1200);
  };

  return (
    <Pressable
      onPress={handleTestTap}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {/* Floating Apple Pass Visual */}
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

      {/* Native Apple Cash Title & Status */}
      <View style={styles.contentBlock}>
        <View style={styles.titleRow}>
          {simulating ? (
            <ActivityIndicator size="small" color="#0A84FF" />
          ) : (
            <AppText style={styles.mainTitle} weight="extrabold">
              {completed ? 'Smart Pass Active' : 'Test NFC Smart Pass'}
            </AppText>
          )}
          <AppIcon
            name={completed ? 'Check' : 'Nfc'}
            size={20}
            color={completed ? '#0A84FF' : 'rgba(255,255,255,0.5)'}
          />
        </View>
        <AppText style={styles.subText}>
          {completed
            ? 'Apple Cash style virtual pass is live. Your digital profile & NFC chip are ready for client meetings.'
            : 'Tap here to simulate how clients scan & save your executive profile.'}
        </AppText>
      </View>

      {/* Action Button */}
      {!completed && !simulating && (
        <View style={styles.ctaPill}>
          <AppText style={styles.ctaText} weight="extrabold">Tap to Test Drive →</AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  cardGraphicWrap: {
    width: 200,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111114',
    position: 'relative',
    padding: 12,
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
    width: 22,
    height: 22,
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
    fontSize: 9,
    letterSpacing: 0.8,
  },
  cardPassType: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 1,
  },
  contentBlock: {
    alignItems: 'center',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 290,
  },
  ctaPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 2,
  },
  ctaText: {
    color: '#000000',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.88,
  },
});
