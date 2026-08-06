/**
 * AppButton — monochrome, performance-tuned button primitive.
 * Variants: primary (solid black/white), secondary (light fill), ghost (text only),
 *           icon (square hit-target), soft (subtle fill), outline (hairline border).
 * Press scale: 0.985, spring damped for crisp Apple-feel.
 */
import React, { memo, useCallback, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { monoMotion, monoSpace } from '@/src/design-system/monochrome';
import { Haptics, HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'outline'
  | 'soft'
  | 'dark'
  | 'white'
  | 'destructive'
  | 'link'
  | 'icon'
  | 'iconCircle'
  | 'icon-circle'
  | 'menu'
  | 'close'
  | 'back'
  | 'floating'
  | 'success'
  | 'warning'
  | 'disabled'
  | 'loading'
  | 'glass'
  | 'glass-primary'
  | 'share'
  | 'scan'
  | 'add'
  | 'edit'
  | 'pill'
  | 'approval'
  | 'reject'
  | 'urgent';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'bottomCTA' | 'mini' | 'default';
export type ButtonHaptic = 'light' | 'medium' | 'success' | 'error' | 'warning' | 'none';

export interface AppButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: AppIconName | ReactNode;
  iconRight?: AppIconName | ReactNode;
  /** Alias for iconLeft */
  iconName?: AppIconName | ReactNode;
  iconPosition?: string;
  destructiveConfirm?: boolean;
  shadow?: string;
  glass?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: ButtonHaptic;
  color?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  hitSlop?: number | { top: number; bottom: number; left: number; right: number };
}

const sizeConfig: Record<string, { height: number; radius: number; paddingX: number; fontSize: number; iconSize: number }> = {
  mini: { height: 32, radius: 8, paddingX: 10, fontSize: 13, iconSize: 14 },
  sm: { height: 36, radius: 10, paddingX: 14, fontSize: 14, iconSize: 16 },
  md: { height: 44, radius: 12, paddingX: 18, fontSize: 15, iconSize: 18 },
  default: { height: 44, radius: 12, paddingX: 18, fontSize: 15, iconSize: 18 },
  lg: { height: 52, radius: 14, paddingX: 22, fontSize: 16, iconSize: 20 },
  xl: { height: 60, radius: 16, paddingX: 26, fontSize: 17, iconSize: 22 },
  bottomCTA: { height: 56, radius: 16, paddingX: 24, fontSize: 16, iconSize: 20 },
};

const iconOnlyVariants: ButtonVariant[] = ['icon', 'iconCircle', 'close', 'back'];

function AppButtonRaw({
  label,
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  iconName,
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic,
  color,
  onPress,
  style,
  labelStyle,
  hitSlop = 8,
  ...rest
}: AppButtonProps) {
  const { isDark } = usePreferences();
  const cfg = sizeConfig[size];
  const isIconOnly = iconOnlyVariants.includes(variant);
  const isCircular = variant === 'iconCircle' || variant === 'floating';

  // Reanimated shared values — press feedback
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(monoMotion.pressScale, { duration: monoMotion.quick });
    opacity.value = withTiming(monoMotion.pressOpacity, { duration: monoMotion.quick });
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, monoMotion.spring);
    opacity.value = withTiming(1, { duration: monoMotion.slow });
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    // Haptic
    if (haptic && haptic !== 'none') {
      if (haptic === 'light') Haptics.light();
      else if (haptic === 'medium') Haptics.medium();
      else if (haptic === 'success') Haptics.success();
      else if (haptic === 'error') Haptics.error();
      else if (haptic === 'warning') Haptics.warning();
    } else {
      HapticTap.selection();
    }
    onPress?.();
  }, [disabled, loading, haptic, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Resolve variant colors
  const tokens = getVariantTokens(variant, isDark, color);
  const isMenu = variant === 'menu' || variant === 'back';

  // Default icons for action variants
  const resolvedLeft = resolveIcon(iconLeft || iconName, variant, 'left');
  const resolvedRight = resolveIcon(iconRight, variant, 'right');

  const buttonStyle: ViewStyle = {
    minHeight: cfg.height,
    height: isIconOnly ? cfg.height : undefined,
    width: isIconOnly || variant === 'floating' ? cfg.height : undefined,
    paddingHorizontal: isIconOnly || variant === 'floating' ? 0 : cfg.paddingX,
    borderRadius: isCircular ? 9999 : cfg.radius,
    backgroundColor: tokens.bg,
    borderWidth: tokens.borderWidth,
    borderColor: tokens.borderColor,
    justifyContent: isMenu ? 'flex-start' : 'center',
    opacity: disabled ? 0.4 : 1,
  };

  return (
    <Animated.View
      style={[
        fullWidth && !isIconOnly && variant !== 'floating' && { alignSelf: 'stretch' },
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
        accessibilityLabel={label || rest.accessibilityLabel || 'Action'}
        accessibilityState={{ disabled: !!disabled, busy: !!loading }}
        style={buttonStyle}
        {...rest}
      >
        <View style={[styles.content, isMenu && styles.contentMenu]}>
          {loading ? (
            <ActivityIndicator color={tokens.text} size="small" />
          ) : (
            resolvedLeft
          )}

          {(label || children) && !isIconOnly ? (
            <MonoText
              weight={variant === 'link' ? 'medium' : 'semibold'}
              align="center"
              color={tokens.text}
              style={[
                {
                  fontSize: cfg.fontSize,
                  letterSpacing: variant === 'primary' || variant === 'dark' ? -0.2 : -0.1,
                },
                labelStyle,
              ]}
            >
              {label}
              {children}
            </MonoText>
          ) : null}

          {!loading && resolvedRight}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const AppButton = memo(AppButtonRaw);

// ─── Helpers ───────────────────────────────────────────────────────────────
function getVariantTokens(variant: ButtonVariant, isDark: boolean, color?: string) {
  const ink = isDark ? '#FFFFFF' : '#000000';
  const inkInverse = isDark ? '#000000' : '#FFFFFF';
  const surface = isDark ? '#131316' : '#FFFFFF';
  const sunken = isDark ? '#1C1C1F' : '#F4F4F5';
  const hairline = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(10,10,11,0.10)';

  switch (variant) {
    case 'primary':
    case 'dark':
      return { bg: color ?? ink, text: inkInverse, borderWidth: 0, borderColor: 'transparent' };
    case 'secondary':
      return { bg: surface, text: ink, borderWidth: 1, borderColor: hairline };
    case 'outline':
      return { bg: 'transparent', text: color ?? ink, borderWidth: 1, borderColor: color ?? ink };
    case 'tertiary':
      return { bg: 'transparent', text: ink, borderWidth: 0, borderColor: 'transparent' };
    case 'ghost':
      return { bg: 'transparent', text: ink, borderWidth: 0, borderColor: 'transparent' };
    case 'soft':
      return { bg: sunken, text: ink, borderWidth: 0, borderColor: 'transparent' };
    case 'white':
      return { bg: '#FFFFFF', text: '#000000', borderWidth: 0, borderColor: 'transparent' };
    case 'destructive':
      return { bg: '#000000', text: '#FFFFFF', borderWidth: 0, borderColor: 'transparent' };
    case 'link':
      return { bg: 'transparent', text: ink, borderWidth: 0, borderColor: 'transparent' };
    case 'icon':
      return { bg: sunken, text: ink, borderWidth: 0, borderColor: 'transparent' };
    case 'iconCircle':
      return { bg: sunken, text: ink, borderWidth: 0, borderColor: 'transparent' };
    case 'menu':
    case 'back':
    case 'close':
      return { bg: 'transparent', text: ink, borderWidth: 0, borderColor: 'transparent' };
    case 'floating':
      return { bg: ink, text: inkInverse, borderWidth: 0, borderColor: 'transparent' };
    default:
      return { bg: ink, text: inkInverse, borderWidth: 0, borderColor: 'transparent' };
  }
}

function resolveIcon(icon: AppIconName | ReactNode | undefined, variant: ButtonVariant, position: 'left' | 'right'): ReactNode {
  if (icon !== undefined) {
    if (typeof icon === 'string') {
      return <AppIcon name={icon as AppIconName} size={undefined as any} />;
    }
    return icon;
  }
  // Default icons for action variants (only on left)
  if (position !== 'left') return null;
  switch (variant) {
    case 'back':
      return <AppIcon name="ChevronLeft" />;
    case 'close':
      return <AppIcon name="X" />;
    case 'menu':
      return <AppIcon name="SlidersHorizontal" />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: monoSpace[2],
  },
  contentMenu: {
    justifyContent: 'flex-start',
    width: '100%',
    paddingLeft: monoSpace[4],
  },
});
