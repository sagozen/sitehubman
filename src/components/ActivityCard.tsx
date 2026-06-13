import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';

export interface ActivityCardProps extends ViewProps {
  title: string;
  description?: string;
  time?: string;
  icon?: React.ReactNode;
  isLast?: boolean;
}

export function ActivityCard({ title, description, time, icon, isLast, style, ...rest }: ActivityCardProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.iconColumn}>
        <View style={styles.iconBadge}>{icon}</View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.contentColumn}>
        <View style={styles.headerRow}>
          <AppText variant="body" style={styles.title}>{title}</AppText>
          {time && <AppText variant="caption" tone="muted">{time}</AppText>}
        </View>
        {description && (
          <AppText variant="bodySmall" tone="muted" style={styles.description}>
            {description}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 64,
  },
  iconColumn: {
    width: 40,
    alignItems: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 32,
    bottom: -8,
    width: 2,
    backgroundColor: theme.colors.border,
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: theme.spacing.lg,
    paddingLeft: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontWeight: '600',
  },
  description: {
    marginTop: 2,
  },
});
