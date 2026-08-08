/**
 * EmptyStateV2 — Premium SaaS Quality Empty State
 * Beautifully designed component for empty lists, search results, or generic states.
 * 
 * Features:
 * - Configurable icons
 * - Clear visual hierarchy (title, description)
 * - Action button integration
 * - Fluid spacing using V2 tokens
 */

import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { AppButtonV2 } from '@/src/components/AppButtonV2';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';

export interface EmptyStateV2Props {
  /** Icon to display */
  icon?: AppIconName;
  /** Main title text */
  title: string;
  /** Subtitle / description text */
  description?: string;
  /** Text for the primary action button */
  actionLabel?: string;
  /** Handler for the primary action button */
  onAction?: () => void;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

function EmptyStateV2Raw({
  icon = 'Inbox',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: getColor('surfaceSubdued', mode) },
        ]}
      >
        <AppIcon name={icon} size={32} color={getColor('inkSecondary', mode)} />
      </View>
      
      <MonoText
        style={[
          getTypography('h3', 'bold'),
          { color: getColor('ink', mode), textAlign: 'center', marginBottom: tokens.spacing[2] },
        ]}
      >
        {title}
      </MonoText>
      
      {description && (
        <MonoText
          style={[
            getTypography('body', 'regular'),
            { color: getColor('inkTertiary', mode), textAlign: 'center', marginBottom: tokens.spacing[5] },
          ]}
        >
          {description}
        </MonoText>
      )}

      {actionLabel && onAction && (
        <AppButtonV2
          variant="primary"
          size="md"
          label={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[6],
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing[4],
  },
  actionButton: {
    minWidth: 160,
  },
});

export const EmptyStateV2 = memo(EmptyStateV2Raw);
