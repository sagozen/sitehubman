import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { GlassSurface } from '@/src/components/GlassSurface';
import { glassTheme } from '@/src/design-system/glass';
import { RoleThemeKey } from '@/src/constants/theme';

interface AppCardProps {
  role?: RoleThemeKey;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppCard({
  children,
  role: _role = 'default',
  elevated = false,
  style,
  contentStyle,
}: PropsWithChildren<AppCardProps>) {
  void _role;

  return (
    <GlassSurface
      elevated={elevated}
      intensity={elevated ? 'strong' : 'medium'}
      borderRadius={glassTheme.radius.card}
      style={style}
      contentStyle={[styles.pad, contentStyle]}
    >
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: glassTheme.spacing.cardPad,
  },
});
