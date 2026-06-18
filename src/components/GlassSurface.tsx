import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { glassTheme } from '@/src/design-system/glass';
import { theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

type IntensityKey = keyof typeof glassTheme.blur;

export type GlassSurfaceProps = {
  children: ReactNode;
  /** Blur preset or custom intensity. */
  intensity?: IntensityKey | number;
  borderRadius?: number;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  isDark?: boolean;
};

export function GlassSurface({
  children,
  intensity = 'medium',
  borderRadius = glassTheme.radius.card,
  elevated = false,
  style,
  contentStyle,
  isDark: isDarkProp,
}: GlassSurfaceProps) {
  const { colors, isDark: prefDark } = usePreferences();
  const isDark = isDarkProp ?? prefDark;
  void intensity;

  return (
    <View
      style={[
        styles.surface,
        elevated && theme.shadows.card,
        {
          borderRadius,
          borderColor: isDark ? colors.separator : colors.border,
          backgroundColor: elevated ? colors.surface : colors.surface,
        },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
