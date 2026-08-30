/**
 * SearchBarV2 — Premium SaaS Quality Search Input
 * Replaces ad-hoc text inputs used for searching with a standard, 
 * animated, and accessible search component.
 */

import React, { memo, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, type StyleProp, type ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

import { AppIcon } from '@/src/components/AppIcon';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, getDuration, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';

export interface SearchBarV2Props {
  /** Current search query */
  value: string;
  /** Called when query changes */
  onChangeText: (text: string) => void;
  /** Called when the clear button is pressed */
  onClear?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Auto focus on mount */
  autoFocus?: boolean;
}

function SearchBarV2Raw({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search...',
  style,
  autoFocus = false,
}: SearchBarV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(autoFocus);

  // Animation values
  const focusProgress = useSharedValue(autoFocus ? 1 : 0);

  const handleFocus = () => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: getDuration('fast') });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: getDuration('fast') });
  };

  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  // Animated border color
  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [getColor('border', mode), getColor('primary', mode)]
    );
    return {
      borderColor,
    };
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: getColor('surface', mode) }, animatedContainerStyle, style]}>
      <AppIcon 
        name="Search" 
        size={20} 
        color={isFocused ? getColor('primary', mode) : getColor('inkTertiary', mode)} 
        style={styles.searchIcon}
      />
      
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={getColor('inkTertiary', mode)}
        autoFocus={autoFocus}
        style={[
          styles.input,
          getTypography('body', 'regular'),
          { color: getColor('ink', mode) },
          Platform.OS === 'web' && { outlineStyle: 'none' } as any,
        ]}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {value.length > 0 && (
        <Pressable 
          onPress={handleClear} 
          style={styles.clearButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <AppIcon name="XCircle" size={18} color={getColor('inkTertiary', mode)} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: tokens.controlHeight.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing[3],
  },
  searchIcon: {
    marginRight: tokens.spacing[2],
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0, // Override default Android padding
  },
  clearButton: {
    marginLeft: tokens.spacing[2],
  },
});

export const SearchBarV2 = memo(SearchBarV2Raw);
