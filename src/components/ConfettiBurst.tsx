import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * ConfettiBurst - lightweight, no-canvas confetti burst.
 *
 * Renders a cluster of colored tiles that fly outward with gravity + fade.
 * Pure react-native-reanimated, no SVG dependency.
 *
 * Used on card save, follow-up done, and any "moment of delight".
 */

export interface ConfettiBurstProps {
  /** Number of particles. */
  count?: number;
  /** Auto-fire on mount. */
  autoPlay?: boolean;
  /** Show indefinitely (manual control). */
  visible?: boolean;
  /** Origin point relative to the parent. (0-1, 0-1). */
  origin?: { x: number; y: number };
  /** Animation length in ms. */
  durationMs?: number;
}

interface ParticleSpec {
  id: number;
  angle: number;
  distance: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const PALETTE = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FFD60A', '#5AC8FA'];

function buildParticles(count: number): ParticleSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const distance = 90 + Math.random() * 90;
    return {
      id: i,
      angle,
      distance,
      rotation: (Math.random() - 0.5) * 540,
      color: PALETTE[i % PALETTE.length],
      size: 6 + Math.random() * 6,
      delay: Math.floor(Math.random() * 90),
    };
  });
}

export function ConfettiBurst({
  count = 24,
  autoPlay = true,
  visible = true,
  origin = { x: 0.5, y: 0.5 },
  durationMs = 1200,
}: ConfettiBurstProps) {
  const particles = useMemo(() => buildParticles(count), [count]);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!autoPlay) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: durationMs, easing: Easing.out(Easing.cubic) });
  }, [autoPlay, durationMs, progress, visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          particle={particle}
          origin={origin}
          progress={progress}
        />
      ))}
    </View>
  );
}

interface ParticleProps {
  particle: ParticleSpec;
  origin: { x: number; y: number };
  progress: SharedValue<number>;
}

function Particle({ particle, origin, progress }: ParticleProps) {
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const dx = Math.cos(particle.angle) * particle.distance * t;
    const dy = Math.sin(particle.angle) * particle.distance * t + 220 * t * t;
    const rotate = particle.rotation * t;
    const opacity = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
    return {
      transform: [{ translateX: dx }, { translateY: dy }, { rotate: `${rotate}deg` }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${origin.x * 100}%`,
          top: `${origin.y * 100}%`,
          width: particle.size,
          height: particle.size * 0.5,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    overflow: 'visible',
  },
  particle: {
    position: 'absolute',
    marginLeft: -6,
    marginTop: -3,
    borderRadius: 2,
  },
});
