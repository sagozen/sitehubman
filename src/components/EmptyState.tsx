/**
 * EmptyState Component
 * 
 * Reusable empty state UI for lists, searches, and error states
 * Follows Apple HIG empty state patterns
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { AppButton } from './AppButton';
import { theme } from '@/src/constants/theme';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionVariant?: 'primary' | 'secondary';
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  illustration?: React.ReactNode;
  style?: any;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onActionPress,
  actionVariant = 'primary',
  secondaryActionLabel,
  onSecondaryActionPress,
  illustration,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {illustration ? (
        illustration
      ) : icon ? (
        <View style={styles.iconContainer}>
          <AppIcon name={icon as any} size={64} color={theme.colors.textTertiary} />
        </View>
      ) : null}

      <AppText style={styles.title} weight="bold">
        {title}
      </AppText>

      {subtitle && (
        <AppText style={styles.subtitle}>
          {subtitle}
        </AppText>
      )}

      {actionLabel && onActionPress && (
        <View style={styles.actions}>
          <AppButton
            title={actionLabel}
            onPress={onActionPress}
            variant={actionVariant}
            style={styles.actionButton}
          />
          {secondaryActionLabel && onSecondaryActionPress && (
            <AppButton
              title={secondaryActionLabel}
              onPress={onSecondaryActionPress}
              variant="secondary"
              style={styles.secondaryButton}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 20,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});
