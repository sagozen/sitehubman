import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { glassTheme, glassCardShadow } from '@/src/design-system/glass';

interface GlassContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
}

export function GlassContainer({ children, style, elevated = false, noPadding = false }: GlassContainerProps) {
  return (
    <View style={[
      styles.container,
      elevated && styles.elevated,
      noPadding && styles.noPadding,
      glassCardShadow(false),
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: glassTheme.radius.card,
    borderWidth: 1,
    borderColor: glassTheme.border.light,
    padding: glassTheme.spacing.cardPad,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  noPadding: {
    padding: 0,
  },
});
