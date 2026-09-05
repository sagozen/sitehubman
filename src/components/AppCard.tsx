/**
 * AppCard — backward-compatible monochrome card wrapper.
 * Hairline border by default, sharp 14-radius. Elevated for floating contexts.
 * Drop-in replacement for the legacy glass card.
 */
import { memo, type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { monoRadius, monoSpace } from '@/src/design-system/monochrome';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppCardProps {
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  bordered?: boolean;
  pad?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: number;
}

const padMap = {
  none: 0,
  sm: monoSpace[3],
  md: monoSpace[4],
  lg: monoSpace[5],
  xl: monoSpace[6],
};

function AppCardRaw({
  children,
  elevated = false,
  bordered = true,
  pad = 'md',
  radius = monoRadius.xl,
  style,
  contentStyle,
}: PropsWithChildren<AppCardProps>) {
  const { isDark } = usePreferences();

  const surface = isDark ? '#1a1a1a' : '#FFFFFF';
  const hairline = isDark ? '#3a3a3a' : 'rgba(10,10,11,0.06)';

  return (
    <View
      style={[
        {
          borderRadius: radius,
          padding: padMap[pad],
          backgroundColor: surface,
          borderWidth: bordered ? 0.5 : 0,
          borderColor: hairline,
          ...(elevated
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 2,
              }
            : null),
        },
        style,
      ]}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

export const AppCard = memo(AppCardRaw);