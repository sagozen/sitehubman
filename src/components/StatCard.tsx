import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';

export interface StatCardProps extends ViewProps {
  title: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function StatCard({ title, value, trend, trendDirection, icon, style, ...rest }: StatCardProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.header}>
        <AppText variant="caption" tone="muted" style={styles.title}>{title}</AppText>
        {icon}
      </View>
      <View style={styles.body}>
        <AppText variant="h1" style={styles.value}>{value}</AppText>
        {trend && (
          <AppText 
            variant="caption" 
            style={[
              styles.trend, 
              trendDirection === 'up' ? styles.trendUp : 
              trendDirection === 'down' ? styles.trendDown : null
            ]}
          >
            {trend}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.comfort,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.06)',
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
  },
  value: {
    letterSpacing: -0.5,
  },
  trend: {
    fontWeight: '600',
  },
  trendUp: {
    color: theme.colors.success,
  },
  trendDown: {
    color: theme.colors.danger,
  },
});
