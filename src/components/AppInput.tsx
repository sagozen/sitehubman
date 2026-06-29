import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppInputProps extends Omit<TextInputProps, 'style' | 'role'> {
  label: string;
  error?: string;
  helperText?: string;
  suggestions?: string[];
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<TextStyle>;
}

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 150,
  mass: 0.8,
};

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  {
    label,
    error,
    helperText,
    suggestions,
    style,
    containerStyle,
    onBlur,
    onFocus,
    onChangeText,
    value = '',
    placeholder,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const { colors } = usePreferences();
  const inputRef = useRef<TextInput>(null);

  // Expose ref to parent
  useImperativeHandle(ref, () => inputRef.current as TextInput);

  // Shared value for label animation (0 = inside, 1 = floating)
  const isFloating = useSharedValue(value.length > 0 || focused ? 1 : 0);

  useEffect(() => {
    isFloating.value = withSpring(value.length > 0 || focused ? 1 : 0, SPRING_CONFIG);
  }, [value, focused]);

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(isFloating.value, [0, 1], [14, -8]),
        },
        {
          translateX: interpolate(isFloating.value, [0, 1], [0, -4]),
        },
        {
          scale: interpolate(isFloating.value, [0, 1], [1, 0.82]),
        },
      ],
    };
  });

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlur?.(e);
  };

  const handleSuggestionPress = (text: string) => {
    onChangeText?.(text);
    inputRef.current?.focus();
  };

  // UI colors based on focus and error states
  const borderHighlightColor = error
    ? colors.danger
    : focused
    ? colors.primary
    : colors.border;

  const backgroundFill = colors.surfaceSoft;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Input container with floating label */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.fieldWrapper,
          {
            backgroundColor: backgroundFill,
            borderColor: borderHighlightColor,
          },
          focused && styles.focusedBorder,
        ]}
      >
        {/* Animated Floating Label */}
        <Animated.View
          pointerEvents="none"
          style={[styles.labelContainer, animatedLabelStyle]}
        >
          <AppText
            style={{
              color: error ? colors.danger : focused ? colors.primary : colors.textMuted,
              fontWeight: '500',
            }}
          >
            {label}
          </AppText>
        </Animated.View>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={focused ? placeholder : ''}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          onBlur={handleBlur}
          onFocus={handleFocus}
          style={[
            styles.input,
            {
              color: colors.typographyColor,
            },
            style,
          ]}
          {...props}
        />
      </Pressable>

      {/* Smart validation / Helper text */}
      {error ? (
        <AppText variant="caption" style={{ color: colors.danger, marginTop: 4, paddingLeft: 4 }}>
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="caption" tone="muted" style={{ marginTop: 4, paddingLeft: 4 }}>
          {helperText}
        </AppText>
      ) : null}

      {/* Suggestions Row */}
      {suggestions && suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScroll}
        >
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => handleSuggestionPress(suggestion)}
              style={({ pressed }) => [
                styles.suggestionChip,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <AppText variant="caption" weight="medium">
                {suggestion}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  fieldWrapper: {
    borderWidth: 1.5,
    borderRadius: 16, // Extra rounded Apple/Stripe style
    minHeight: 56,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    position: 'relative',
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 1 },
      opacity: 0.05,
      radius: 2,
      elevation: 1,
    }),
  },
  focusedBorder: {
    borderWidth: 2,
  },
  labelContainer: {
    position: 'absolute',
    left: 16,
    top: 0,
  },
  input: {
    minHeight: 38,
    paddingTop: 14,
    paddingBottom: 6,
    ...theme.typography.variants.body,
  },
  suggestionsScroll: {
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
});
