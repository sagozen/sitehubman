/**
 * AVIO 4K Vector Logo & Brand Mark Component
 *
 * Pixel-perfect SVG reproduction of the official AVIO emblem:
 * - A: Chevron apex without crossbar
 * - V: Sharp symmetrical vertex
 * - I: Monolithic pillar
 * - O: Open circular loop with 3 vibrant blue NFC wireless signal waves
 * - Subtitle: "CONNECT • IDENTIFY • EMPOWER"
 */

import React from 'react';
import { StyleSheet, View, Text, type ViewStyle, type TextStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface AvioLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showTagline?: boolean;
  color?: string;
  nfcColor?: string;
  style?: ViewStyle;
}

export function AvioLogo({
  size = 'md',
  showTagline = true,
  color = '#FFFFFF',
  nfcColor = '#007AFF',
  style,
}: AvioLogoProps) {
  // Sizing scale calculation
  const baseScale =
    typeof size === 'number'
      ? size / 200
      : size === 'sm'
      ? 0.65
      : size === 'md'
      ? 1.0
      : size === 'lg'
      ? 1.5
      : 2.2;

  const width = 280 * baseScale;
  const height = (showTagline ? 100 : 70) * baseScale;

  return (
    <View style={[styles.container, { width }, style]}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 600 200"
        style={styles.svg}
      >
        <Defs>
          {/* Subtle metallic silver gradient for letterforms */}
          <LinearGradient id="silverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="60%" stopColor="#E2E2E8" />
            <Stop offset="100%" stopColor="#A8A8B2" />
          </LinearGradient>

          {/* Electric Blue Signal Gradient */}
          <LinearGradient id="blueSignal" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2997FF" />
            <Stop offset="100%" stopColor="#0066FF" />
          </LinearGradient>
        </Defs>

        {/* ── Letter A ── */}
        <Path
          d="M 40 145 L 95 25 L 150 145"
          stroke={color === '#FFFFFF' ? 'url(#silverGrad)' : color}
          strokeWidth="20"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          fill="none"
        />

        {/* ── Letter V ── */}
        <Path
          d="M 185 25 L 240 145 L 295 25"
          stroke={color === '#FFFFFF' ? 'url(#silverGrad)' : color}
          strokeWidth="20"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          fill="none"
        />

        {/* ── Letter I ── */}
        <Path
          d="M 345 25 L 345 145"
          stroke={color === '#FFFFFF' ? 'url(#silverGrad)' : color}
          strokeWidth="20"
          strokeLinecap="butt"
          fill="none"
        />

        {/* ── Letter O (Ring with opening on right) ── */}
        <Path
          d="M 505 50 A 62 62 0 1 0 505 120"
          stroke={color === '#FFFFFF' ? 'url(#silverGrad)' : color}
          strokeWidth="20"
          strokeLinecap="butt"
          fill="none"
        />

        {/* ── 3 NFC Waves emerging from O opening ── */}
        <G stroke="url(#blueSignal)" strokeWidth="10" strokeLinecap="round" fill="none">
          {/* Inner Wave */}
          <Path d="M 508 72 A 20 20 0 0 1 508 98" />
          {/* Middle Wave */}
          <Path d="M 522 62 A 34 34 0 0 1 522 108" />
          {/* Outer Wave */}
          <Path d="M 536 52 A 48 48 0 0 1 536 118" />
        </G>
      </Svg>

      {/* ── Tagline: CONNECT • IDENTIFY • EMPOWER ── */}
      {showTagline && (
        <View style={styles.taglineBox}>
          <Text style={[styles.tagline, { fontSize: Math.max(9 * baseScale, 8) }]}>
            CONNECT <Text style={{ color: nfcColor }}>•</Text> IDENTIFY <Text style={{ color: nfcColor }}>•</Text> EMPOWER
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    alignSelf: 'center',
  },
  taglineBox: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tagline: {
    fontWeight: '700',
    color: '#D1D1D6',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
