/**
 * AVIO Logo & Brand Mark Component
 *
 * Implements the official AVIO Brand Design System:
 * - Wordmark: "avio" (ExtraBold lowercase)
 * - Signal Dot: one Azure blue (#0066FF) dot set after the wordmark representing "the tap"
 * - Clear space: dot diameter on all sides
 */

import React from 'react';
import { StyleSheet, View, Text, type ViewStyle, type TextStyle } from 'react-native';

interface AvioLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  dotColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'full' | 'icon' | 'badge';
  badgeBackground?: 'white' | 'azure' | 'black';
}

export const AVIO_AZURE = '#0066FF';

export function AvioLogo({
  size = 'md',
  textColor = '#FFFFFF',
  dotColor = AVIO_AZURE,
  style,
  textStyle,
  variant = 'full',
  badgeBackground = 'black',
}: AvioLogoProps) {
  // Sizing matrix (minimum height 16px per design spec)
  const fontSize = size === 'sm' ? 18 : size === 'md' ? 26 : size === 'lg' ? 36 : 48;
  const dotSize = Math.max(Math.round(fontSize * 0.22), 4);
  const dotMarginLeft = Math.round(fontSize * 0.08);

  if (variant === 'badge') {
    const isAzureBg = badgeBackground === 'azure';
    const isWhiteBg = badgeBackground === 'white';
    
    const bgColor = isAzureBg ? AVIO_AZURE : isWhiteBg ? '#FFFFFF' : '#0D0D10';
    const fgColor = isAzureBg ? '#FFFFFF' : isWhiteBg ? '#000000' : '#FFFFFF';
    const badgeDotColor = isAzureBg ? '#FFFFFF' : AVIO_AZURE;
    const borderColor = isWhiteBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';

    return (
      <View
        style={[
          styles.badgeContainer,
          {
            backgroundColor: bgColor,
            borderColor,
            paddingHorizontal: fontSize * 0.8,
            paddingVertical: fontSize * 0.4,
            borderRadius: fontSize * 0.45,
          },
          style,
        ]}
      >
        <Text style={[styles.wordmark, { fontSize, color: fgColor }, textStyle]}>
          avio
          <Text style={{ color: badgeDotColor }}>.</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.wordmark, { fontSize, color: textColor }, textStyle]}>
        avio
        <Text style={{ color: dotColor }}>.</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  badgeContainer: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontWeight: '900',
    letterSpacing: -0.8,
    textTransform: 'lowercase',
    includeFontPadding: false,
  },
});
