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
        {/* Green circle checkmark */}
        <View style={styles.successCircle}>
          <AppIcon name="Check" size={48} color="#30D158" />
        </View>

        <AppText style={styles.title}>You're ready</AppText>
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
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(48,209,88,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5F5F7',
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnPressed: {
    opacity: 0.7,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F7',
  },
});
