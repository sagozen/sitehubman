import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticPattern } from '@/src/utils/haptics';
import { Easings, MotionDuration } from '@/src/utils/motion';
import { ConfettiBurst } from '@/src/components/ConfettiBurst';

/**
 * LiveTapSuccess - full-screen celebration when a tap completes.
 *
 * The single "moment of delight" that distinguishes us from the boring
 * "Card shared" alerts in every competitor app. Plays once and dismisses.
 */

export interface LiveTapSuccessProps {
  visible: boolean;
  /** Title shown above the success ring. Defaults to a friendly message. */
  title?: string;
  /** Subtitle - typically the recipient name or context. */
  subtitle?: string;
  /** Auto-dismiss after this many ms. Pass 0 to require tap to dismiss. */
  autoDismissMs?: number;
  onDismiss?: () => void;
}

export function LiveTapSuccess({
  visible,
  title = 'Tap shared',
  subtitle,
  autoDismissMs = 2200,
  onDismiss,
}: LiveTapSuccessProps) {
  const enter = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    HapticPattern.tapSuccess();
    enter.value = 0;
    ring.value = 0;
    enter.value = withSequence(
      withTiming(1, { duration: MotionDuration.slow, easing: Easings.emphasized }),
      withDelay(60, withTiming(1, { duration: 0 })),
    );
    ring.value = withSequence(
      withTiming(1, { duration: 520, easing: Easings.standard }),
      withDelay(120, withTiming(1, { duration: 0 })),
    );

    if (autoDismissMs > 0) {
      const timeout = setTimeout(() => onDismiss?.(), autoDismissMs);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [autoDismissMs, enter, onDismiss, ring, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
  }));

  const ringStyle = useAnimatedStyle(() => {
    const scale = interpolate(ring.value, [0, 1], [0.4, 1]);
    const opacity = interpolate(ring.value, [0, 0.6, 1], [0, 0.9, 0]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const coreStyle = useAnimatedStyle(() => {
    const scale = interpolate(enter.value, [0, 0.7, 1], [0.6, 1.08, 1]);
    return { transform: [{ scale }] };
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.root} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss">
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.scrim} />
        </Animated.View>

        <View style={styles.center} pointerEvents="none">
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={[styles.core, coreStyle]}>
            <AppIcon name="CircleCheck" size={56} color="#34C759" />
          </Animated.View>
        </View>

        <Animated.View style={[styles.copy, coreStyle]} pointerEvents="none">
          <AppText style={styles.title}>{title}</AppText>
          {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
        </Animated.View>

        <View pointerEvents="none" style={styles.confetti}>
          <ConfettiBurst count={32} origin={{ x: 0.5, y: 0.42 }} durationMs={1500} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,12,18,0.42)',
  },
  center: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  core: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0A0C12',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 16,
  },
  copy: {
    position: 'absolute',
    bottom: 120,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  confetti: {
    ...StyleSheet.absoluteFillObject,
  },
});
