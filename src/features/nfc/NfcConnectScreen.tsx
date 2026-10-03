import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

export default function NfcConnectScreen() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleBack = useCallback(() => {
    HapticTap.light();
    router.back();
  }, []);

  const handleScan = useCallback(() => {
    HapticTap.medium();
    // Simulate scan → navigate to write
    router.push('/nfc/write' as never);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav */}
      <View style={styles.navRow}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={24} color="#F5F5F7" />
        </Pressable>
      </View>

      {/* Center Content */}
      <View style={styles.center}>
        {/* Pulsing ring */}
        <View style={styles.iconWrap}>
          <Animated.View style={[styles.ring, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.ring, styles.ringOuter, { opacity: pulseAnim }]} />
          <View style={styles.iconCircle}>
            <AppIcon name="Nfc" size={48} color="#2596BE" />
          </View>
        </View>

        <AppText style={styles.title}>Bring your NFC card close</AppText>
        <AppText style={styles.subtitle}>
          Hold your phone near the NFC card to scan
        </AppText>

        <Pressable
          style={({ pressed }) => [styles.scanBtn, pressed && styles.scanBtnPressed]}
          onPress={handleScan}
        >
          <AppText style={styles.scanBtnText}>Scan NFC</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 20,
  },
  iconWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ring: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: '#2596BE',
  },
  ringOuter: {
    width: 145,
    height: 145,
    borderRadius: 72.5,
    borderWidth: 1,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(37,150,190,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37,150,190,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5F5F7',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: '#9A9AA0',
    textAlign: 'center',
    lineHeight: 22,
  },
  scanBtn: {
    height: 54,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  scanBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  scanBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
