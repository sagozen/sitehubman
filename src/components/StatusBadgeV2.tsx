/**
 * StatusBadgeV2 — Premium SaaS Quality Status Badge
 * Replaces old ad-hoc badges with a standard component using the token system.
 */

import React, { memo } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeV2Props {
  /** The text to display */
  label: string;
  /** Semantic color variant */
  variant?: StatusVariant;
  /** Optional icon to show on the left */
  icon?: AppIconName;
  /** Use solid fill instead of soft fill */
  solid?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

function StatusBadgeV2Raw({
  label,
  variant = 'neutral',
  icon,
  solid = false,
  style,
}: StatusBadgeV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  // Determine colors based on variant
  let bgColor = '';
  let textColor = '';

  if (solid) {
    textColor = getColor('inkInverse', mode);
    switch (variant) {
      case 'success': bgColor = getColor('success', mode); break;
      case 'warning': bgColor = getColor('warning', mode); break;
      case 'error': bgColor = getColor('error', mode); break;
      case 'info': bgColor = getColor('primary', mode); break;
      case 'neutral': bgColor = getColor('surfaceSubdued', mode); textColor = getColor('ink', mode); break;
    }
  } else {
    // Soft variants (light background, bold text)
    switch (variant) {
      case 'success': 
        bgColor = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'; 
        textColor = getColor('success', mode); 
        break;
      case 'warning': 
        bgColor = isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'; 
        textColor = getColor('warning', mode); 
        break;
      case 'error': 
        bgColor = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'; 
        textColor = getColor('error', mode); 
        break;
      case 'info': 
        bgColor = getColor('primarySoft', mode); 
        textColor = getColor('primary', mode); 
        break;
      case 'neutral': 
        bgColor = getColor('surfaceSubdued', mode); 
        textColor = getColor('inkSecondary', mode); 
        break;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      {icon && (
        <AppIcon 
          name={icon} 
          size={12} 
          color={textColor} 
          style={styles.icon} 
        />
      )}
      <MonoText 
        style={[getTypography('caption', 'bold'), { color: textColor }]}
      >
        {label}
      </MonoText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: tokens.radius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});

export const StatusBadgeV2 = memo(StatusBadgeV2Raw);
