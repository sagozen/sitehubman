import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { glassTheme } from '@/src/design-system/glass';
import { usePreferences } from '@/src/hooks/usePreferences';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  isDark?: boolean;
};

/** Cool-tone screen canvas with soft blue glow — used behind all major shells. */
export function GlassScreenBackdrop({ children, style, isDark: isDarkProp }: Props) {
  const { isDark: prefDark } = usePreferences();
  const isDark = isDarkProp ?? prefDark;
  const stops = isDark ? glassTheme.backdrop.dark : glassTheme.backdrop.light;
  const glow = isDark ? glassTheme.backdrop.darkGlow : glassTheme.backdrop.lightGlow;

  return (
    <View style={[styles.root, style]}>
      <LinearGradient colors={[...stops]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowTop, { backgroundColor: glow }]} />
      <View style={[styles.glowCorner, { backgroundColor: glow }]} />
      <View style={styles.children}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ width: '100%', minHeight: '100%' } as ViewStyle) : null),
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 999,
    opacity: 0.9,
  },
  glowCorner: {
    position: 'absolute',
    bottom: 120,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.55,
  },
  children: {
    flex: 1,
  },
});
