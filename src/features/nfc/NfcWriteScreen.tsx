import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export default function NfcWriteScreen() {
  const [progress, setProgress] = useState(0);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar to 100% over 3 seconds
    Animated.timing(widthAnim, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Update numeric display
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 3, 100);
        if (next >= 100) clearInterval(interval);
        return next;
      });
    }, 90);

    // Navigate to success after 3.4s
    const navTimeout = setTimeout(() => {
      HapticTap.success();
      router.replace('/nfc/success' as never);
    }, 3400);

    return () => {
      clearInterval(interval);
      clearTimeout(navTimeout);
    };
  }, [widthAnim]);

  const handleBack = useCallback(() => {
    HapticTap.light();
    router.back();
  }, []);

  const progressWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navRow}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={24} color="#F5F5F7" />
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <AppIcon name="Nfc" size={48} color="#799A85" />
        </View>

        <AppText style={styles.title}>Writing your profile…</AppText>
        <AppText style={styles.subtitle}>Keep your phone still near the NFC card</AppText>

        {/* Progress Bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <AppText style={styles.progressText}>{progress}%</AppText>
        </View>
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(121, 154, 133, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5F5F7',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9A9AA0',
    textAlign: 'center',
  },
  progressWrap: {
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#18181C',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#799A85',
  },
  progressText: {
    fontSize: 14,
    color: '#9A9AA0',
    textAlign: 'center',
    fontWeight: '500',
  },
});
