/**
 * MetricCardV2 — Premium SaaS Quality Metric Card
 * Data visualization block for analytics dashboards.
 */

import React, { memo } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';

export interface MetricCardV2Props {
  title: string;
  value: string | number;
  icon?: AppIconName;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  style?: StyleProp<ViewStyle>;
}

function MetricCardV2Raw({
  title,
  value,
  icon,
  trend,
  trendValue,
  style,
}: MetricCardV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  let trendColor = getColor('inkTertiary', mode);
  let trendIcon: AppIconName | undefined;

  if (trend === 'up') {
    trendColor = getColor('success', mode);
    trendIcon = 'TrendingUp';
  } else if (trend === 'down') {
    trendColor = getColor('error', mode);
    trendIcon = 'TrendingDown';
  }

  return (
    <View style={[styles.container, { backgroundColor: getColor('surface', mode), borderColor: getColor('border', mode) }, style]}>
      <View style={styles.header}>
        <MonoText style={[getTypography('caption', 'medium'), { color: getColor('inkSecondary', mode) }]}>
          {title}
        </MonoText>
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: getColor('surfaceSubdued', mode) }]}>
            <AppIcon name={icon} size={16} color={getColor('inkSecondary', mode)} />
          </View>
        )}
      </View>

      <MonoText style={[getTypography('h2', 'bold'), { color: getColor('ink', mode), marginVertical: tokens.spacing[2] }]}>
        {value}
      </MonoText>

      {trend && trendValue && (
        <View style={styles.trendRow}>
          {trendIcon && (
            <AppIcon name={trendIcon} size={14} color={trendColor} style={styles.trendIcon} />
          )}
          <MonoText style={[getTypography('caption', 'medium'), { color: trendColor }]}>
            {trendValue}
          </MonoText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[4],
    borderRadius: tokens.radius.xl,
    borderWidth: 1,
    flex: 1, // Allows it to share row space in a grid
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing[1],
  },
  trendIcon: {
    marginRight: tokens.spacing[1],
  },
});

export const MetricCardV2 = memo(MetricCardV2Raw);
