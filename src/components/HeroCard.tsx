import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';
import { GlassSurface } from './GlassSurface';

export interface HeroCardProps extends ViewProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function HeroCard({ title, subtitle, action, icon, style, ...rest }: HeroCardProps) {
  return (
    <GlassSurface 
      style={[styles.container, style]} 
      intensity="medium"
      elevated
      {...rest}
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContainer}>
          <AppText variant="h1" style={styles.title}>{title}</AppText>
          {subtitle && (
            <AppText variant="body" tone="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
        </View>
        {action && <View style={styles.actionContainer}>{action}</View>}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.hero,
    overflow: 'hidden',
    ...theme.shadows.floating,
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  iconContainer: {
    marginBottom: theme.spacing.sm,
  },
  textContainer: {
    gap: theme.spacing.xs,
  },
  title: {
    letterSpacing: -0.5,
  },
  subtitle: {
    maxWidth: '90%',
  },
  actionContainer: {
    marginTop: theme.spacing.md,
  },
});
