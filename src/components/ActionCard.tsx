import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';
import { GlassPressable } from './GlassPressable';

export interface ActionCardProps extends ViewProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export function ActionCard({ title, subtitle, icon, onPress, disabled, style, ...rest }: ActionCardProps) {
  return (
    <GlassPressable
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      {...rest}
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContainer}>
          <AppText variant="h2" style={styles.title}>{title}</AppText>
          {subtitle && (
            <AppText variant="caption" tone="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
    </GlassPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    ...theme.shadows.control,
  },
  content: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  title: {
    letterSpacing: -0.2,
  },
  subtitle: {
  },
});
