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
  // True neutrals — Apple's grayscale is *slightly* cool, Linear's is pure.
  white: '#FFFFFF',
  paper: '#FAFAFA',         // Soft canvas, warmer than #FFFFFF
  fog: '#F4F4F5',           // Quiet surface — used for soft groupings
  mist: '#E9E9EB',          // Hairlines, dividers
  ash: '#D4D4D8',           // Disabled, placeholder
  silver: '#A1A1AA',        // Secondary text on light
  graphite: '#52525B',      // Muted text
  ink: '#27272A',           // Primary text on light
  carbon: '#0A0A0B',        // Primary surface / strong text
  void: '#000000',          // Pure black — focus states, primary buttons

  // Dark mode
  obsidian: '#0B0B0D',      // App background
  basalt: '#131316',        // Surface
  slate: '#1C1C1F',         // Elevated surface
  mercury: '#26262B',       // Hairlines on dark
  steel: '#3F3F46',         // Disabled on dark
  platinum: '#71717A',      // Muted text on dark
  cloud: '#A1A1AA',         // Secondary text on dark
  snow: '#FAFAFA',          // Primary text on dark
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

  // Solid
  ink: string;              // Buttons, badges, indicators
  inkInverse: string;       // Text on ink

  // Status (kept monochrome — never colored for visual noise)
  positive: string;
  negative: string;
  warn: string;

  // Focus
  focus: string;            // Focus ring

  // Shadows
  shadowColor: string;
}

export const monoLight: MonoTokens = {
  canvas: mono.paper,
  surface: mono.white,
  surfaceRaised: mono.white,
  surfaceSunken: mono.fog,
  glass: 'rgba(250,250,250,0.78)',

  text: mono.ink,
  textMuted: mono.graphite,
  textTertiary: mono.silver,
  textInverse: mono.white,

  hairline: 'rgba(10,10,11,0.06)',
  border: 'rgba(10,10,11,0.10)',
  separator: 'rgba(10,10,11,0.08)',

  ink: mono.void,
  inkInverse: mono.white,

  positive: mono.carbon,
  negative: mono.void,
  warn: mono.ink,

  focus: mono.void,
  shadowColor: '#000000',
};

export const monoDark: MonoTokens = {
  canvas: mono.obsidian,
  surface: mono.basalt,
  surfaceRaised: mono.slate,
  surfaceSunken: '#0A0A0C',
  glass: 'rgba(11,11,13,0.78)',

  text: mono.snow,
  textMuted: mono.platinum,
  textTertiary: mono.steel,
  textInverse: mono.obsidian,

  hairline: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)',
  separator: 'rgba(255,255,255,0.08)',

  ink: mono.white,
  inkInverse: mono.obsidian,

  positive: mono.snow,
  negative: mono.white,
  warn: mono.snow,

  focus: mono.white,
  shadowColor: '#000000',
};

// ─── Typography ────────────────────────────────────────────────────────────
// SF Pro Display on iOS, system sans on Android, with hard-tuned weights.
export const monoFonts = {
  regular: Platform.select({ ios: 'SF-Pro-Display-Regular', android: 'sans-serif', default: 'System' }) as string,
  medium: Platform.select({ ios: 'SF-Pro-Display-Medium', android: 'sans-serif-medium', default: 'System' }) as string,
  semibold: Platform.select({ ios: 'SF-Pro-Display-Semibold', android: 'sans-serif-medium', default: 'System' }) as string,
  bold: Platform.select({ ios: 'SF-Pro-Display-Bold', android: 'sans-serif', default: 'System' }) as string,
  heavy: Platform.select({ ios: 'SF-Pro-Display-Heavy', android: 'sans-serif-black', default: 'System' }) as string,
  mono: Platform.select({ ios: 'SF-Mono', android: 'monospace', default: 'monospace' }) as string,
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
// 4pt grid. Generous defaults.
export const monoSpace = {
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
// Restrained. Apple's HIG favors 10–14 for cards. Linear uses ~10.
export const monoRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 14,
  '2xl': 18,
  '3xl': 22,
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
