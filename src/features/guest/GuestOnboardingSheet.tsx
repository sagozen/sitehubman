import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { guestUi } from '@/src/features/guest/GuestScreenUi';
import { PhotoBanner } from '@/src/components/PhotoBanner';
import { ONBOARDING_SCENE_IDS } from '@/src/constants/marketingScenes';
import { GuestOnboardingStepVisual } from '@/src/features/guest/components/GuestOnboardingStepVisual';
import { iosDesign } from '@/src/design-system/ios';
import {
  hasSeenGuestOnboarding,
  markGuestOnboardingSeen,
} from '@/src/services/guestOnboardingService';

type StepKind = 'design' | 'checkout' | 'track';

type Step = {
  kind: StepKind;
  icon: AppIconName;
  title: string;
  body: string;
  cta: string;
  action: () => void;
};

type GuestOnboardingSheetProps = {
  visible: boolean;
  onClose: () => void;
  onDesign: () => void;
  onCheckout: () => void;
};

export function GuestOnboardingSheet({
  visible,
  onClose,
  onDesign,
  onCheckout,
}: GuestOnboardingSheetProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      kind: 'design',
      icon: 'PenLine',
      title: 'Design your NFC card',
      body: 'Choose Black, Green orange, or your own photo. Pick e-card or physical PVC / wood / metal.',
      cta: 'Start designing',
      action: () => {
        onClose();
        onDesign();
      },
    },
    {
      kind: 'checkout',
      icon: 'CreditCard',
      title: 'Order & pay in Cambodia',
      body: 'Pay with KHQR, ABA, Wing, or Pi Pay. We print, NFC-encode, and add QR on every card.',
      cta: 'Go to checkout',
      action: () => {
        onClose();
        void onCheckout();
      },
    },
    {
      kind: 'track',
      icon: 'Package',
      title: 'Track print & delivery',
      body: 'Follow paid → print → encode → ship. Sign in to save orders on any device.',
      cta: 'View track order',
      action: () => {
        onClose();
        router.push(appRoutes.guestTrackOrder);
      },
    },
  ];

  const step = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex >= steps.length - 1;

  async function handleFinish() {
    await markGuestOnboardingSeen();
    onClose();
  }

  function handleNext() {
    if (isLast) {
      void handleFinish();
      return;
    }
    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <AppText style={styles.kicker}>Premium NFC cards</AppText>
          <Pressable onPress={() => void handleFinish()} hitSlop={12} accessibilityRole="button">
            <AppText style={styles.skip}>Skip</AppText>
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          {steps.map((item, index) => (
            <View
              key={item.kind}
              style={[styles.progressDot, index <= stepIndex && styles.progressDotActive]}
            />
          ))}
        </View>

        <PhotoBanner
          marketingSceneId={ONBOARDING_SCENE_IDS[stepIndex] ?? 'welcome'}
          cacheKey={`onboarding-${step.kind}`}
          variant="compact"
          overlay="product"
          style={styles.sceneBanner}
        />
        <GuestOnboardingStepVisual kind={step.kind} />

        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <AppIcon name={step.icon} size={28} color={guestUi.accent} />
          </View>
          <AppText style={styles.title}>{step.title}</AppText>
          <AppText style={styles.body}>{step.body}</AppText>
        </View>

        <View style={styles.footer}>
          <AppButton label={step.cta} iconName={step.icon} onPress={step.action} />
          <AppButton
            label={isLast ? 'Done' : 'Next step'}
            variant="outline"
            onPress={handleNext}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function useGuestOnboardingGate(enabled: boolean) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      const seen = await hasSeenGuestOnboarding();
      if (!seen) setVisible(true);
    })();
  }, [enabled]);

  const dismiss = useCallback(async () => {
    await markGuestOnboardingSeen();
    setVisible(false);
  }, []);

  return { visible, dismiss };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: iosDesign.spacing.lg,
    paddingTop: iosDesign.spacing.sm,
  },
  kicker: { fontSize: 13, fontWeight: '800', color: guestUi.muted },
  skip: { fontSize: 14, fontWeight: '700', color: guestUi.accent },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: iosDesign.spacing.lg,
    paddingVertical: iosDesign.spacing.md,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: guestUi.border,
  },
  progressDotActive: { backgroundColor: guestUi.accent },
  sceneBanner: {
    marginHorizontal: iosDesign.spacing.lg,
  },
  hero: {
    flex: 1,
    paddingHorizontal: iosDesign.spacing.lg,
    paddingTop: iosDesign.spacing.lg,
    gap: iosDesign.spacing.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: guestUi.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '800', color: guestUi.text, letterSpacing: -0.4 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500', color: guestUi.muted },
  footer: {
    padding: iosDesign.spacing.lg,
    gap: iosDesign.spacing.sm,
  },
});
