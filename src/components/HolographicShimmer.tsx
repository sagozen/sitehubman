import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * HolographicShimmer - subtle moving rainbow overlay used on hero surfaces
 * (NFC card face, primary CTAs). The slow drift sells "premium" without
 * being noisy or distracting.
 *
 * Looping animation with a long cycle so it never feels like an animation
 * "demo". Respects delay to avoid all hero surfaces shimmering in sync.
 */

export interface HolographicShimmerProps {
  /** Disable when Reduce Motion is on. */
  enabled?: boolean;
  /** Cycle length in ms (default 4800). */
  cycleMs?: number;
  /** Stagger across multiple surfaces. */
  delayMs?: number;
  /** Override the overlay opacity. */
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

export function HolographicShimmer({
  enabled = true,
  cycleMs = 4800,
  delayMs = 0,
  opacity = 0.85,
  style,
}: HolographicShimmerProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!enabled) {
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: cycleMs, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1,
        false,
      ),
    );
  }, [cycleMs, delayMs, enabled, t]);

  const sheenStyle = useAnimatedStyle(() => {
    const translateX = interpolate(t.value, [0, 1], [-260, 360]);
    const rotate = interpolate(t.value, [0, 0.5, 1], [12, -6, 12]);
    return {
      transform: [{ translateX }, { rotate: `${rotate}deg` }],
      opacity: opacity * (0.5 + 0.5 * Math.sin(t.value * Math.PI)),
    };
  });

  if (!enabled) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.mask, style]}>
      <Animated.View style={[styles.band, sheenStyle]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.18)',
            'rgba(120,200,255,0.28)',
            'rgba(255,255,255,0.18)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Subtle starfield for depth on dark surfaces. */}
      <View style={styles.glowA} />
      <View style={styles.glowB} />
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: -60,
    bottom: -60,
    left: 0,
    width: 200,
  },
  glowA: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(120,200,255,0.06)',
  },
  glowB: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(180,120,255,0.05)',
  },
});
