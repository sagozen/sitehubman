import { Platform, type ViewStyle } from 'react-native';

/** Unified Apple-style frosted glass tokens — cool blue-gray tones. */
export const glassTheme = {
  blur: {
    subtle: Platform.select({ ios: 24, android: 18, default: 20 }) ?? 20,
    medium: Platform.select({ ios: 40, android: 28, default: 32 }) ?? 32,
    strong: Platform.select({ ios: 56, android: 36, default: 44 }) ?? 44,
    dock:   Platform.select({ ios: 56, android: 40, default: 48 }) ?? 48,
  },
  radius: {
    card:  24,
    panel: 16,
    chip:  12,
    hero:  28,
    pill: 9999,
  },
  border: {
    light:         'rgba(255,255,255,0.45)',
    lightHairline: 'rgba(60,60,67,0.06)',
    dark:          'rgba(255,255,255,0.08)',
    darkHairline:  'rgba(84,84,88,0.25)',
    // Enhanced: stronger specular lines for premium look
    lightSpecular: 'rgba(255,255,255,0.70)',
    darkSpecular:  'rgba(255,255,255,0.14)',
  },
  fill: {
    light:         'rgba(255,255,255,0.65)',
    lightElevated: 'rgba(255,255,255,0.85)',
    dark:          'rgba(28,28,30,0.38)',
    darkElevated:  'rgba(44,44,46,0.55)',
    // Ultra-frosted for hero surfaces
    ultraLight:    'rgba(255,255,255,0.92)',
    ultraDark:     'rgba(18,18,20,0.78)',
  },
  backdrop: {
    light:     ['#F4F7FB', '#FAFCFF', '#FFFFFF'] as const,
    dark:      ['#07090E', '#0D1017', '#161618'] as const,
    lightGlow: 'rgba(0,122,255,0.06)',
    darkGlow:  'rgba(10,132,255,0.08)',
    // Rich depth layers
    lightDeep: ['#EEF2F8', '#F6F9FE', '#FAFCFF', '#FFFFFF'] as const,
    darkDeep:  ['#000000', '#07090E', '#0D1017', '#131518'] as const,
  },
  overlay: {
    lightSheen:    ['rgba(255,255,255,0.82)', 'rgba(210,228,255,0.18)', 'rgba(255,255,255,0.44)'] as const,
    darkSheen:     ['rgba(120,120,128,0.15)', 'rgba(44,44,46,0.05)', 'rgba(18,18,20,0.20)'] as const,
    specularLight: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.30)', 'rgba(255,255,255,0)'] as const,
    specularDark:  ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as const,
    // Tinted glass overlays
    blueLight:     ['rgba(0,122,255,0.08)', 'rgba(0,122,255,0.02)'] as const,
    blueDark:      ['rgba(10,132,255,0.12)', 'rgba(10,132,255,0.04)'] as const,
  },
  motion: {
    pressScale:     0.98,
    softPressScale: 0.992,
    releaseScale:   1.02,   // Slight overshoot on release for feel
    duration: {
      fast:   140,
      base:   220,
      slow:   320,
      xslow:  450,
    },
    // Reanimated 4 spring configs
    spring: {
      standard: { damping: 20, stiffness: 180, mass: 1 },
      snappy:   { damping: 16, stiffness: 320, mass: 0.8 },
      bouncy:   { damping: 12, stiffness: 280, mass: 1 },
      micro:    { damping: 26, stiffness: 420, mass: 0.5 },
      tab:      { damping: 18, stiffness: 260, mass: 0.9 },
    },
  },
  spacing: {
    screenX:  20,
    screenY:  16,
    section:  24,
    cardPad:  20,
    rowGap:   12,
    colGap:   12,
  },
  // Shimmer animation tokens (for skeleton loaders)
  shimmer: {
    baseColor:    { light: 'rgba(0,0,0,0.04)',  dark: 'rgba(255,255,255,0.04)' },
    highlightColor: { light: 'rgba(255,255,255,0.9)', dark: 'rgba(255,255,255,0.10)' },
    duration:     1200,
    angle:        20,
  },
  // Elevation-aware shadow map
  shadow: {
    xs: Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
      default: { elevation: 1 },
    })!,
    sm: Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 6 },
      default: { elevation: 3 },
    })!,
    md: Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 12 },
      default: { elevation: 6 },
    })!,
    lg: Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
      default: { elevation: 10 },
    })!,
    xl: Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.24, shadowRadius: 32 },
      default: { elevation: 16 },
    })!,
  } as Record<string, ViewStyle>,
} as const;

export function glassBorderColor(isDark: boolean): string {
  return isDark ? glassTheme.border.dark : glassTheme.border.light;
}

export function glassHairline(isDark: boolean): string {
  return isDark ? glassTheme.border.darkHairline : glassTheme.border.lightHairline;
}

export function glassFill(isDark: boolean, elevated = false): string {
  if (isDark) return elevated ? glassTheme.fill.darkElevated : glassTheme.fill.dark;
  return elevated ? glassTheme.fill.lightElevated : glassTheme.fill.light;
}

export function resolveBlurIntensity(level: keyof typeof glassTheme.blur | number): number {
  if (typeof level === 'number') return level;
  return glassTheme.blur[level];
}

export function glassCardShadow(_isDark: boolean): ViewStyle {
  return glassTheme.shadow.md as ViewStyle;
}
