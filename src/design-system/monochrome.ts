/**
 * Monochrome Design System
 * ────────────────────────────────────────────────────────────────────────────
 * Inspired by Apple, Linear, and Nothing. Black · White · Grayscale.
 * Razor-sharp typography, generous whitespace, perfect alignment.
 * Optimized for 120 FPS — minimal animations, native responsiveness.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

// ─── Color Tokens ──────────────────────────────────────────────────────────
// Pure, neutral palette. No chromatic accents. Just luminance.
export const mono = {
  // Color Palette
  monochromeBlack: '#000000',
  monochromeDarkSurface: '#1a1a1a',
  monochromeSurfaceVariant: '#2a2a2a',
  monochromeBorder: '#3a3a3a',
  monochromeTextPrimary: '#ffffff',
  monochromeTextSecondary: '#b3b3b3',
  monochromeTextMuted: '#808080',
  spotifyGreen: '#1DB954',
  error: '#ff4444',

  // True neutrals / aliases
  white: '#FFFFFF',
  paper: '#FAFAFA',
  fog: '#F4F4F5',
  mist: '#E9E9EB',
  ash: '#D4D4D8',
  silver: '#b3b3b3',
  graphite: '#808080',
  ink: '#1a1a1a',
  carbon: '#1a1a1a',
  void: '#000000',

  // Dark mode specific aliases
  obsidian: '#000000',
  basalt: '#1a1a1a',
  slate: '#2a2a2a',
  mercury: '#3a3a3a',
  steel: '#808080',
  platinum: '#808080',
  cloud: '#b3b3b3',
  snow: '#ffffff',
} as const;

// Semantic tokens — single source of truth for the UI
export type MonoMode = 'light' | 'dark';

export interface MonoTokens {
  // Surfaces
  canvas: string;           // App background
  surface: string;          // Cards, sheets, elevated groups
  surfaceRaised: string;    // Modals, floating elements
  surfaceSunken: string;    // Inputs, search pills
  glass: string;            // Translucent header backgrounds

  // Text
  text: string;             // Primary
  textMuted: string;        // Secondary
  textTertiary: string;     // Captions, helper
  textInverse: string;      // On solid color

  // Lines
  hairline: string;         // 1px subtle dividers
  border: string;           // Input borders
  separator: string;        // Section separators

  // Solid / Accents
  ink: string;              // Buttons, badges, indicators
  inkInverse: string;       // Text on ink
  accent: string;           // Accent color (spotifyGreen)
  error: string;            // Error color

  // Status
  positive: string;
  negative: string;
  warn: string;

  // Focus
  focus: string;            // Focus ring

  // Shadows
  shadowColor: string;
}

export const monoLight: MonoTokens = {
  canvas: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceRaised: '#F5F5F5',
  surfaceSunken: '#EBEBEB',
  glass: 'rgba(250,250,250,0.78)',

  text: '#000000',
  textMuted: '#666666',
  textTertiary: '#808080',
  textInverse: '#ffffff',

  hairline: 'rgba(0,0,0,0.06)',
  border: '#3a3a3a',
  separator: 'rgba(0,0,0,0.08)',

  ink: '#000000',
  inkInverse: '#ffffff',
  accent: '#1DB954',
  error: '#ff4444',

  positive: '#1DB954',
  negative: '#ff4444',
  warn: '#ff9500',

  focus: '#1DB954',
  shadowColor: '#000000',
};

export const monoDark: MonoTokens = {
  canvas: mono.monochromeBlack,               // #000000
  surface: mono.monochromeDarkSurface,        // #1a1a1a
  surfaceRaised: mono.monochromeSurfaceVariant, // #2a2a2a
  surfaceSunken: '#141414',
  glass: 'rgba(26,26,26,0.85)',

  text: mono.monochromeTextPrimary,           // #ffffff
  textMuted: mono.monochromeTextSecondary,    // #b3b3b3
  textTertiary: mono.monochromeTextMuted,     // #808080
  textInverse: mono.monochromeBlack,          // #000000

  hairline: mono.monochromeBorder,            // #3a3a3a
  border: mono.monochromeBorder,              // #3a3a3a
  separator: mono.monochromeBorder,           // #3a3a3a

  ink: mono.monochromeTextPrimary,            // #ffffff
  inkInverse: mono.monochromeBlack,           // #000000
  accent: mono.spotifyGreen,                  // #1DB954
  error: mono.error,                          // #ff4444

  positive: mono.spotifyGreen,                // #1DB954
  negative: mono.error,                       // #ff4444
  warn: '#FF9F0A',

  focus: mono.spotifyGreen,                   // #1DB954
  shadowColor: '#000000',
};

// ─── Typography ────────────────────────────────────────────────────────────
// System font for general text, Courier (monospace) for technical indicators.
export const monoFonts = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }) as string,
  semibold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }) as string,
  bold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  heavy: Platform.select({ ios: 'System', android: 'sans-serif-black', default: 'System' }) as string,
  mono: Platform.select({ ios: 'Courier', android: 'monospace', default: 'Courier' }) as string,
};

// Tightened, sharper type scale. Negative tracking — premium feel.
export const monoType = {
  // Display — used once per screen, hero moments
  display: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.2,
  } satisfies TextStyle,

  // Large title — page heroes
  title1: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
  } satisfies TextStyle,

  // Section title
  title2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  } satisfies TextStyle,

  // Card title
  title3: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  } satisfies TextStyle,

  // List row title
  headline: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
  } satisfies TextStyle,

  // Body
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.1,
  } satisfies TextStyle,

  // Body small — secondary content
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
  } satisfies TextStyle,

  // Callout — emphasized body
  callout: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.1,
  } satisfies TextStyle,

  // Subhead — list subtitles
  subhead: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0,
  } satisfies TextStyle,

  // Footnote
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: 0,
  } satisfies TextStyle,

  // Caption
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  } satisfies TextStyle,

  // Tiny — overline / micro
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  // Mono — for codes, IDs, numbers
  mono: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0,
    fontFamily: monoFonts.mono,
  } satisfies TextStyle,
} as const;

// ─── Spacing ───────────────────────────────────────────────────────────────
// Spacing Scale: 4px (xs), 8px (sm), 16px (md), 24px (lg), 32px (xl)
export const monoSpace = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  // Numeric aliases for backward compatibility
  px: 1,
  '0_5': 2,
  1: 4,
  '1_5': 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// ─── Radius ────────────────────────────────────────────────────────────────
// Border Radii: 4px (small), 8px (medium), 12px (large), 9999px (circular/pill buttons)
export const monoRadius = {
  none: 0,
  small: 4,
  medium: 8,
  large: 12,
  circular: 9999,
  pill: 9999,
  // Semantic / size aliases
  xs: 4,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 12,
  '2xl': 12,
  '3xl': 12,
  full: 9999,
} as const;

// ─── Elevation ─────────────────────────────────────────────────────────────
// Ultra-subtle shadows — Apple-style. Almost imperceptible.
export const monoShadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  } satisfies ViewStyle,
  low: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  } satisfies ViewStyle,
  high: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
  // Floating tab bar / capsules
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 16,
  } satisfies ViewStyle,
} as const;

// ─── Motion ────────────────────────────────────────────────────────────────
// Tight, 120–200ms budget. Native drivers only.
export const monoMotion = {
  // Damping/stiffness tuned for crisp, Apple-feel
  spring: { damping: 24, stiffness: 280, mass: 0.6 },
  springGentle: { damping: 20, stiffness: 180, mass: 0.8 },

  // Timings — measured in ms
  quick: 120,
  base: 160,
  slow: 220,
  linger: 300,

  // Curves
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',   // expo-out — premium feel
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',

  // Press states
  pressScale: 0.985,
  pressOpacity: 0.7,
  hoverScale: 1.015,
} as const;

// ─── Layout ────────────────────────────────────────────────────────────────
export const monoLayout = {
  // Standard gutter — used for content padding
  gutter: 20,

  // Section vertical rhythm
  sectionGap: 32,

  // Max content width for tablets / large screens
  maxContentWidth: 640,

  // Touch targets — Apple HIG minimum
  hitTarget: 44,
  hitTargetLarge: 48,
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────
export function monoTokensFor(mode: MonoMode): MonoTokens {
  return mode === 'dark' ? monoDark : monoLight;
}
