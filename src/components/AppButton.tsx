import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getRoleTheme, type RoleThemeKey } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';
import { Haptics } from '@/src/utils/haptics';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'glass'
  | 'glassPrimary'
  | 'glass-primary'
  | 'icon'
  | 'iconCircle'
  | 'icon-circle'
  | 'floating'
  | 'bottomCTA'
  | 'link'
  | 'outline'
  | 'soft'
  | 'dark'
  | 'white'
  | 'approve'
  | 'reject'
  | 'urgent'
  | 'menu'
  | 'loading'
  | 'disabled'
  | 'ghost'
  | 'back'
  | 'close'
  | 'share'
  | 'scan'
  | 'add'
  | 'edit'
  | 'pill'
  | 'approval';

export type ButtonSize = 'mini' | 'sm' | 'default' | 'lg' | 'bottomCTA';
export type ButtonHaptic = 'light' | 'medium' | 'success' | 'error' | 'warning' | 'none';
export type ButtonShadow = 'none' | 'subtle' | 'low' | 'medium' | 'high' | 'floating' | boolean;

export interface AppButtonProps extends Omit<PressableProps, 'style' | 'role'> {
  label?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: AppIconName | ReactNode;
  iconRight?: AppIconName | ReactNode;
  loading?: boolean;
  success?: boolean;
  error?: string | boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  glass?: boolean;
  destructiveConfirm?: boolean;
  haptic?: ButtonHaptic;
  hapticFeedback?: ButtonHaptic;
  shadow?: ButtonShadow;
  color?: string;
  onPress?: PressableProps['onPress'];
  // Backward compatibility props:
  iconName?: AppIconName;
  iconPosition?: 'left' | 'right';
  role?: RoleThemeKey;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// Exact iOS Design Tokens
const IOS_TOKENS = {
  colors: {
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    destructive: '#FF3B30',
    background: '#F5F5F7',
    card: '#FFFFFF',
    textPrimary: '#111111',
    textSecondary: '#8E8E93',
    border: 'rgba(0,0,0,0.08)',
    glass: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.45)',
    glassPrimary: 'rgba(0,122,255,0.75)',
    softBlue: 'rgba(0,122,255,0.12)',
    softRed: 'rgba(255,59,48,0.12)',
    softGreen: 'rgba(52,199,89,0.12)',
    softOrange: 'rgba(255,149,0,0.12)',
    dark: '#111111',
    white: '#FFFFFF',
  },
  sizes: {
    mini: { height: 32, radius: 10, paddingX: 10, fontSize: 13, iconSize: 16 },
    sm: { height: 40, radius: 12, paddingX: 14, fontSize: 14, iconSize: 18 },
    default: { height: 52, radius: 16, paddingX: 18, fontSize: 16, iconSize: 20 },
    lg: { height: 58, radius: 18, paddingX: 22, fontSize: 17, iconSize: 22 },
    bottomCTA: { height: 56, radius: 16, paddingX: 24, fontSize: 17, iconSize: 22 },
  },
  motion: {
    pressScale: 0.97,
    pressOpacity: 0.9,
    pressDuration: 110,
    springDamping: 20,
    springStiffness: 260,
  },
  fontWeight: '600' as const,
  shadows: {
    subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    low: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
    medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
    high: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 10 },
    floating: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 8 },
  },
};

