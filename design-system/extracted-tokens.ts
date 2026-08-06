/**
 * extracted-tokens.ts
 * Design system tokens shared across *Redesigned.tsx screen prototypes.
 * Extracted from Apple Wallet, Tesla, Linear, Arc Browser, Nothing OS principles.
 */

import { Dimensions, StyleSheet } from 'react-native';

const { width: screenX, height: screenY } = Dimensions.get('window');

const colorPalette = {
  background:       '#000000',
  surface:          '#111114',
  surfaceRaised:    '#1A1A1E',
  surfaceVariant:   '#1A1A1E',
  surfaceSecondary: '#1C1C1E',
  border:           'rgba(255,255,255,0.08)',
  borderLight:      'rgba(255,255,255,0.14)',
  text:             '#FFFFFF',
  white:            '#FFFFFF',
  black:            '#000000',
  textMedium:       'rgba(255,255,255,0.6)',
  textLight:        'rgba(255,255,255,0.4)',
  muted:            'rgba(255,255,255,0.5)',
  subtle:           'rgba(255,255,255,0.25)',
  accent:           '#FFFFFF',
  accentBlue:       '#0A84FF',
  accentCyan:       '#00F0FF',
  info:             '#0A84FF',
  danger:           '#FF453A',
  success:          '#30D158',
  warning:          '#FFD60A',
} as const;

const spacingValues = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenX,
  screenY,
} as const;

const radiusValues = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    24,
  card:  16,
  input: 12,
  full:  999,
} as const;

const typographyStyles = StyleSheet.create({
  display: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#FFFFFF',
  },
  detail: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
});

const elevationStyles = StyleSheet.create({
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  low: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  mid: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  high: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 12,
  },
});

export const tokens = {
  color:      colorPalette,
  colors:     colorPalette,
  spacing:    spacingValues,
  radius:     radiusValues,
  typography: typographyStyles,
  card: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    radius: 16,
    nfc: {
      width: 320,
      height: 200,
      cardWidth: 320,
      cardHeight: 200,
      radius: 16,
      aspectRatio: 1.586,
    },
  },
  nfc: {
    width: 320,
    height: 200,
    cardWidth: 320,
    cardHeight: 200,
    radius: 16,
    aspectRatio: 1.586,
  },
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  list: {
    itemHeight: 56,
    paddingHorizontal: 16,
    paddingX: 16,
  },
  button: {
    height: 48,
    borderRadius: 12,
    radius: 12,
  },
} as const;

export const elevation = elevationStyles;
