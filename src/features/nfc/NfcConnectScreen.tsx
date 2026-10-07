/**
 * NfcConnectScreen — Flow 6: Physical Tap Experience
 * Direction:
 * - Physical presence centered on device interaction
 * - Animated expanding electromagnetic pulses
 * - Real card representation with contactless chip & dynamic aura
 * - Live connection statistics (+6 today, 24 connections this month)
 * - Tactile, premium feedback
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  hairline: 'transparent',
  text: '#FFFFFF',
  textSecondary: '#E4E4E7',
  textMuted: '#8E8E93',
  accent: '#2596BE',
  accentCyan: '#00A3FF',
  emerald: '#799A85',
} as const;

export default function NfcConnectScreen() {
  const pulseAnim1 = useRef(new Animated.Value(0.2)).current;
  const pulseAnim2 = useRef(new Animated.Value(0.1)).current;
  const scaleAnim1 = useRef(new Animated.Value(0.85)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim1, {
            toValue: 0.8,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim1, {
            toValue: 0.15,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim1, {
            toValue: 1.25,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim1, {
            toValue: 0.85,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseAnim2, {
            toValue: 0.5,
            duration: 1400,
            delay: 350,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim2, {
            toValue: 0.08,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim2, {
            toValue: 1.45,
            duration: 1400,
            delay: 350,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim2, {
            toValue: 0.7,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim1, pulseAnim2, scaleAnim1, scaleAnim2]);

  const handleBack = useCallback(() => {
    HapticTap.light();
    router.back();
  }, []);

  const handleSimulateTap = useCallback(() => {
    HapticTap.heavy();
    router.push('/nfc/write' as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.navRow}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
        <AppText style={styles.navLabel} weight="bold">
          PHYSICAL BEAM
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.container}>
        {/* Editorial Heading */}
        <View style={styles.heroHeader}>
          <AppText style={styles.heroPreTitle} weight="bold">
            CONTACTLESS INTERACTION
          </AppText>
          <AppText style={styles.heroMainTitle} weight="bold">
            Ready to connect.
          </AppText>
          <AppText style={styles.heroSubtitle}>
            Bring your card or client's phone within 4cm of the top antenna.
          </AppText>
        </View>

        {/* Electromagnetic Pulse Center Stage */}
        <View style={styles.radarStage}>
          {/* Outer Pulsing Wave Ring */}
          <Animated.View
            style={[
              styles.pulseCircle,
              styles.pulseOuter,
              {
                opacity: pulseAnim2,
                transform: [{ scale: scaleAnim2 }],
              },
            ]}
          />

          {/* Inner Pulsing Wave Ring */}
          <Animated.View
            style={[
              styles.pulseCircle,
              styles.pulseInner,
              {
                opacity: pulseAnim1,
                transform: [{ scale: scaleAnim1 }],
              },
            ]}
          />

          {/* Realistic Physical NFC Card Representation */}
          <Pressable
            style={({ pressed }) => [
              styles.physicalCardStage,
              pressed && styles.cardPressed,
            ]}
            onPress={handleSimulateTap}
          >
            <View style={styles.cardGlowBorder} />
            <View style={styles.cardHead}>
              <AppText style={styles.cardNfcBrand} weight="bold">
                NFC GLOBAL
              </AppText>
              <View style={styles.statusLivePill}>
                <View style={styles.beaconDot} />
                <AppText style={styles.beaconText} weight="bold">
                  BEAM ON
                </AppText>
              </View>
            </View>

            <View style={styles.cardCenter}>
              <View style={styles.antennaSymbol}>
                <AppIcon name="wifi" size={36} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              <AppText style={styles.cardHolderName} weight="bold">
                THEAN COC
              </AppText>
              <AppText style={styles.cardHolderTitle}>
                FOUNDER & DIRECTOR
              </AppText>
            </View>

            <View style={styles.cardFoot}>
              <AppText style={styles.cardChipText}>
                EMBEDDED NTAG 424 DNA
              </AppText>
              <AppText style={styles.cardSecurityLevel} weight="bold">
                L3 ENCRYPTED
              </AppText>
            </View>
          </Pressable>
        </View>

        {/* Bottom Living Connections Context */}
        <View style={styles.bottomSection}>
          <View style={styles.livingMetricsBox}>
            <View style={styles.livingMetricItem}>
              <AppText style={styles.livingMetricNum} weight="bold">
                24
              </AppText>
              <AppText style={styles.livingMetricLabel}>
                BEAMED THIS MONTH
              </AppText>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.livingMetricItem}>
              <View style={styles.todayHighlightRow}>
                <AppText style={styles.livingMetricNum} weight="bold">
                  +6
                </AppText>
                <View style={styles.liveIndicatorDot} />
              </View>
              <AppText style={styles.livingMetricLabel}>
                EXCHANGED TODAY
              </AppText>
            </View>
          </View>

          {/* Trigger Scan Button */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleSimulateTap}
          >
            <AppText style={styles.actionButtonText} weight="bold">
              BEAM DIGITAL CARD
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.accentCyan,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  heroHeader: {
    alignItems: 'center',
    marginTop: 8,
  },
  heroPreTitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: C.textMuted,
    marginBottom: 6,
  },
  heroMainTitle: {
    fontSize: 32,
    letterSpacing: -0.8,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: 8,
    lineHeight: 18,
  },
  radarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    borderRadius: 200,
  },
  pulseInner: {
    width: 260,
    height: 260,
    borderColor: 'rgba(37, 150, 190, 0.35)',
    backgroundColor: 'rgba(37, 150, 190, 0.03)',
  },
  pulseOuter: {
    width: 340,
    height: 340,
    borderColor: 'rgba(37, 150, 190, 0.15)',
    backgroundColor: 'rgba(37, 150, 190, 0.015)',
  },
  physicalCardStage: {
    width: 250,
    height: 156,
    borderRadius: 20,
    backgroundColor: '#242424',
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGlowBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardNfcBrand: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(37, 150, 190, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  beaconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.emerald,
  },
  beaconText: {
    fontSize: 8,
    letterSpacing: 1,
    color: C.emerald,
  },
  cardCenter: {
    alignItems: 'center',
    gap: 3,
  },
  antennaSymbol: {
    marginBottom: 4,
  },
  cardHolderName: {
    fontSize: 15,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  cardHolderTitle: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: C.textSecondary,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  cardChipText: {
    fontSize: 8,
    letterSpacing: 0.8,
    color: C.textMuted,
  },
  cardSecurityLevel: {
    fontSize: 8,
    letterSpacing: 1,
    color: C.accentCyan,
  },
  bottomSection: {
    gap: 16,
  },
  livingMetricsBox: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  livingMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  livingMetricNum: {
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  todayHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.emerald,
  },
  livingMetricLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: C.textMuted,
    marginTop: 4,
  },
  metricDivider: {
    width: 0,
    height: 36,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  actionButtonText: {
    fontSize: 14,
    letterSpacing: 1,
    color: '#000000',
  },
});
