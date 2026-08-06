/**
 * AppButtonV2 — Premium SaaS Quality Button
 * Redesigned with world-class attention to detail
 * Uses new design token system for consistency
 * 
 * Features:
 * - Token-based sizing and spacing (8pt grid)
 * - Semantic color system with theme awareness
 * - Refined press animations (60fps)
 * - Accessibility built-in (WCAG AA)
 * - Multiple variants with clear purposes
 * - Proper focus states and touch targets
 */

import React, { memo, useCallback, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import {
  buttonSize,
  getColor,
  getTypography,
  getDuration,
  getSpring,
  touchTarget,
  type ColorMode,
} from '@/src/design-system/utilities';
import { Haptics, HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ButtonVariant =
  | 'primary'      // Solid primary color, high emphasis
  | 'secondary'    // Outlined, medium emphasis
  | 'tertiary'     // Ghost, low emphasis
  | 'destructive'  // Danger actions
  | 'success'      // Success actions
  | 'soft'         // Subtle background
  | 'ghost'        // Text only
  | 'icon'         // Icon only, square
  | 'iconCircle';  // Icon only, circular

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonHaptic = 'light' | 'medium' | 'success' | 'error' | 'none';

export interface AppButtonV2Props extends Omit<PressableProps, 'style' | 'children'> {
  /** Button label text */
  label?: string;
  /** Alternative to label */
  children?: ReactNode;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Icon on left side */
  iconLeft?: AppIconName | ReactNode;
  /** Icon on right side */
  iconRight?: AppIconName | ReactNode;
  /** Loading state - shows spinner */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Stretch to full width */
  fullWidth?: boolean;
  /** Haptic feedback type */
  haptic?: ButtonHaptic;
  /** Override color (for primary variant) */
  color?: string;
  /** Custom styles */
  style?: StyleProp<ViewStyle>;
  /** Custom label styles */
  labelStyle?: StyleProp<TextStyle>;
  /** Press handler */
  onPress?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SIZE_CONFIG = {
  sm: { token: 'sm' as const, paddingToken: 3, radiusToken: 'md' as const, iconSize: tokens.iconSize.sm },
  md: { token: 'md' as const, paddingToken: 4, radiusToken: 'lg' as const, iconSize: tokens.iconSize.md },
  lg: { token: 'lg' as const, paddingToken: 5, radiusToken: 'xl' as const, iconSize: tokens.iconSize.lg },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AppButtonV2Raw({
  label,
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = 'light',
  color,
  onPress,
  style,
  labelStyle,
  hitSlop = 8,
  ...rest
}: AppButtonV2Props) {
  // ─── Theme & Configuration ───────────────────────────────────────────────
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';
  const sizeConfig = SIZE_CONFIG[size];
  const isIconOnly = variant === 'icon' || variant === 'iconCircle';
  const isCircular = variant === 'iconCircle';

  // ─── Animation Values ────────────────────────────────────────────────────
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // ─── Event Handlers ──────────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    scale.value = withTiming(
      tokens.animation.scale.pressed,
      { duration: getDuration('fast') }
    );
    opacity.value = withTiming(
      tokens.animation.opacity.pressed,
      { duration: getDuration('fast') }
    );
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, getSpring('snappy'));
    opacity.value = withTiming(1, { duration: getDuration('base') });
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    // Haptic feedback
    if (haptic !== 'none') {
      switch (haptic) {
        case 'light':
          Haptics.light();
          break;
        case 'medium':
          Haptics.medium();
          break;
        case 'success':
          Haptics.success();
          break;
        case 'error':
          Haptics.error();
          break;
      }
    } else {
      HapticTap.selection();
    }

    onPress?.();
  }, [disabled, loading, haptic, onPress]);

  // ─── Styles ──────────────────────────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const variantStyles = getVariantStyles(variant, mode, color, disabled);
  const baseButtonStyle = buttonSize(
    sizeConfig.token,
    sizeConfig.paddingToken,
    sizeConfig.radiusToken
  );

  const buttonStyle: ViewStyle = {
    ...baseButtonStyle,
    ...(isIconOnly && {
      width: tokens.controlHeight[sizeConfig.token],
      paddingHorizontal: 0,
    }),
    ...(isCircular && {
      borderRadius: tokens.radius.full,
    }),
    backgroundColor: variantStyles.background,
    borderWidth: variantStyles.borderWidth,
    borderColor: variantStyles.borderColor,
    opacity: disabled ? tokens.animation.opacity.disabled : 1,
  };

  const textStyle: TextStyle = {
    ...getTypography(size === 'sm' ? 'caption' : 'bodyEmphasis', 'semibold'),
    color: variantStyles.textColor,
  };

  // ─── Render Icons ────────────────────────────────────────────────────────
  const renderIcon = (icon: AppIconName | ReactNode | undefined) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <AppIcon
          name={icon as AppIconName}
          size={sizeConfig.iconSize}
          color={variantStyles.textColor}
        />
      );
    }
    return icon;
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        fullWidth && !isIconOnly && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        hitSlop={hitSlop}
        android_ripple={null}
        accessibilityRole="button"
        accessibilityLabel={label || (typeof children === 'string' ? children : rest.accessibilityLabel) || 'Button'}
        accessibilityState={{ disabled: !!disabled, busy: !!loading }}
        style={buttonStyle}
        {...rest}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={variantStyles.textColor} size="small" />
          ) : (
            <>
              {renderIcon(iconLeft)}
              {(label || children) && !isIconOnly && (
                <MonoText style={[textStyle, labelStyle]}>
                  {label || children}
                </MonoText>
              )}
              {renderIcon(iconRight)}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const AppButtonV2 = memo(AppButtonV2Raw);

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT STYLES
// ═══════════════════════════════════════════════════════════════════════════

interface VariantStyles {
  background: string;
  textColor: string;
  borderWidth: number;
  borderColor: string;
}

function getVariantStyles(
  variant: ButtonVariant,
  mode: ColorMode,
  customColor?: string,
  disabled?: boolean,
): VariantStyles {
  // Handle disabled state
  if (disabled) {
    return {
      background: getColor('surfaceSubdued', mode),
      textColor: getColor('disabled', mode),
      borderWidth: 0,
      borderColor: 'transparent',
    };
  }

  switch (variant) {
    case 'primary':
      return {
        background: customColor || getColor('primary', mode),
        textColor: getColor('inkInverse', mode),
        borderWidth: 0,
        borderColor: 'transparent',
      };

    case 'secondary':
      return {
        background: getColor('surface', mode),
        textColor: getColor('ink', mode),
        borderWidth: 1,
        borderColor: getColor('borderStrong', mode),
      };

    case 'tertiary':
      return {
        background: getColor('surfaceSubdued', mode),
        textColor: getColor('ink', mode),
        borderWidth: 0,
        borderColor: 'transparent',
      };

    case 'destructive':
      return {
        background: getColor('error', mode),
        textColor: getColor('inkInverse', mode),
        borderWidth: 0,
        borderColor: 'transparent',
      };

    case 'success':
      return {
        background: getColor('success', mode),
        textColor: getColor('inkInverse', mode),
        borderWidth: 0,
        borderColor: 'transparent',
      };

    case 'soft':
      return {
        background: getColor('primarySoft', mode),
        textColor: getColor('primary', mode),
        borderWidth: 0,
        borderColor: 'transparent',
      };

    case 'ghost':
      return {
        background: 'transparent',
        textColor: getColor('ink', mode),
        borderWidth: 0,
        borderColor: 'transparent',
      };

    case 'icon':
    case 'iconCircle':
      return {
        background: getColor('surfaceSubdued', mode),
        textColor: getColor('ink', mode),
        borderWidth: 0,
        borderColor: 'transparent',
      };

    default:
      return {
        background: getColor('primary', mode),
        textColor: getColor('inkInverse', mode),
        borderWidth: 0,
        borderColor: 'transparent',
      };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
  },
});
