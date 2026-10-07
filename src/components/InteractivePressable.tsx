import React, { memo, useCallback } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Haptics } from '@/src/utils/haptics';

export interface InteractivePressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale on press down. Default: 0.975 (subtle, Apple HIG). */
  scaleTo?: number;
  /** Opacity on press down. Default: 0.92. */
  activeOpacity?: number;
  /** Haptic feedback type on tap. Default: 'selection'. */
  haptic?: 'light' | 'selection' | 'medium' | 'soft' | 'none';
  children: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
}

// Apple iOS spring physics: snappy press-in, buttery spring release
const SPRING_OUT = { damping: 18, stiffness: 280, mass: 0.7 };
const TIMING_IN = { duration: 110 };

/**
 * InteractivePressable — Apple-grade tactile press interaction.
 * Provides subtle scale, opacity reduction, spring release, and micro-haptic tick.
 */
function InteractivePressableRaw({
  children,
  style,
  scaleTo = 0.975,
  activeOpacity = 0.92,
  haptic = 'selection',
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  hitSlop = 6,
  ...rest
}: InteractivePressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(
    (e: any) => {
      if (disabled) return;
      scale.value = withTiming(scaleTo, TIMING_IN);
      opacity.value = withTiming(activeOpacity, TIMING_IN);
      onPressIn?.(e);
    },
    [disabled, scaleTo, activeOpacity, onPressIn, scale, opacity]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      if (disabled) return;
      scale.value = withSpring(1, SPRING_OUT);
      opacity.value = withTiming(1, { duration: 160 });
      onPressOut?.(e);
    },
    [disabled, onPressOut, scale, opacity]
  );

  const handlePress = useCallback(
    (e: any) => {
      if (disabled) return;
      if (haptic === 'selection') Haptics.selection();
      else if (haptic === 'light') Haptics.light();
      else if (haptic === 'medium') Haptics.medium();
      else if (haptic === 'soft') Haptics.soft();
      onPress?.(e);
    },
    [disabled, haptic, onPress]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        {...rest}
        disabled={disabled}
        hitSlop={hitSlop}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={Platform.OS === 'android' ? { color: 'rgba(255, 255, 255, 0.05)', borderless: false } : undefined}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export const InteractivePressable = memo(InteractivePressableRaw);
