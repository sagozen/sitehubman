import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedSegmentedControl } from '@/src/components/AnimatedSegmentedControl';
import type { UiPreferences } from '@/src/types/models';

const OPTIONS: { label: string; value: UiPreferences['colorMode'] }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

interface AppearanceSegmentProps {
  value: UiPreferences['colorMode'];
  disabled?: boolean;
  onChange: (value: UiPreferences['colorMode']) => void;
}

export function AppearanceSegment({ value, disabled, onChange }: AppearanceSegmentProps) {
  return (
    <View style={styles.wrap} pointerEvents={disabled ? 'none' : 'auto'}>
      <AnimatedSegmentedControl
        options={OPTIONS}
        value={value}
        onChange={onChange}
        height={40}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
});
