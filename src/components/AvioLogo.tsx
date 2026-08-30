import React from 'react';
import { StyleSheet, View, Text, type ViewStyle } from 'react-native';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';

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
      ? 0.45
      : size === 'md'
      ? 0.6
      : size === 'lg'
      ? 0.75
      : 0.9;

  const width = 260 * baseScale;
  const height = (showTagline ? 85 : 60) * baseScale;

  const strokeRef = isLight ? 'url(#lightChromeGrad)' : 'url(#darkSilverGrad)';
  const fillRef = isLight ? 'url(#lightChromeGrad)' : 'url(#darkSilverGrad)';
  const tagColor = isLight ? '#1C1C1E' : '#D1D1D6';

  return (
    <View style={[styles.container, { width }, style]}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 850 210"
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

        {/* ── Letter A (Sharp Chevron Apex) ── */}
        <Path
          d="M 40 155 L 125 25 L 210 155"
          stroke={strokeRef}
          strokeWidth="24"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          fill="none"
        />

        {/* ── Letter V (Symmetrical Vertex) ── */}
        <Path
          d="M 255 25 L 340 155 L 425 25"
          stroke={strokeRef}
          strokeWidth="24"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          fill="none"
        />

        {/* ── Letter I (Solid Monolithic Vertical Pillar) ── */}
        <Rect
          x="480"
          y="25"
          width="24"
          height="130"
          fill={fillRef}
        />

        {/* ── Letter O (Ring with Aperture) ── */}
        <Path
          d="M 685 45 A 65 65 0 1 0 685 135"
          stroke={strokeRef}
          strokeWidth="24"
          strokeLinecap="butt"
          fill="none"
        />

        {/* ── 3 NFC Waves ── */}
        <G stroke="url(#blueSignal)" strokeWidth="10" strokeLinecap="round" fill="none">
          <Path d="M 690 68 A 22 22 0 0 1 690 112" />
          <Path d="M 708 54 A 40 40 0 0 1 708 126" />
          <Path d="M 726 40 A 58 58 0 0 1 726 140" />
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