export function AppButton({
  label = '',
  children,
  variant = 'primary',
  size = 'default',
  iconLeft,
  iconRight,
  loading = false,
  success = false,
  error = false,
  disabled = false,
  fullWidth = true,
  glass = false,
  destructiveConfirm = false,
  haptic,
  hapticFeedback,
  shadow = false,
  color,
  iconName,
  iconPosition = 'left',
  role: _role = 'default',
  style,
  labelStyle,
  textStyle,
  onPress,
  ...rest
}: AppButtonProps) {
  void getRoleTheme(_role);
  const { isDark } = usePreferences();

  // Destructive confirm state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine effective variant & size
  const isEffectiveDisabled = disabled || loading || variant === 'disabled';
  const effectiveVariant = isEffectiveDisabled && !loading ? 'disabled' : variant;
  const sizeConfig = IOS_TOKENS.sizes[size] || IOS_TOKENS.sizes.default;
  const effectiveHaptic = haptic || hapticFeedback;

  // Reanimated shared values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const popScale = useSharedValue(1);

  // Handle destructive confirm timeout
  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  // Handle error shake animation
  useEffect(() => {
    if (error) {
      translateX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withSpring(0, { damping: 15, stiffness: 300 })
      );
      Haptics.error();
    }
  }, [error, translateX]);

  // Handle success pop animation
  useEffect(() => {
    if (success || effectiveVariant === 'success' || effectiveVariant === 'approval') {
      popScale.value = withSequence(
        withTiming(1.03, { duration: 150 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
      if (success) Haptics.success();
    }
  }, [success, effectiveVariant, popScale]);

  // Trigger Haptic Feedback
  const triggerHaptic = () => {
    if (effectiveHaptic === 'none') return;
    if (effectiveHaptic) {
      if (effectiveHaptic === 'light') Haptics.light();
      else if (effectiveHaptic === 'medium') Haptics.medium();
      else if (effectiveHaptic === 'success') Haptics.success();
      else if (effectiveHaptic === 'error') Haptics.error();
      else if (effectiveHaptic === 'warning') Haptics.warning();
      return;
    }
    // Auto-map haptics by variant
    switch (effectiveVariant) {
      case 'primary':
      case 'glassPrimary':
      case 'glass-primary':
      case 'urgent':
      case 'dark':
      case 'white':
      case 'approve':
      case 'approval':
      case 'floating':
      case 'pill':
        Haptics.medium();
        break;
      case 'destructive':
      case 'reject':
      case 'warning':
        Haptics.warning();
        break;
      case 'success':
        Haptics.success();
        break;
      default:
        Haptics.light();
        break;
    }
  };

  const handlePress = (event: any) => {
    if (isEffectiveDisabled || loading) return;

    // Destructive confirm pattern
    if (destructiveConfirm || effectiveVariant === 'destructive' || effectiveVariant === 'reject') {
      if (!isConfirmingDelete) {
        setIsConfirmingDelete(true);
        Haptics.warning();
        translateX.value = withSequence(
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 50 }),
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withSpring(0)
        );
        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = setTimeout(() => {
          setIsConfirmingDelete(false);
        }, 4000);
        return;
      } else {
        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        setIsConfirmingDelete(false);
      }
    }

    triggerHaptic();
    onPress?.(event);
  };

  const handlePressIn = (event: any) => {
    if (isEffectiveDisabled || loading) return;
    scale.value = withTiming(IOS_TOKENS.motion.pressScale, { duration: IOS_TOKENS.motion.pressDuration });
    opacity.value = withTiming(IOS_TOKENS.motion.pressOpacity, { duration: IOS_TOKENS.motion.pressDuration });
    rest.onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (isEffectiveDisabled || loading) return;
    scale.value = withSpring(1, {
      damping: IOS_TOKENS.motion.springDamping,
      stiffness: IOS_TOKENS.motion.springStiffness,
    });
    opacity.value = withTiming(1, { duration: 180 });
    rest.onPressOut?.(event);
  };

  // Resolve default icons for specialized action variants if iconName/iconLeft omitted
  let resolvedIcon = iconLeft !== undefined ? iconLeft : iconPosition === 'left' && iconName ? iconName : undefined;
  if (!resolvedIcon && !iconRight) {
    if (effectiveVariant === 'back') resolvedIcon = 'ChevronLeft';
    else if (effectiveVariant === 'close') resolvedIcon = 'X';
    else if (effectiveVariant === 'share') resolvedIcon = 'Share2';
    else if (effectiveVariant === 'scan') resolvedIcon = 'Nfc';
    else if (effectiveVariant === 'add' || effectiveVariant === 'floating') resolvedIcon = 'Plus';
    else if (effectiveVariant === 'edit') resolvedIcon = 'PenLine';
    else if (effectiveVariant === 'approval' || effectiveVariant === 'success') resolvedIcon = 'BadgeCheck';
    else if (effectiveVariant === 'reject' || effectiveVariant === 'destructive') resolvedIcon = 'Trash2';
    else if (effectiveVariant === 'menu') resolvedIcon = 'Sliders';
  }
  const resolvedRightIcon = iconRight !== undefined ? iconRight : iconPosition === 'right' && iconName ? iconName : undefined;

  // Resolve shadow style
  let shadowStyle: ViewStyle = {};
  if (shadow || effectiveVariant === 'floating' || effectiveVariant === 'urgent' || effectiveVariant === 'glassPrimary' || effectiveVariant === 'glass-primary') {
    if (shadow === 'subtle') shadowStyle = IOS_TOKENS.shadows.subtle;
    else if (shadow === 'low' || shadow === true) shadowStyle = IOS_TOKENS.shadows.low;
    else if (shadow === 'medium' || effectiveVariant === 'urgent' || effectiveVariant === 'glassPrimary' || effectiveVariant === 'glass-primary') shadowStyle = IOS_TOKENS.shadows.medium;
    else if (shadow === 'high') shadowStyle = IOS_TOKENS.shadows.high;
    else if (shadow === 'floating' || effectiveVariant === 'floating') shadowStyle = IOS_TOKENS.shadows.floating;
  }

  // Resolve background and text colors based on variant & state
  const getVariantStyles = (): { bg: string; text: string; border?: string; borderWidth?: number } => {
    if (success) return { bg: IOS_TOKENS.colors.success, text: IOS_TOKENS.colors.white };
    if (error) return { bg: IOS_TOKENS.colors.destructive, text: IOS_TOKENS.colors.white };
    if (isConfirmingDelete) return { bg: IOS_TOKENS.colors.destructive, text: IOS_TOKENS.colors.white };

    switch (effectiveVariant) {
      case 'primary':
      case 'bottomCTA':
      case 'pill':
      case 'icon':
        return { bg: color || IOS_TOKENS.colors.primary, text: IOS_TOKENS.colors.white };
      case 'secondary':
        return { bg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', text: isDark ? IOS_TOKENS.colors.white : IOS_TOKENS.colors.textPrimary };
      case 'tertiary':
      case 'ghost':
      case 'link':
      case 'back':
      case 'share':
      case 'scan':
      case 'add':
      case 'edit':
        return {
          bg: 'transparent',
          text: effectiveVariant === 'link' || effectiveVariant === 'back' ? (color || IOS_TOKENS.colors.primary) : (isDark ? IOS_TOKENS.colors.white : IOS_TOKENS.colors.textPrimary),
        };
      case 'destructive':
      case 'reject':
        return { bg: IOS_TOKENS.colors.destructive, text: IOS_TOKENS.colors.white };
      case 'success':
      case 'approve':
      case 'approval':
        return { bg: IOS_TOKENS.colors.success, text: IOS_TOKENS.colors.white };
      case 'warning':
      case 'urgent':
        return { bg: IOS_TOKENS.colors.warning, text: IOS_TOKENS.colors.white };
      case 'glass':
        return {
          bg: isDark ? 'rgba(28,28,30,0.85)' : IOS_TOKENS.colors.glass,
          text: isDark ? IOS_TOKENS.colors.white : IOS_TOKENS.colors.textPrimary,
          border: isDark ? 'rgba(255,255,255,0.18)' : IOS_TOKENS.colors.glassBorder,
          borderWidth: 1,
        };
      case 'glassPrimary':
      case 'glass-primary':
        return {
          bg: IOS_TOKENS.colors.glassPrimary,
          text: IOS_TOKENS.colors.white,
          border: 'rgba(255,255,255,0.3)',
          borderWidth: 1,
        };
      case 'iconCircle':
      case 'icon-circle':
      case 'close':
        return { bg: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', text: isDark ? IOS_TOKENS.colors.white : IOS_TOKENS.colors.textPrimary };
      case 'floating':
        return { bg: color || IOS_TOKENS.colors.primary, text: IOS_TOKENS.colors.white };
      case 'outline':
        return { bg: 'transparent', text: color || (isDark ? IOS_TOKENS.colors.white : IOS_TOKENS.colors.textPrimary), border: color || IOS_TOKENS.colors.border, borderWidth: 1.5 };
      case 'soft':
        return { bg: isDark ? 'rgba(0,122,255,0.2)' : IOS_TOKENS.colors.softBlue, text: IOS_TOKENS.colors.primary };
      case 'dark':
        return {
          bg: IOS_TOKENS.colors.dark,
          text: IOS_TOKENS.colors.white,
          border: 'rgba(255,255,255,0.18)',
          borderWidth: 1,
        };
      case 'white':
        return {
          bg: IOS_TOKENS.colors.white,
          text: IOS_TOKENS.colors.textPrimary,
          border: 'rgba(0,0,0,0.12)',
          borderWidth: 1,
        };
      case 'menu':
        return { bg: 'transparent', text: isDark ? IOS_TOKENS.colors.white : IOS_TOKENS.colors.textPrimary };
      case 'disabled':
      default:
        return { bg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', text: isDark ? 'rgba(255,255,255,0.35)' : IOS_TOKENS.colors.textSecondary };
    }
  };

  const variantStyle = getVariantStyles();
  const isGlass = glass || effectiveVariant === 'glass' || effectiveVariant === 'glassPrimary' || effectiveVariant === 'glass-primary';
  const isIconOnly = effectiveVariant === 'icon' || effectiveVariant === 'iconCircle' || effectiveVariant === 'icon-circle' || effectiveVariant === 'close';
  const isCircular = effectiveVariant === 'iconCircle' || effectiveVariant === 'icon-circle' || effectiveVariant === 'floating' || effectiveVariant === 'close' || effectiveVariant === 'pill';

  const renderIcon = (icon: AppIconName | ReactNode) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <AppIcon name={icon as AppIconName} size={sizeConfig.iconSize} color={variantStyle.text} />;
    }
    return icon;
  };

  // Resolve display text
  let displayLabel = label;
  if (isConfirmingDelete) {
    displayLabel = label ? `Confirm ${label}` : 'Confirm Delete';
  } else if (loading && !isIconOnly) {
    displayLabel = 'Processing...';
  } else if (error && typeof error === 'string') {
    displayLabel = error;
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * popScale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        fullWidth && !isIconOnly && effectiveVariant !== 'floating' && styles.fullWidth,
        effectiveVariant === 'floating' && styles.floatingShadow,
        animatedStyle,
        style,
      ]}
    >
      <Pressable
        disabled={isEffectiveDisabled || loading}
        accessibilityRole="button"
        accessibilityLabel={rest.accessibilityLabel || displayLabel || 'Action'}
        hitSlop={rest.hitSlop || { top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={null}
        style={[
          styles.button,
          {
            minHeight: isIconOnly ? sizeConfig.height : sizeConfig.height,
            height: isIconOnly ? sizeConfig.height : undefined,
            width: isIconOnly || effectiveVariant === 'floating' ? (effectiveVariant === 'floating' ? 56 : sizeConfig.height) : undefined,
            borderRadius: isCircular ? 9999 : sizeConfig.radius,
            backgroundColor: isGlass ? 'transparent' : variantStyle.bg,
            paddingHorizontal: isIconOnly || effectiveVariant === 'floating' ? 0 : sizeConfig.paddingX,
            borderColor: variantStyle.border || 'transparent',
            borderWidth: variantStyle.borderWidth || 0,
            justifyContent: effectiveVariant === 'menu' || effectiveVariant === 'back' ? 'flex-start' : 'center',
          },
          shadowStyle,
          isEffectiveDisabled && styles.disabledOpacity,
        ]}
        {...rest}
      >
        {/* Glass backdrop blur */}
        {isGlass ? (
          <View style={[StyleSheet.absoluteFill, { borderRadius: isCircular ? 9999 : sizeConfig.radius, overflow: 'hidden' }]}>
            <BlurView intensity={35} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: variantStyle.bg, borderRadius: isCircular ? 9999 : sizeConfig.radius },
              ]}
            />
          </View>
        ) : null}

        {/* Content container */}
        <View style={[styles.content, (effectiveVariant === 'menu' || effectiveVariant === 'back') && styles.contentMenu]}>
          {loading ? (
            <ActivityIndicator color={variantStyle.text} size="small" />
          ) : success ? (
            <AppIcon name="Check" size={sizeConfig.iconSize} color={variantStyle.text} />
          ) : (
            renderIcon(resolvedIcon)
          )}

          {displayLabel ? (
            <AppText
              variant="body"
              weight="extrabold"
              style={[
                styles.text,
                {
                  color: variantStyle.text,
                  fontSize: sizeConfig.fontSize,
                  letterSpacing: 0.3,
                  textDecorationLine: effectiveVariant === 'link' ? 'underline' : 'none',
                },
                labelStyle || textStyle,
              ]}
            >
              {displayLabel}
            </AppText>
          ) : null}

          {children}

          {!loading && !success ? renderIcon(resolvedRightIcon) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignSelf: 'flex-start',
  } as ViewStyle,
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  } as ViewStyle,
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as ViewStyle,
  contentMenu: {
    justifyContent: 'flex-start',
    width: '100%',
  } as ViewStyle,
  text: {
    textAlign: 'center',
  } as TextStyle,
  disabledOpacity: {
    opacity: 0.48,
  } as ViewStyle,
  floatingShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,
});

