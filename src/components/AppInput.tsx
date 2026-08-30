/**
 * AppInput — Apple HIG-compliant text input.
 * - 44pt minimum height (Apple HIG touch target requirement)
 * - Focus ring: system tint (#0A84FF dark / #007AFF light)
 * - Border radius: 10pt (Apple inputs standard)
 * - Haptics on focus via HapticTap.selection
 */
import { forwardRef, memo, useCallback, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
  Text,
} from 'react-native';

import { MonoText } from '@/src/components/MonoText';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<any>;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  {
    label,
    error,
    helperText,
    containerStyle,
    style,
    onBlur,
    onFocus,
    value = '',
    placeholder,
    ...props
  },
  ref,
) {
  const { isDark } = usePreferences();
  const inputRef = useRef<TextInput | null>(null);
  const [focused, setFocused] = useState(false);

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

  // Apple HIG: tint color for focus ring, red for error
  const tint        = isDark ? '#0A84FF' : '#007AFF';
  const errorColor  = isDark ? '#FF453A' : '#FF3B30';
  const borderColor = error
    ? errorColor
    : focused
      ? tint
      : isDark
        ? 'rgba(84,84,88,0.65)'        // Apple separator dark
        : 'rgba(60,60,67,0.29)';       // Apple separator light

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';                // Surface L1
  const textColor   = isDark ? '#FFFFFF'         : '#000000';
  const labelColor  = isDark ? 'rgba(235,235,245,0.60)' : 'rgba(60,60,67,0.60)';
  const placeholder_ = isDark ? 'rgba(235,235,245,0.30)' : 'rgba(60,60,67,0.30)';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      ) : null}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        android_ripple={null}
        style={[
          styles.field,
          {
            backgroundColor: bg,
            borderColor,
            borderWidth: focused ? 2 : 1,
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
          placeholderTextColor={placeholder_}
          selectionColor={tint}
          cursorColor={tint}
          onBlur={handleBlur}
          onFocus={handleFocus}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
          style={[
            styles.input,
            { color: textColor },
            style,
          ]}
          {...props}
        />
      </Pressable>

      {error ? (
        <Text style={[styles.helper, { color: errorColor }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: labelColor }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    // Apple HIG Caption 1
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
    marginBottom: 6,
  },
  field: {
    // Apple HIG: 44pt minimum touch target
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,           // Apple inputs standard
    justifyContent: 'center',
  },
  input: {
    // Apple HIG Body (17pt)
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.41,
    paddingVertical: Platform.select({ ios: 11, default: 8 }),
  },
  helper: {
    // Apple HIG Caption 1
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    marginLeft: 2,
  },
});
