import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';
import { usePreferences } from '../hooks/usePreferences';

export type StatusType = 'success' | 'active' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';

export interface StatusChipProps extends ViewProps {
  status: StatusType;
  label: string;
}

export function StatusChip({ status, label, style, ...rest }: StatusChipProps) {
  const tintColor = theme.statusTint[status];
  const textColor = theme.statusText[status];

  return (
    <View style={[styles.container, { backgroundColor: tintColor }, style]} {...rest}>
      <AppText variant="caption" style={[styles.label, { color: textColor }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
});
