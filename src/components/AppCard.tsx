import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { GlassSurface } from '@/src/components/GlassSurface';
import { RoleThemeKey, theme } from '@/src/constants/theme';

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
      borderRadius={theme.radius.xl}
      style={style}
      contentStyle={[styles.pad, contentStyle]}
    >
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: theme.spacing.comfort,
  },
});
