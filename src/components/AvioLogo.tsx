import React from 'react';
import { StyleSheet, View, Text, type ViewStyle } from 'react-native';
import Svg, { Path, Line, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface AvioLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  theme?: 'dark' | 'light';
  showTagline?: boolean;
  nfcColor?: string;
  style?: ViewStyle;
}

export function AvioLogo({
  size = 'md',
  theme = 'dark',
  showTagline = true,
  nfcColor = '#007AFF',
  style,
}: AvioLogoProps) {
  const isLight = theme === 'light';

  const baseScale =
    typeof size === 'number'
      ? size / 240
      : size === 'sm'
      ? 0.7
      : size === 'md'
      ? 1.0
      : size === 'lg'
      ? 1.45
      : 2.0;

  const width = 260 * baseScale;
  const height = (showTagline ? 85 : 60) * baseScale;

  const strokeRef = isLight ? 'url(#lightChromeGrad)' : 'url(#darkSilverGrad)';
  const tagColor = isLight ? '#1C1C1E' : '#D1D1D6';

  return (
    <View style={[styles.container, { width }, style]}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 900 240"
        style={styles.svg}
      >
        <Defs>
          <LinearGradient id="darkSilverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="50%" stopColor="#E2E2E8" />
            <Stop offset="100%" stopColor="#A8A8B2" />
          </LinearGradient>

          <LinearGradient id="lightChromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="50%" stopColor="#E4E4EB" />
            <Stop offset="100%" stopColor="#9C9CA8" />
          </LinearGradient>

          <LinearGradient id="blueSignal" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2997FF" />
            <Stop offset="100%" stopColor="#0066FF" />
          </LinearGradient>
        </Defs>

        {/* ── Letter A ── */}
        <Path
          d="M 50 160 L 140 25 L 230 160"
          stroke={strokeRef}
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* ── Letter V ── */}
        <Path
          d="M 275 25 L 365 160 L 455 25"
          stroke={strokeRef}
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* ── Letter I (Pillar) ── */}
        <Line
          x1="520"
          y1="25"
          x2="520"
          y2="160"
          stroke={strokeRef}
          strokeWidth="24"
          strokeLinecap="round"
        />

        {/* ── Letter O (Ring) ── */}
        <Path
          d="M 725 45 A 68 68 0 1 0 725 140"
          stroke={strokeRef}
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── 3 NFC Waves ── */}
        <G stroke="url(#blueSignal)" strokeWidth="9" strokeLinecap="round" fill="none">
          <Path d="M 732 70 A 24 24 0 0 1 732 115" />
          <Path d="M 750 56 A 42 42 0 0 1 750 129" />
          <Path d="M 768 42 A 60 60 0 0 1 768 143" />
        </G>
      </Svg>

      {/* ── Tagline ── */}
      {showTagline && (
        <View style={styles.taglineBox}>
          <Text style={[styles.tagline, { fontSize: Math.max(9 * baseScale, 8), color: tagColor }]}>
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
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
