import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, Platform } from 'react-native';
import { AppIcon } from './AppIcon';
import { theme } from '../constants/theme';
import { usePreferences } from '../hooks/usePreferences';

export interface SearchBarProps extends TextInputProps {
  onClear?: () => void;
}

export function SearchBar({ style, value, onClear, ...rest }: SearchBarProps) {
  const { isDark } = usePreferences();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.colors.surfaceSoft : theme.colors.surfaceSoft }, style]}>
      <AppIcon name="Search" size={20} color={theme.colors.textMuted} />
      <TextInput
        style={[styles.input, { color: theme.colors.textPrimary }]}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        {...rest}
      />
      {value ? (
        <AppIcon name="X" size={16} color={theme.colors.textMuted} onPress={onClear} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.controlHeight.search,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.variants.body.fontSize,
    fontFamily: theme.typography.fontFamily,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
});
