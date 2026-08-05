import React from 'react';
import { StyleSheet, View, type ViewStyle, type StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { iosDesign, iosPalette } from '@/src/design-system/ios';

export interface IosGlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  borderRadius?: number;
}

/**
 * IosGlassCard — Native iOS blur material card component.
 * Adheres to Apple HIG translucency and surface materials.
 */
export function IosGlassCard({
  children,
  style,
  intensity = 40,
  tint = 'dark',
  borderRadius = iosDesign.radius.xxl,
}: IosGlassCardProps) {
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.webGlassCard,
          { borderRadius, backgroundColor: tint === 'dark' ? 'rgba(17,17,20,0.85)' : 'rgba(255,255,255,0.85)' },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { borderRadius }, style]}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View style={[styles.innerContent, { borderRadius }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(17, 17, 20, 0.5)',
  },
  innerContent: {
    padding: iosDesign.spacing.base,
  },
  webGlassCard: {
    padding: iosDesign.spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  } as ViewStyle,
});
