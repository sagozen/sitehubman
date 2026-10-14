import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';

// ─── Design tokens (inline for locality) ────────────────────────────────────
const CANVAS = '#0D0D0E';
const SURFACE = '#242424';
const ACCENT = '#799A85';
const TEXT = '#F5F5F7';
const MUTED = '#A1A1AA';

/**
 * NfcAntennaGuide
 *
 * Inline animated diagram showing the NFC antenna zones on iPhone (top)
 * and Android (center-back). Uses only React Native `Animated` API —
 * no images, no SVG library required.
 */
export const NfcAntennaGuide: React.FC = () => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const loop1 = makeLoop(pulse1, 0);
    const loop2 = makeLoop(pulse2, 450);
    const loop3 = makeLoop(pulse3, 900);

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [pulse1, pulse2, pulse3]);

  const makePulseStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] }),
      },
    ],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.phonesRow}>
        {/* ── iPhone silhouette ────────────────────────────────── */}
        <View style={styles.phoneBlock}>
          <View style={styles.phoneLabel}>
            <AppText style={styles.labelText}>iPhone</AppText>
          </View>
          <View style={styles.phone}>
            {/* Camera notch / dynamic island area */}
            <View style={styles.topBar}>
              <View style={styles.dynamicIsland} />
            </View>

            {/* NFC antenna zone — top of iPhone */}
            <View style={styles.iOSAntennaZone}>
              {/* Pulsing rings */}
              {[pulse1, pulse2, pulse3].map((p, i) => (
                <Animated.View key={i} style={[styles.pulseRing, makePulseStyle(p)]} />
              ))}
              <View style={styles.antennaCore} />
            </View>

            {/* Phone body */}
            <View style={styles.phoneScreen} />

            {/* Home bar */}
            <View style={styles.homeBar} />
          </View>
          <AppText style={styles.zoneHint}>Top edge</AppText>
        </View>

        <View style={styles.divider} />

        {/* ── Android silhouette ───────────────────────────────── */}
        <View style={styles.phoneBlock}>
          <View style={styles.phoneLabel}>
            <AppText style={styles.labelText}>Android</AppText>
          </View>
          <View style={styles.phone}>
            {/* Front camera */}
            <View style={styles.topBar}>
              <View style={styles.punchHole} />
            </View>

            {/* Phone screen area */}
            <View style={styles.phoneScreen} />

            {/* NFC antenna zone — center-back for Android */}
            <View style={styles.androidAntennaZone}>
              {[pulse1, pulse2, pulse3].map((p, i) => (
                <Animated.View key={i} style={[styles.pulseRing, makePulseStyle(p)]} />
              ))}
              <View style={styles.antennaCore} />
            </View>

            {/* Bottom navigation bar */}
            <View style={styles.androidNavBar} />
          </View>
          <AppText style={styles.zoneHint}>Center back</AppText>
        </View>
      </View>

      <AppText style={styles.caption}>
        Hold top of iPhone or center-back of Android near card
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  phonesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  phoneBlock: {
    alignItems: 'center',
    gap: 8,
  },
  phoneLabel: {
    backgroundColor: 'rgba(121,154,133,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 0.5,
  },
  phone: {
    width: 70,
    height: 130,
    backgroundColor: '#1A1A1E',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    alignItems: 'center',
    position: 'relative',
  },
  topBar: {
    width: '100%',
    height: 22,
    backgroundColor: '#111113',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dynamicIsland: {
    width: 28,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  punchHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#111113',
  },
  homeBar: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8,
  },
  androidNavBar: {
    width: '100%',
    height: 18,
    backgroundColor: '#111113',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  // iPhone: NFC zone sits at the very top of the phone (overlaid)
  iOSAntennaZone: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Android: NFC zone in the center of the phone body
  androidAntennaZone: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  antennaCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ACCENT,
  },
  zoneHint: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 130,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'center',
    marginTop: 28,
  },
  caption: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
});

export default NfcAntennaGuide;
