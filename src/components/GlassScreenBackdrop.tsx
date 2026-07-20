import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { usePreferences } from '@/src/hooks/usePreferences';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  isDark?: boolean;
};

/** Native grouped iOS screen canvas used behind the major shells. */
export function GlassScreenBackdrop({ children, style, isDark: isDarkProp }: Props) {
  const { colors, isDark: prefDark } = usePreferences();
  const isDark = isDarkProp ?? prefDark;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.background : '#F2F2F7' }, style]}>
      <View style={styles.children}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ width: '100%', minHeight: '100%' } as ViewStyle) : null),
  },
  children: {
    flex: 1,
  },
});
