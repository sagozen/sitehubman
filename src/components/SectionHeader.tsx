import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';

export interface SectionHeaderProps extends ViewProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action, style, ...rest }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <AppText variant="h2" style={styles.title}>{title}</AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    textTransform: 'none',
  },
});
