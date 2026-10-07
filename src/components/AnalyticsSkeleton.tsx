import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, withRepeat, withSequence, withTiming, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { tokens } from '@/src/design-system/tokens';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 48, 350);

export function AnalyticsSkeleton() {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.shimmerBox, styles.eyebrow, animatedStyle]} />
        <Animated.View style={[styles.shimmerBox, styles.title, animatedStyle]} />
        <Animated.View style={[styles.shimmerBox, styles.subtitle, animatedStyle]} />
      </View>

      <View style={styles.cardContainer}>
        <Animated.View style={[styles.shimmerBox, styles.card, animatedStyle]} />
      </View>

      <Animated.View style={[styles.shimmerBox, styles.sparkline, animatedStyle]} />

      <View style={styles.bentoGrid}>
        {[1, 2, 3, 4].map(i => (
          <Animated.View key={i} style={[styles.shimmerBox, styles.bentoBox, animatedStyle]} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 24,
  },
  shimmerBox: {
    backgroundColor: '#242424',
    borderRadius: tokens.radius.md,
  },
  header: {
    gap: 8,
  },
  eyebrow: { width: 100, height: 16 },
  title: { width: 200, height: 36, borderRadius: tokens.radius.lg },
  subtitle: { width: '80%', height: 20 },
  cardContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 24,
  },
  sparkline: {
    width: '100%',
    height: 80,
    borderRadius: 16,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bentoBox: {
    width: (width - 48 - 16) / 2,
    height: 120,
    borderRadius: 20,
  },
});
