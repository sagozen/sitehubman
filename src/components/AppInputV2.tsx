/**
 * AppInputV2 — Premium Input Field
 * Redesigned with world-class form design standards
 * Uses new design token system for consistency
 * 
 * Features:
 * - Token-based sizing (8pt grid)
 * - Clear validation states (success, error, warning)
 * - Refined focus states with smooth transitions
 * - Proper label and helper text hierarchy
 * - Accessible by default (WCAG AA)
 * - Platform-consistent behavior
 * - Support for icons and actions
 */

import React, { forwardRef, memo, useCallback, useState, type ReactNode } from 'react';
import {
  TextInput,
  type TextInputProps,
  View,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  Animated,
} from 'react-native';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import {
  inputSize,
  getTypography,
  getColor,
  getStatusColor,
  getDuration,
  type ColorMode,
  type ControlSizeToken,
} from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type InputValidation = 'default' | 'success' | 'warning' | 'error';
export type InputSize = ControlSizeToken;

export interface AppInputV2Props extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Validation state */
  validation?: InputValidation;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Success message */
  successText?: string;
  /** Input size */
  size?: InputSize;
  /** Icon on left side */
  iconLeft?: AppIconName | ReactNode;
  /** Icon on right side (or action) */
  iconRight?: AppIconName | ReactNode;
  /** Action button on right */
  rightAction?: ReactNode;
  /** Required field indicator */
  required?: boolean;
  /** Container style */
  containerStyle?: StyleProp<ViewStyle>;
  /** Input wrapper style */
  inputWrapperStyle?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SIZE_CONFIG = {
  sm: { token: 'sm' as const, paddingToken: 3, iconSize: tokens.iconSize.sm },
  md: { token: 'md' as const, paddingToken: 4, iconSize: tokens.iconSize.md },
  lg: { token: 'lg' as const, paddingToken: 5, iconSize: tokens.iconSize.lg },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AppInputV2Raw = forwardRef<TextInput, AppInputV2Props>(
  function AppInputV2(
    {
      label,
      validation = 'default',
      error,
      helperText,
      successText,
      size = 'md',
      iconLeft,
      iconRight,
      rightAction,
      required = false,
      containerStyle,
      inputWrapperStyle,
      onFocus,
      onBlur,
      value = '',
      placeholder,
      editable = true,
      ...props
    },
    ref
  ) {
    // ─── Theme & State ───────────────────────────────────────────────────────
    const { isDark } = usePreferences();
    const mode: ColorMode = isDark ? 'dark' : 'light';
    const [focused, setFocused] = useState(false);
    const [focusAnimation] = useState(new Animated.Value(0));

    const sizeConfig = SIZE_CONFIG[size];
    const hasError = !!error || validation === 'error';
    const hasSuccess = !!successText || validation === 'success';
    const hasWarning = validation === 'warning';

    // ─── Event Handlers ──────────────────────────────────────────────────────
    const handleFocus = useCallback(
      (e: any) => {
        setFocused(true);
        Animated.timing(focusAnimation, {
          toValue: 1,
          duration: getDuration('base'),
          useNativeDriver: false,
        }).start();
        onFocus?.(e);
      },
      [focusAnimation, onFocus]
    );

    const handleBlur = useCallback(
      (e: any) => {
        setFocused(false);
        Animated.timing(focusAnimation, {
          toValue: 0,
          duration: getDuration('base'),
          useNativeDriver: false,
        }).start();
        onBlur?.(e);
      },
      [focusAnimation, onBlur]
    );

    // ─── Styles ──────────────────────────────────────────────────────────────
    const borderColor = hasError
      ? getColor('error', mode)
      : hasSuccess
        ? getColor('success', mode)
        : hasWarning
          ? getColor('warning', mode)
          : focused
            ? getColor('focus', mode)
            : getColor('border', mode);

    const borderWidth = focused || hasError || hasSuccess || hasWarning ? 1.5 : 1;

    const backgroundColor = editable
      ? getColor('surfaceSubdued', mode)
      : getColor('surfaceElevated', mode);

    const wrapperStyle: ViewStyle = {
      ...inputSize(sizeConfig.token, sizeConfig.paddingToken, 'lg'),
      backgroundColor,
      borderWidth,
      borderColor,
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[2],
    };

    const textInputStyle = {
      ...getTypography('body', 'medium'),
      flex: 1,
      color: getColor('ink', mode),
      padding: 0, // Remove default padding
    };

    // ─── Render Icons ────────────────────────────────────────────────────────
    const renderIcon = (icon: AppIconName | ReactNode | undefined, position: 'left' | 'right') => {
      if (!icon) return null;
      if (typeof icon === 'string') {
        return (
          <AppIcon
            name={icon as AppIconName}
            size={sizeConfig.iconSize}
            color={getColor('inkSecondary', mode)}
          />
        );
      }
      return icon;
    };

    // ─── Helper Text ─────────────────────────────────────────────────────────
    const feedbackMessage = error || successText || helperText;
    const feedbackColor = hasError
      ? getStatusColor('error', mode, 'text')
      : hasSuccess
        ? getStatusColor('success', mode, 'text')
        : hasWarning
          ? getStatusColor('warning', mode, 'text')
          : getColor('inkSecondary', mode);

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
      <View style={[styles.container, containerStyle]}>
        {/* Label */}
        {label && (
          <View style={styles.labelContainer}>
            <MonoText
              variant="caption"
              weight="medium"
              style={[
                styles.label,
                { color: getColor('inkSecondary', mode) },
              ]}
            >
              {label}
              {required && (
                <MonoText style={{ color: getColor('error', mode) }}> *</MonoText>
              )}
            </MonoText>
          </View>
        )}

        {/* Input Wrapper */}
        <Pressable
          onPress={() => {
            if (ref && typeof ref !== 'function') {
              ref.current?.focus();
            }
          }}
          android_ripple={null}
          disabled={!editable}
          style={[wrapperStyle, inputWrapperStyle]}
        >
          {renderIcon(iconLeft, 'left')}

          <TextInput
            ref={ref}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={getColor('inkTertiary', mode)}
            selectionColor={getColor('primary', mode)}
            cursorColor={getColor('primary', mode)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={editable}
            allowFontScaling
            maxFontSizeMultiplier={1.3}
            style={textInputStyle}
            {...props}
          />

          {rightAction || renderIcon(iconRight, 'right')}
        </Pressable>

        {/* Feedback Message */}
        {feedbackMessage && (
          <View style={styles.feedbackContainer}>
            <MonoText
              variant="footnote"
              style={[styles.feedback, { color: feedbackColor }]}
            >
              {feedbackMessage}
            </MonoText>
          </View>
        )}
      </View>
    );
  }
);

export const AppInputV2 = memo(AppInputV2Raw);

// ═══════════════════════════════════════════════════════════════════════════
// SPECIALIZED INPUTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search Input - With search icon and clear button
 */
export const SearchInputV2 = forwardRef<TextInput, Omit<AppInputV2Props, 'iconLeft' | 'rightAction'>>(
  function SearchInputV2({ value, onChangeText, ...props }, ref) {
    const { isDark } = usePreferences();
    const mode: ColorMode = isDark ? 'dark' : 'light';

    return (
      <AppInputV2
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        iconLeft="MagnifyingGlass"
        rightAction={
          value ? (
            <Pressable onPress={() => onChangeText?.('')}>
              <AppIcon
                name="X"
                size={tokens.iconSize.sm}
                color={getColor('inkSecondary', mode)}
              />
            </Pressable>
          ) : null
        }
        {...props}
      />
    );
  }
);

/**
 * Password Input - With show/hide toggle
 */
export const PasswordInputV2 = forwardRef<TextInput, Omit<AppInputV2Props, 'secureTextEntry' | 'rightAction'>>(
  function PasswordInputV2(props, ref) {
    const [showPassword, setShowPassword] = useState(false);
    const { isDark } = usePreferences();
    const mode: ColorMode = isDark ? 'dark' : 'light';

    return (
      <AppInputV2
        ref={ref}
        secureTextEntry={!showPassword}
        iconLeft="Lock"
        rightAction={
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <AppIcon
              name={showPassword ? 'EyeOff' : 'Eye'}
              size={tokens.iconSize.md}
              color={getColor('inkSecondary', mode)}
            />
          </Pressable>
        }
        {...props}
      />
    );
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing[3],
  },
  labelContainer: {
    marginBottom: tokens.spacing[2],
  },
  label: {
    letterSpacing: 0.2,
  },
  feedbackContainer: {
    marginTop: tokens.spacing[2],
    paddingLeft: tokens.spacing[1],
  },
  feedback: {
    letterSpacing: 0,
  },
});
