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
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  onAction?: () => void;
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
  description,
  actionLabel,
  onActionPress,
  onAction,
  actionVariant = 'primary',
  secondaryActionLabel,
  onSecondaryActionPress,
  illustration,
  style,
}: EmptyStateProps) {
  const sub = subtitle || description;
  const handleAction = onActionPress || onAction;
  return (
    <View style={[styles.container, style]}>
      {illustration ? (
        illustration
      ) : icon ? (
        <View style={styles.iconContainer}>
          <AppIcon name={icon as any} size={64} color="#52525B" />
        </View>
      ) : null}

      <AppText style={styles.title} weight="bold">
        {title}
      </AppText>

      {sub && (
        <AppText style={styles.subtitle}>
          {sub}
        </AppText>
      )}

      {actionLabel && handleAction && (
        <View style={styles.actions}>
          <AppButton
            title={actionLabel}
            onPress={handleAction}
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
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9A9AA0',
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
