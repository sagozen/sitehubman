/**
 * OnboardingScreen — 3-Step First-Time User Onboarding Flow
 *
 * Step 1: Welcome      — Brand intro with AVIO value prop
 * Step 2: Name & Role  — Set up identity (name required, email + role optional)
 * Step 3: Your Card    — Real live card preview + CTA to create account
 *
 * On finish → navigates to /auth/register with name + email pre-filled.
 * On skip   → navigates to / as guest.
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 56, 340);

// ─── Step metadata ──────────────────────────────────────────────────────────
const STEPS = [
  {
    eyebrow: 'WELCOME TO AVIO',
    title: 'Your identity.\nIn one tap.',
    subtitle:
      'Share your name, contacts, socials, and story — all from a single NFC smart pass. Works with any phone, no app needed.',
    icon: 'Nfc' as const,
  },
  {
    eyebrow: 'BUILD YOUR PASS',
    title: 'Tell us\nwho you are.',
    subtitle:
      'Your name appears on your card every time someone taps it. Takes 20 seconds.',
    icon: 'User' as const,
  },
  {
    eyebrow: "YOU'RE READY",
    title: 'Your card\nis live.',
    subtitle:
      'Create a free account to save your card, track who tapped it, and share it anywhere.',
    icon: 'CheckCircle' as const,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function OnboardingScreen() {
  const [step, setStep] = useState(0);

  // Step 2 form state
  const [displayName, setDisplayName] = useState('');
  const [jobTitle, setJobTitle]       = useState('');
  const [email, setEmail]             = useState('');
  const [nameError, setNameError]     = useState('');

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  function advanceProgress(toStep: number) {
    Animated.spring(progressAnim, {
      toValue: toStep / (STEPS.length - 1),
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }

  // ── Validate step 2 before advancing ────────────────────────────────────
  function validateAndNext() {
    HapticTap.medium();

    if (step === 1) {
      if (!displayName.trim()) {
        setNameError('Please enter your name to continue.');
        return;
      }
      setNameError('');
    }

    if (step < STEPS.length - 1) {
      const next = step + 1;
      setStep(next);
      advanceProgress(next);
    } else {
      void handleFinish();
    }
  }

  // ── Persist draft + navigate to register ───────────────────────────────
  async function handleFinish() {
    HapticTap.heavy();

    const name  = displayName.trim();
    const title = jobTitle.trim();
    const mail  = email.trim().toLowerCase();

    // 1. Save into onboarding keys (RegisterScreen reads these to pre-fill)
    await AsyncStorage.multiSet([
      ['@avio_onboarding_name',  name],
      ['@avio_onboarding_title', title],
      ['@avio_onboarding_email', mail],
      ['@avio_onboarding_done',  '1'],
    ]);

    // 2. Wire into guest card draft so the card shows their name immediately
    if (name) {
      try {
        const { loadGuestCardDraft, saveGuestCardDraft } = await import(
          '@/src/services/guestDraftService'
        );
        const existing = await loadGuestCardDraft();
        await saveGuestCardDraft({
          displayName:      name,
          jobTitle:         title,
          company:          existing?.company          ?? '',
          email:            mail || (existing?.email  ?? ''),
          phone:            existing?.phone            ?? '',
          telegram:         existing?.telegram,
          product:          existing?.product          ?? 'pvc_card',
          cardDesign:       existing?.cardDesign       ?? 'classic_black',
          gradientIndex:    existing?.gradientIndex    ?? 0,
          customImageUri:   existing?.customImageUri   ?? null,
          designBackground: existing?.designBackground,
          cardChoice:       existing?.cardChoice       ?? 'physical',
        });
      } catch {
        // onboarding must not crash on draft errors
      }
    }

    // 3. Send user to register (pre-filled via AsyncStorage)
    router.replace('/auth/register');
  }

  // ── Skip → guest mode ───────────────────────────────────────────────────
  function handleSkip() {
    HapticTap.light();
    void AsyncStorage.setItem('@avio_onboarding_done', '1').then(() =>
      router.replace('/')
    );
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const current    = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const isNameStep = step === 1;

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['33%', '100%'],
  });

  const canContinue = step !== 1 || displayName.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Skip */}
      {!isLastStep && (
        <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={12}>
          <AppText style={styles.skipText} weight="bold">
            Skip
          </AppText>
        </Pressable>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Content ── */}
          <View style={styles.content}>
            {/* Step icon */}
            <View style={styles.iconSeal}>
              <AppIcon name={current.icon} size={28} color="#FFFFFF" />
            </View>

            <AppText style={styles.eyebrow} weight="extrabold">
              {current.eyebrow}
            </AppText>
            <AppText style={styles.title} weight="extrabold">
              {current.title}
            </AppText>
            <AppText style={styles.subtitle}>{current.subtitle}</AppText>

            {/* ── Step 2: Identity form ── */}
            {isNameStep && (
              <View style={styles.formBlock}>
                {/* Full Name (required) */}
                <View style={styles.fieldWrap}>
                  <View style={styles.fieldLabelRow}>
                    <AppText style={styles.fieldLabel} weight="bold">
                      Full Name
                    </AppText>
                    <AppText style={styles.required}>required</AppText>
                  </View>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      nameError ? styles.fieldInputError : null,
                    ]}
                    value={displayName}
                    onChangeText={(v) => {
                      setDisplayName(v);
                      if (v.trim()) setNameError('');
                    }}
                    placeholder="Alex Wright"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    autoCapitalize="words"
                    autoFocus
                    returnKeyType="next"
                  />
                  {nameError ? (
                    <Text style={styles.errorText}>{nameError}</Text>
                  ) : null}
                </View>

                {/* Title / Role (optional) */}
                <View style={styles.fieldWrap}>
                  <AppText style={styles.fieldLabel} weight="bold">
                    Title / Role{' '}
                    <Text style={styles.optional}>(optional)</Text>
                  </AppText>
                  <TextInput
                    style={styles.fieldInput}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="Founder & CEO"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                {/* Email (optional — pre-fills register) */}
                <View style={styles.fieldWrap}>
                  <AppText style={styles.fieldLabel} weight="bold">
                    Email{' '}
                    <Text style={styles.optional}>(optional — saves time later)</Text>
                  </AppText>
                  <TextInput
                    style={styles.fieldInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="alex@company.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={validateAndNext}
                  />
                </View>
              </View>
            )}

            {/* ── Step 3: Real live card preview ── */}
            {isLastStep && (
              <View style={styles.cardPreviewWrap}>
                <FlippableNfcCard
                  fullName={displayName || 'Your Name'}
                  title={jobTitle || undefined}
                  width={CARD_WIDTH}
                  gradientIndex={0}
                />
                <AppText style={styles.cardHint}>
                  Tap the card to flip it ↑
                </AppText>

                {/* What you get next */}
                <View style={styles.benefitsList}>
                  {[
                    { icon: 'Cloud'     as const, text: 'Card saved to your account'         },
                    { icon: 'BarChart2' as const, text: 'Track every tap & view in real time' },
                    { icon: 'Link'      as const, text: 'Your own link: aviobrand.com/you'    },
                    { icon: 'Shield'    as const, text: 'Free forever — no credit card'       },
                  ].map((b) => (
                    <View key={b.text} style={styles.benefitRow}>
                      <View style={styles.benefitIcon}>
                        <AppIcon name={b.icon} size={14} color="#FFFFFF" />
                      </View>
                      <AppText style={styles.benefitText} weight="medium">
                        {b.text}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Step dots ── */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      {/* ── Primary CTA ── */}
      <View style={styles.ctaBlock}>
        <Pressable
          onPress={validateAndNext}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.ctaBtn,
            !canContinue && styles.ctaBtnDisabled,
            pressed && canContinue && styles.ctaBtnPressed,
          ]}
        >
          <AppText style={styles.ctaBtnText} weight="extrabold">
            {isLastStep ? 'Create Free Account →' : 'Continue →'}
          </AppText>
        </Pressable>

        {/* On last step: secondary "maybe later" link */}
        {isLastStep && (
          <Pressable onPress={handleSkip} style={styles.laterBtn} hitSlop={10}>
            <AppText style={styles.laterText}>
              Maybe later — continue as guest
            </AppText>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Progress
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#FFFFFF',
  },

  // Skip
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 14,
  },

  // Scroll
  scrollContent: {
    flexGrow: 1,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    gap: 14,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 24,
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
    marginBottom: 6,
  },
  eyebrow: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    lineHeight: 22,
  },

  // Form (step 2)
  formBlock: {
    gap: 14,
    marginTop: 6,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  required: {
    color: '#FF453A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  optional: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    fontWeight: '400',
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
  },
  fieldInputError: {
    borderColor: '#FF453A',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 12,
    marginTop: 2,
  },

  // Card preview (step 3)
  cardPreviewWrap: {
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
    width: '100%',
  },
  cardHint: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    textAlign: 'center',
  },
  benefitsList: {
    width: '100%',
    gap: 10,
    marginTop: 6,
    backgroundColor: '#0D0D0F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 12,
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

  // CTA
  ctaBlock: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  ctaBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaBtnText: {
    color: '#000000',
    fontSize: 16,
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  laterText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
  },
});
