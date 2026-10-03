import React, { useCallback, useEffect, useState } from 'react';
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

const TEST_STEPS = [
  { label: 'NFC detected' },
  { label: 'Profile opened' },
  { label: 'Link working' },
  { label: 'Card ready' },
];

export default function NfcTestScreen() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (visibleCount >= TEST_STEPS.length) {
      HapticTap.success();
      setAllDone(true);
      return;
    }
    const timeout = setTimeout(() => {
      HapticTap.light();
      setVisibleCount((prev) => prev + 1);
    }, 600);
    return () => clearTimeout(timeout);
  }, [visibleCount]);

  const handleDone = useCallback(() => {
    HapticTap.light();
    router.replace('/(tabs)' as never);
  }, []);

  const handleBack = useCallback(() => {
    HapticTap.light();
    router.back();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={24} color="#F5F5F7" />
        </Pressable>
        <AppText style={styles.headerTitle}>NFC Test</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.stepsCard}>
          {TEST_STEPS.map((step, index) => (
            <View
              key={step.label}
              style={[
                styles.stepRow,
                index < TEST_STEPS.length - 1 && styles.stepBorder,
                { opacity: index < visibleCount ? 1 : 0.2 },
              ]}
            >
              <View style={[styles.checkCircle, index < visibleCount && styles.checkCircleActive]}>
                <AppIcon
                  name="Check"
                  size={16}
                  color={index < visibleCount ? '#30D158' : '#9A9AA0'}
                />
              </View>
              <AppText style={[styles.stepLabel, index < visibleCount && styles.stepLabelActive]}>
                {step.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* All Done Badge */}
        {allDone && (
          <View style={styles.badge}>
            <AppIcon name="BadgeCheck" size={18} color="#30D158" />
            <AppText style={styles.badgeText}>All tests passed</AppText>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.doneBtn,
            !allDone && styles.doneBtnDisabled,
            pressed && allDone && styles.doneBtnPressed,
          ]}
          onPress={handleDone}
          disabled={!allDone}
        >
          <AppText style={styles.doneBtnText}>Done</AppText>
        </Pressable>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#F5F5F7',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 130,
    paddingTop: 24,
    gap: 20,
  },
  stepsCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
  },
  stepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: 'rgba(48,209,88,0.1)',
    borderColor: 'rgba(48,209,88,0.3)',
  },
  stepLabel: {
    fontSize: 15,
    color: '#9A9AA0',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#F5F5F7',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(48,209,88,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.2)',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#30D158',
  },
  doneBtn: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneBtnDisabled: {
    opacity: 0.35,
  },
  doneBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
