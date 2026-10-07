import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

export function OnboardingWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handleGetStarted() {
    HapticTap.medium();
    router.push('/onboarding/purpose');
  }

  function handleLogin() {
    HapticTap.light();
    router.push('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 48) }]}>
        {/* Top spacer */}
        <View style={styles.topSpacer} />

        {/* NFC Card Mockup */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['#1A1A1E', '#0D1117']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardMockup}
          >
            {/* Card shimmer line top */}
            <LinearGradient
              colors={['rgba(37,150,190,0.6)', 'rgba(37,150,190,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardAccentLine}
            />

            {/* NFC chip */}
            <View style={styles.nfcChip}>
              <LinearGradient
                colors={['#2C2C30', '#1C1C20']}
                style={styles.chipGradient}
              >
                <View style={styles.chipInner} />
              </LinearGradient>
            </View>

            {/* Card content area */}
            <View style={styles.cardContent}>
              <View style={styles.cardNameBlock}>
                <View style={styles.cardNameLine} />
                <View style={styles.cardSubLine} />
              </View>
              <View style={styles.nfcBadge}>
                <LinearGradient
                  colors={['rgba(37,150,190,0.2)', 'rgba(37,150,190,0.05)']}
                  style={styles.nfcBadgeGradient}
                >
                  <View style={styles.nfcDot} />
                </LinearGradient>
              </View>
            </View>

            {/* Bottom accent */}
            <LinearGradient
              colors={['rgba(37,150,190,0)', 'rgba(37,150,190,0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { pointerEvents: 'none' as any }]}
            />
          </LinearGradient>

          {/* Card shadow glow */}
          <View style={styles.cardGlow} pointerEvents="none" />
        </View>

        {/* Hero copy */}
        <View style={styles.heroText}>
          <AppText variant="display" weight="semibold" style={styles.tagline}>
            Your identity.{'\n'}One tap.
          </AppText>
          <AppText variant="body" muted style={styles.subtitle}>
            Share your professional profile instantly with a single NFC tap. No app needed on the other end.
          </AppText>
        </View>

        <View style={styles.spacer} />

        {/* CTA buttons */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={handleGetStarted}
            hitSlop={8}
          >
            <AppText variant="body" weight="semibold" style={styles.primaryBtnText}>
              Get Started
            </AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}
            onPress={handleLogin}
            hitSlop={8}
          >
            <AppText variant="body" style={styles.ghostBtnText}>
              I already have an account
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  topSpacer: {
    height: 32,
  },
  cardWrapper: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1.586,
    marginBottom: 48,
  },
  cardMockup: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
  },
  cardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  nfcChip: {
    width: 44,
    height: 34,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 'auto',
  },
  chipGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInner: {
    width: 28,
    height: 20,
    borderRadius: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  cardNameBlock: {
    gap: 8,
  },
  cardNameLine: {
    width: 120,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardSubLine: {
    width: 80,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  nfcBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  nfcBadgeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2596BE',
  },
  cardGlow: {
    position: 'absolute',
    bottom: -24,
    left: '10%',
    right: '10%',
    height: 40,
    borderRadius: 40,
    backgroundColor: '#2596BE',
    opacity: 0.12,
    // Blurred using overflow approach
    transform: [{ scaleX: 1.1 }],
  },
  heroText: {
    gap: 12,
  },
  tagline: {
    fontSize: 40,
    lineHeight: 46,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#9A9AA0',
  },
  spacer: {
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 16,
  },
  ghostBtn: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ghostBtnText: {
    color: '#9A9AA0',
    fontSize: 16,
  },
});
