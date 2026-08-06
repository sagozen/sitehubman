/**
 * Production Button
 * Manufacturing-grade button component that ships next month
 * No decoration. Clear hierarchy. Text-first.
 * 
 * Inspired by: Linear, Arc Browser, Apple Wallet
 */

import React, { memo, useCallback } from 'react';
import { Pressable, Text, StyleSheet, type PressableProps, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { production } from '@/src/design-system/production';
import { HapticTap } from '@/src/utils/haptics';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

interface ProductionButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  /** Button text (text-only, no icons by default) */
  label: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Press handler */
  onPress?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ProductionButtonRaw({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  ...rest
}: ProductionButtonProps) {
  // Animation
  const scale = useSharedValue(1);
  
  const handlePressIn = useCallback(() => {
    scale.value = withTiming(
      production.animation.scale.buttonPress,
      { duration: production.animation.duration.fast }
    );
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    HapticTap.selection();
    onPress?.();
  }, [disabled, loading, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get variant styles
  const variantConfig = production.button[variant];
  
  return (
    <Animated.View 
      style={[
        fullWidth && styles.fullWidth,
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        android_ripple={null}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.button,
          {
            backgroundColor: variantConfig.background,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator
            color={variantConfig.text}
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.text,
              production.typography.body,
              {
                color: variantConfig.text,
                fontWeight: '500',
              },
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const ProductionButton = memo(ProductionButtonRaw);

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
  button: {
    height: production.button.height,
    paddingHorizontal: production.button.paddingX,
    borderRadius: production.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: -0.1,
  },
});
