import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

export default function NfcSuccessScreen() {
  const handleTest = useCallback(() => {
    HapticTap.medium();
    router.push('/nfc/test' as never);
  }, []);

  const handleDone = useCallback(() => {
    HapticTap.light();
    router.replace('/(tabs)' as never);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        {/* Success icon */}
        <View style={styles.successCircle}>
          <AppIcon name="Check" size={48} color="#FFFFFF" />
        </View>

        <AppText style={styles.title}>You&apos;re ready</AppText>
        <AppText style={styles.subtitle}>
          Your NFC card is connected to your digital profile.
        </AppText>

        <View style={styles.btnGroup}>
          <Pressable
            style={({ pressed }) => [styles.testBtn, pressed && styles.testBtnPressed]}
            onPress={handleTest}
          >
            <AppText style={styles.testBtnText}>Test Card</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
            onPress={handleDone}
          >
            <AppText style={styles.doneBtnText}>Done</AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0E',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 16,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#9A9AA0',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  btnGroup: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  testBtn: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  testBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  doneBtn: {
    height: 54,
    backgroundColor: 'transparent',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnPressed: {
    opacity: 0.7,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
