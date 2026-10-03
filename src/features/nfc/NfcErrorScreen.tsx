/**
 * NfcErrorScreen — 25 NFC Write Error & Recovery (Apple Wallet × Stripe × Linear)
 *
 * Implements:
 * 25 — NFC Write Error & Recovery State
 * - Visual warning state
 * - Troubleshooting tips (Remove phone case, Hold against top back of iPhone, Do not move until complete)
 * - [ Try Again ] action
 */
import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#2596BE',
  warning: '#FF9F0A',
  danger: '#FF453A',
} as const;

export default function NfcErrorScreen() {
  const handleRetry = useCallback(() => {
    HapticTap.medium();
    router.replace('/nfc/write' as any);
  }, []);

  const handleCancel = useCallback(() => {
    HapticTap.light();
    router.replace('/(tabs)/profile' as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav */}
      <View style={styles.navRow}>
        <Pressable onPress={handleCancel} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="X" size={24} color="#F5F5F7" />
        </Pressable>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Warning Icon */}
        <View style={styles.iconCenter}>
          <View style={styles.warningCircle}>
            <AppIcon name="AlertTriangle" size={44} color={C.warning} />
          </View>
          <AppText style={styles.title} weight="bold">
            Write Incomplete
          </AppText>
          <AppText style={styles.subtitle}>
            The card moved away before your digital profile could be fully programmed.
          </AppText>
        </View>

        {/* Troubleshooting Card */}
        <View style={styles.troubleCard}>
          <AppText style={styles.troubleHeader} weight="bold">
            Troubleshooting Tips
          </AppText>

          <View style={styles.tipRow}>
            <View style={styles.tipBullet}>
              <AppText style={styles.bulletNum}>1</AppText>
            </View>
            <View style={styles.tipContent}>
              <AppText style={styles.tipTitle} weight="bold">
                Position at top edge of iPhone
              </AppText>
              <AppText style={styles.tipDesc}>
                The NFC reader is located next to the rear camera on the upper back of your phone.
              </AppText>
            </View>
          </View>

          <View style={styles.tipDivider} />

          <View style={styles.tipRow}>
            <View style={styles.tipBullet}>
              <AppText style={styles.bulletNum}>2</AppText>
            </View>
            <View style={styles.tipContent}>
              <AppText style={styles.tipTitle} weight="bold">
                Hold completely still
              </AppText>
              <AppText style={styles.tipDesc}>
                Maintain firm contact with the card for at least 3 seconds until the success checkmark appears.
              </AppText>
            </View>
          </View>

          <View style={styles.tipDivider} />

          <View style={styles.tipRow}>
            <View style={styles.tipBullet}>
              <AppText style={styles.bulletNum}>3</AppText>
            </View>
            <View style={styles.tipContent}>
              <AppText style={styles.tipTitle} weight="bold">
                Check for thick or metal phone cases
              </AppText>
              <AppText style={styles.tipDesc}>
                Magnetic wallet attachments or heavy metal cases can block radio frequencies.
              </AppText>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.btnGroup}>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
            onPress={handleRetry}
          >
            <AppIcon name="RotateCcw" size={18} color="#FFFFFF" />
            <AppText style={styles.retryBtnText} weight="bold">
              Try Again
            </AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
            onPress={handleCancel}
          >
            <AppText style={styles.cancelBtnText}>Cancel</AppText>
          </Pressable>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  navRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  iconCenter: {
    alignItems: 'center',
    marginVertical: 20,
  },
  warningCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 159, 10, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 10, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: C.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 290,
    lineHeight: 20,
  },
  troubleCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginVertical: 16,
  },
  troubleHeader: {
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 14,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  bulletNum: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '700',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    color: C.text,
  },
  tipDesc: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  tipDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  btnGroup: {
    gap: 12,
    marginTop: 10,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    paddingVertical: 16,
    borderRadius: 16,
  },
  retryBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  retryBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelBtnPressed: {
    opacity: 0.7,
  },
  cancelBtnText: {
    fontSize: 14,
    color: C.textSecondary,
  },
});
