/**
 * OnboardingScreen — 3-Step First-Time User Onboarding Flow
 *
 * Step 1: Welcome — Brand intro with AVIO value prop
 * Step 2: Name & Role — Set up identity
 * Step 3: Share — Animate the card and show first win
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  {
    eyebrow: 'WELCOME TO AVIO',
    title: 'Your identity.\nIn one tap.',
    subtitle: 'Share your name, contacts, socials, and story — all from a single NFC smart pass.',
    icon: 'Nfc' as const,
  },
  {
    eyebrow: 'BUILD YOUR PASS',
    title: 'Tell us\nwho you are.',
    subtitle: 'Your name and role appear on your card when someone taps it.',
    icon: 'User' as const,
  },
  {
    eyebrow: 'YOU\'RE READY',
    title: 'Share your card\nright now.',
    subtitle: 'Anyone with a phone can tap or scan to connect with you instantly.',
    icon: 'Share2' as const,
  },
];

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;

  function advanceProgress(toStep: number) {
    Animated.spring(progressAnim, {
      toValue: toStep / (STEPS.length - 1),
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }

  function handleNext() {
    HapticTap.medium();
    if (step < STEPS.length - 1) {
      const next = step + 1;
      setStep(next);
      advanceProgress(next);
    } else {
      void handleFinish();
    }
  }

  async function handleFinish() {
    HapticTap.heavy();
    // Persist name/title to AsyncStorage for auto-fill on guest draft
    if (displayName.trim()) {
      await AsyncStorage.setItem('@avio_onboarding_name', displayName.trim());
      await AsyncStorage.setItem('@avio_onboarding_title', jobTitle.trim());
    }
    // Mark onboarding as complete
    await AsyncStorage.setItem('@avio_onboarding_done', '1');
    router.replace('/' as any);
  }

  function handleSkip() {
    HapticTap.light();
    void AsyncStorage.setItem('@avio_onboarding_done', '1').then(() => {
      router.replace('/' as any);
    });
  }

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const isNameStep = step === 1;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['33%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Skip */}
      {!isLastStep && (
        <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={12}>
          <AppText style={styles.skipText} weight="bold">Skip</AppText>
        </Pressable>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Step Icon */}
        <View style={styles.iconSeal}>
          <AppIcon name={current.icon} size={28} color="#FFFFFF" />
        </View>

        {/* Step Eyebrow */}
        <AppText style={styles.eyebrow} weight="extrabold">{current.eyebrow}</AppText>

        {/* Step Title */}
        <AppText style={styles.title} weight="extrabold">{current.title}</AppText>

        {/* Step Subtitle */}
        <AppText style={styles.subtitle}>{current.subtitle}</AppText>

        {/* Step 2: Identity Form */}
        {isNameStep && (
          <View style={styles.formBlock}>
            <View style={styles.fieldWrap}>
              <AppText style={styles.fieldLabel} weight="bold">Full Name</AppText>
              <TextInput
                style={styles.fieldInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Alex Wright"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldWrap}>
              <AppText style={styles.fieldLabel} weight="bold">Title / Role</AppText>
              <TextInput
                style={styles.fieldInput}
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="Founder & CEO"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* Step 3: Card preview hint */}
        {isLastStep && (
          <View style={styles.cardPreviewHint}>
            <View style={styles.cardPreviewMock}>
              <AppText style={styles.cardPreviewName} weight="extrabold">
                {displayName || 'Your Name'}
              </AppText>
              <AppText style={styles.cardPreviewTitle}>
                {jobTitle || 'Your Title'}
              </AppText>
              <View style={styles.cardPreviewNfc}>
                <AppIcon name="Nfc" size={14} color="rgba(255,255,255,0.5)" />
                <AppText style={styles.cardPreviewNfcText}>AVIO SMART PASS</AppText>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Step dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>

      {/* Primary CTA Button */}
      <View style={styles.ctaBlock}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
        >
          <AppText style={styles.ctaBtnText} weight="extrabold">
            {isLastStep ? 'Take Me to My Card →' : 'Continue →'}
          </AppText>
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
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 0,
  },
  progressFill: {
    height: 2,
    backgroundColor: '#FFFFFF',
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    gap: 16,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  iconSeal: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    lineHeight: 22,
  },
  formBlock: {
    gap: 12,
    marginTop: 8,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  fieldInput: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'System',
  },
  cardPreviewHint: {
    marginTop: 8,
    alignItems: 'center',
  },
  cardPreviewMock: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    gap: 6,
  },
  cardPreviewName: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  cardPreviewTitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
  },
  cardPreviewNfc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  cardPreviewNfcText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
    borderRadius: 3,
  },
  ctaBlock: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaBtnText: {
    color: '#000000',
    fontSize: 16,
  },
});
