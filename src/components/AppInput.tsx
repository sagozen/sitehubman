/**
 * AppInput — sharp monochrome input.
 * Hairline border, generous height, no decorative floating labels.
 * Single accent focus state, monochrome placeholder.
 */
import { forwardRef, memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MonoText } from '@/src/components/MonoText';
import { monoRadius, monoSpace } from '@/src/design-system/monochrome';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  {
    label,
    error,
    helperText,
    containerStyle,
    onBlur,
    onFocus,
    value = '',
    placeholder,
    ...props
  },
  ref,
) {
  const { colors, isDark } = usePreferences();
  const inputRef = useRef<TextInput | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    inputRef.current = ref && typeof ref === 'object' ? (ref as any).current ?? null : null;
  }, [ref]);

  const handleFocus = useCallback(
    (e: any) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: any) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const borderColor = error
    ? '#000000'
    : focused
      ? '#000000'
      : isDark
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(10,10,11,0.12)';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <MonoText variant="subhead" weight="medium" tone="muted" style={styles.label}>
          {label}
        </MonoText>
      ) : null}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        android_ripple={null}
        style={[
          styles.field,
          {
            backgroundColor: isDark ? '#0F0F12' : '#F4F4F5',
            borderColor,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as any).current = node;
          }}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(60,60,67,0.5)'}
          selectionColor={colors.primary ?? '#000000'}
          cursorColor="#000000"
          onBlur={handleBlur}
          onFocus={handleFocus}
          allowFontScaling
          maxFontSizeMultiplier={1.3}
          style={[
            styles.input,
            { color: isDark ? '#FFFFFF' : '#27272A' },
          ]}
          {...props}
        />
      </Pressable>

      {error ? (
        <MonoText variant="footnote" tone="muted" style={styles.error}>
          {error}
        </MonoText>
      ) : helperText ? (
        <MonoText variant="footnote" tone="muted" style={styles.error}>
          {helperText}
        </MonoText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: monoSpace[3],
  },
  label: {
    marginBottom: monoSpace[2],
    letterSpacing: 0.2,
  },
  field: {
    minHeight: 52,
    paddingHorizontal: monoSpace[4],
    borderRadius: monoRadius.lg,
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      default: { elevation: 1 },
    }),
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
    paddingVertical: Platform.select({ ios: 14, default: 8 }),
  },
  error: {
    marginTop: monoSpace[2],
    paddingLeft: 2,
  },
});