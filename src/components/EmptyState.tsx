import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';

export interface EmptyStateProps extends ViewProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action, style, ...rest }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <AppText variant="h2" style={styles.title}>{title}</AppText>
      {description && (
        <AppText variant="body" tone="muted" style={styles.description}>
          {description}
        </AppText>
      )}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    flex: 1,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
    opacity: 0.5,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: theme.spacing.lg,
  },
});
