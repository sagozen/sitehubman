import React from 'react';
import { StyleSheet, type ViewProps } from 'react-native';
import { theme } from '../constants/theme';
import { GlassPressable } from './GlassPressable';

export interface FloatingActionButtonProps extends ViewProps {
  icon: React.ReactNode;
  onPress?: () => void;
  position?: 'bottom-right' | 'bottom-center';
}

export function FloatingActionButton({ icon, onPress, position = 'bottom-right', style, ...rest }: FloatingActionButtonProps) {
  return (
    <GlassPressable
      style={[
        styles.container, 
        position === 'bottom-right' ? styles.bottomRight : styles.bottomCenter,
        style
      ]}
      onPress={onPress}
      {...rest}
    >
      {icon}
    </GlassPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.floating,
    zIndex: 100,
  },
  bottomRight: {
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
  },
  bottomCenter: {
    bottom: theme.spacing.xl,
    alignSelf: 'center',
  },
});
