/**
 * AppButton — Apple HIG-compliant button primitive.
 *
 * Apple HIG rules applied:
 * - Minimum touch target: 44x44pt (all interactive sizes)
 * - Press: spring scale 0.97 + opacity 0.88 (200ms)
 * - Radii: sm=10, md=14, lg=16, full=pill
 * - Primary: filled system blue (#0A84FF dark / #007AFF light)
 * - Destructive: system red
 * - Disabled: opacity 0.40
 * - Haptic: .selection on every tap
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
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { Haptics, HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

export type ButtonVariant =
  | 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline'
  | 'soft' | 'dark' | 'white' | 'destructive' | 'link'
  | 'icon' | 'iconCircle' | 'icon-circle' | 'menu' | 'close' | 'back'
  | 'floating' | 'success' | 'warning' | 'disabled' | 'loading'
  | 'glass' | 'glass-primary' | 'share' | 'scan' | 'add' | 'edit'
  | 'pill' | 'approval' | 'reject' | 'urgent';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'bottomCTA' | 'mini' | 'default';
export type ButtonHaptic = 'light' | 'medium' | 'success' | 'error' | 'warning' | 'none';

export interface AppButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: AppIconName | ReactNode;
  iconRight?: AppIconName | ReactNode;
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

// Apple HIG button size tokens
const sizeConfig: Record<string, { height: number; radius: number; paddingX: number; fontSize: number; iconSize: number }> = {
  mini:     { height: 32, radius: 10,  paddingX: 12, fontSize: 13, iconSize: 14 },
  sm:       { height: 36, radius: 10,  paddingX: 14, fontSize: 15, iconSize: 16 },
  md:       { height: 44, radius: 14,  paddingX: 20, fontSize: 17, iconSize: 20 }, // Apple HIG: 44pt minimum
  default:  { height: 44, radius: 14,  paddingX: 20, fontSize: 17, iconSize: 20 },
  lg:       { height: 52, radius: 14,  paddingX: 22, fontSize: 17, iconSize: 20 },
  xl:       { height: 56, radius: 16,  paddingX: 24, fontSize: 17, iconSize: 22 },
  bottomCTA:{ height: 56, radius: 14,  paddingX: 24, fontSize: 17, iconSize: 20 },
};

const iconOnlyVariants: ButtonVariant[] = ['icon', 'iconCircle', 'icon-circle', 'close', 'back'];

// Apple HIG spring: snappy release, quick press-in
const SPRING_IN  = { damping: 15, stiffness: 400, mass: 0.8 };
const SPRING_OUT = { damping: 20, stiffness: 150, mass: 1   };

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
  const cfg = sizeConfig[size] ?? sizeConfig.md;
  const isIconOnly = iconOnlyVariants.includes(variant);
  const isCircular = variant === 'iconCircle' || variant === 'icon-circle' || variant === 'floating';
  const isMenu     = variant === 'menu' || variant === 'back';

  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value   = withTiming(0.97, { duration: 100 });           // Apple HIG: 0.97 press scale
    opacity.value = withTiming(0.88, { duration: 100 });           // Apple HIG: 0.88 press opacity
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value   = withSpring(1, SPRING_OUT);                     // Apple spring release
    opacity.value = withTiming(1, { duration: 180 });
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (haptic && haptic !== 'none') {
      if (haptic === 'light')   Haptics.light();
      else if (haptic === 'medium')  Haptics.medium();
      else if (haptic === 'success') Haptics.success();
      else if (haptic === 'error')   Haptics.error();
      else if (haptic === 'warning') Haptics.warning();
    } else {
      HapticTap.selection();
    }
    onPress?.();
  }, [disabled, loading, haptic, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  const tokens = getVariantTokens(variant, isDark, color);
  const resolvedLeft  = resolveIcon(iconLeft || iconName, variant, 'left');
  const resolvedRight = resolveIcon(iconRight, variant, 'right');

  const buttonStyle: ViewStyle = {
    minHeight:       cfg.height,
    height:          isIconOnly ? cfg.height : undefined,
    width:           isIconOnly || variant === 'floating' ? cfg.height : undefined,
    paddingHorizontal: isIconOnly || variant === 'floating' ? 0 : cfg.paddingX,
    borderRadius:    isCircular ? 9999 : cfg.radius,
    backgroundColor: tokens.bg,
    borderWidth:     tokens.borderWidth,
    borderColor:     tokens.borderColor,
    justifyContent:  isMenu ? 'flex-start' : 'center',
    opacity:         disabled ? 0.40 : 1,       // Apple HIG: 0.40 disabled
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
        hitSlop={hitSlop ?? 8}
        unstable_pressDelay={0}
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
                  fontSize:      cfg.fontSize,
                  letterSpacing: -0.41,  // Apple HIG body letter spacing
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getVariantTokens(variant: ButtonVariant, isDark: boolean, color?: string) {
  // Apple HIG system colors
  const tint       = isDark ? '#0A84FF' : '#007AFF';
  const destructive= isDark ? '#FF453A' : '#FF3B30';
  const success    = isDark ? '#30D158' : '#34C759';
  const label      = isDark ? '#FFFFFF' : '#000000';
  const labelInv   = isDark ? '#000000' : '#FFFFFF';
  const fill       = isDark ? 'rgba(120,120,128,0.36)' : 'rgba(120,120,128,0.20)';
  const separator  = isDark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.29)';

  switch (variant) {
    case 'primary':
      return { bg: tint,       text: '#FFFFFF',  borderWidth: 0, borderColor: 'transparent' };
    case 'dark':
      return { bg: color ?? label, text: labelInv, borderWidth: 0, borderColor: 'transparent' };
    case 'white':
      return { bg: '#FFFFFF',  text: '#000000',  borderWidth: 0, borderColor: 'transparent' };
    case 'destructive':
      return { bg: destructive, text: '#FFFFFF', borderWidth: 0, borderColor: 'transparent' };
    case 'success':
      return { bg: success,    text: '#FFFFFF',  borderWidth: 0, borderColor: 'transparent' };
    case 'secondary':
      return { bg: fill,       text: label,      borderWidth: 0, borderColor: 'transparent' };
    case 'outline':
      return { bg: 'transparent', text: color ?? tint, borderWidth: 1, borderColor: color ?? tint };
    case 'tertiary':
    case 'ghost':
    case 'link':
      return { bg: 'transparent', text: variant === 'link' ? tint : label, borderWidth: 0, borderColor: 'transparent' };
    case 'soft':
      return { bg: fill,       text: label,      borderWidth: 0, borderColor: 'transparent' };
    case 'icon':
    case 'iconCircle':
    case 'icon-circle':
      return { bg: fill,       text: label,      borderWidth: 0, borderColor: 'transparent' };
    case 'menu':
    case 'back':
    case 'close':
      return { bg: 'transparent', text: tint,    borderWidth: 0, borderColor: 'transparent' };
    case 'floating':
      return { bg: tint,       text: '#FFFFFF',  borderWidth: 0, borderColor: 'transparent' };
    default:
      return { bg: color ?? tint, text: '#FFFFFF', borderWidth: 0, borderColor: 'transparent' };
  }
}

function resolveIcon(icon: AppIconName | ReactNode | undefined, variant: ButtonVariant, position: 'left' | 'right'): ReactNode {
  if (icon !== undefined) {
    if (typeof icon === 'string') return <AppIcon name={icon as AppIconName} size={undefined as any} />;
    return icon;
  }
  if (position !== 'left') return null;
  switch (variant) {
    case 'back':  return <AppIcon name="ChevronLeft" />;
    case 'close': return <AppIcon name="X" />;
    case 'menu':  return <AppIcon name="SlidersHorizontal" />;
    default:      return null;
  }
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contentMenu: {
    justifyContent: 'flex-start',
    width: '100%',
    paddingLeft: 16,
  },
});
