/**
 * GuestNfcDemoScreen.tsx — Apple NameDrop × Contactless NFC Simulator.
 *
 * Designed with Apple HIG specifications:
 *  - Interactive Flippable 3D Titanium NFC Card
 *  - Apple AirDrop / NameDrop radar wave simulation
 *  - Haptic feedback on tap simulation
 *  - LiveTapSuccess celebration modal integration
 *  - Instant QR Code beam backup mode
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { PageHeader } from '@/src/components/PageHeader';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { LiveTapSuccess } from '@/src/components/LiveTapSuccess';
import { NfcBeamModal } from '@/src/components/NfcBeamModal';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights } from '@/src/services/customerInsightsService';
import { HapticTap } from '@/src/utils/haptics';
import { pageThemes } from '@/src/constants/pageThemes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 350);

export function GuestNfcDemoScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [bioSlug, setBioSlug] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBeamModal, setShowBeamModal] = useState(false);

  const pulse = useRef(new Animated.Value(0)).current;
  const tapScale = useRef(new Animated.Value(1)).current;

  const cardName = bioPage?.displayName?.trim() || user?.displayName?.trim() || 'Alexander Wright';
  const cardTitle = bioPage?.tagline?.trim() || bioPage?.headline?.trim() || 'Founder & CEO';

  useEffect(() => {
    if (isGuest || !user?.id) {
      setBioSlug(bioPage?.slug || null);
      return;
    }
    void getCustomerInsights(user.id).then((i) => {
      setBioSlug(i.bioSlug || bioPage?.slug || null);
    });
  }, [isGuest, user?.id, bioPage?.slug]);

  // Continuous pulsating wave animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ring1Scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const ring1Opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const ring2Scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const ring2Opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });

  function handleSimulateTap() {
    HapticTap.heavy();
    Animated.sequence([
      Animated.timing(tapScale, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
    ]).start();

    setShowSuccessModal(true);
  }

  function handleSuccessDismiss() {
    setShowSuccessModal(false);
    if (bioSlug) {
      router.push(`/public/${bioSlug}` as any);
    } else {
      router.push('/(tabs)/profile' as any);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader
          theme={pageThemes.nfc}
          eyebrow="Apple NameDrop & NFC Demo"
          title="NFC Beam"
          subtitle="Experience contactless digital pass transmission in real time."
          icon="Nfc"
          showBack
        />

        {/* 3D Flippable Smart Pass Card */}
        <View style={styles.cardContainer}>
          <FlippableNfcCard
            fullName={cardName}
            title={cardTitle}
            width={CARD_WIDTH}
            gradientIndex={0}
          />
          <AppText style={styles.cardHint}>Tap card to inspect security chip reverse ↑</AppText>
        </View>

        {/* Apple NameDrop Wave Touch Target */}
        <Animated.View style={{ transform: [{ scale: tapScale }] }}>
          <Pressable
            style={styles.tapZone}
            onPress={handleSimulateTap}
            accessibilityRole="button"
            accessibilityLabel="Simulate NFC Tap"
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.ring, { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] }]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.ring, styles.ring2, { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }]}
            />

            <View style={styles.orbWrap}>
              <AppIcon name="Nfc" size={38} color="#0A84FF" />
            </View>

            <View style={styles.tapCopyWrap}>
              <AppText style={styles.tapLabel} weight="extrabold">Tap to Simulate NFC Beam</AppText>
              <AppText style={styles.tapSub}>Simulates holding near any iPhone or Android phone</AppText>
            </View>

            <View style={styles.simulateBadge}>
              <AppIcon name="Sparkles" size={13} color="#0A84FF" />
              <AppText style={styles.simulateBadgeText} weight="bold">Instant 0.2s Transmission</AppText>
            </View>
          </Pressable>
        </Animated.View>

        {/* Secondary Action: Fullscreen NameDrop Beam Modal */}
        <Pressable
          style={styles.beamRowBtn}
          onPress={() => {
            HapticTap.selection();
            setShowBeamModal(true);
          }}
        >
          <View style={styles.beamRowIcon}>
            <AppIcon name="QrCode" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.beamRowCopy}>
            <AppText style={styles.beamRowTitle} weight="bold">Present Live QR Code</AppText>
            <AppText style={styles.beamRowSubtitle}>High-contrast display for optical camera scans</AppText>
          </View>
          <AppIcon name="ChevronRight" size={16} color="rgba(235, 235, 245, 0.4)" />
        </Pressable>

        {/* How It Works List */}
        <View style={styles.stepsCard}>
          <AppText style={styles.stepsTitle} weight="extrabold">How Contactless Passing Works</AppText>
          {[
            {
              icon: 'Nfc' as const,
              title: 'Encrypted Microchip',
              desc: 'High-grade NTAG216 chip securely transmits your dynamic cloud pass URL.',
            },
            {
              icon: 'Smartphone' as const,
              title: 'Universal Hardware Compatibility',
              desc: 'Compatible with 100% of modern iPhones (iOS 13+) and Androids without any app.',
            },
            {
              icon: 'Zap' as const,
              title: 'Instant Cloud Profile',
              desc: 'Opens full executive profile with contact save, social links, and lead exchange.',
            },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIconWrap}>
                <AppIcon name={step.icon} size={20} color="#0A84FF" />
              </View>
              <View style={styles.stepContent}>
                <AppText style={styles.stepItemTitle} weight="bold">{step.title}</AppText>
                <AppText style={styles.stepText}>{step.desc}</AppText>
              </View>
            </View>
          ))}
        </View>
      </IosScrollView>

      {/* Live Tap Success Celebration Modal */}
      <LiveTapSuccess
        visible={showSuccessModal}
        title="NFC Beam Connected!"
        subtitle={`Opening ${cardName}'s Executive Profile...`}
        autoDismissMs={1800}
        onDismiss={handleSuccessDismiss}
      />

      {/* Fullscreen NameDrop Beam Modal */}
      <NfcBeamModal
        visible={showBeamModal}
        onClose={() => setShowBeamModal(false)}
        fullName={cardName}
        title={cardTitle}
        url={bioSlug ? `https://aviobrand.com/u/${bioSlug}` : 'https://aviobrand.com/u/demo'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 120,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  cardContainer: {
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cardHint: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.45)',
    textAlign: 'center',
  },
  tapZone: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
    padding: 24,
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: '#0A84FF',
  },
  ring2: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  orbWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapCopyWrap: {
    alignItems: 'center',
    gap: 4,
  },
  tapLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  tapSub: {
    fontSize: 13,
    color: 'rgba(235, 235, 245, 0.55)',
    textAlign: 'center',
  },
  simulateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.2)',
  },
  simulateBadgeText: {
    fontSize: 11,
    color: '#0A84FF',
    letterSpacing: 0.2,
  },
  beamRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  beamRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beamRowCopy: {
    flex: 1,
    gap: 2,
  },
  beamRowTitle: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  beamRowSubtitle: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.5)',
  },
  stepsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    gap: 16,
  },
  stepsTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepItemTitle: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 13,
    color: 'rgba(235, 235, 245, 0.6)',
    lineHeight: 18,
  },
});
