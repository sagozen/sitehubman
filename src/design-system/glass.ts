import { Platform, type ViewStyle } from 'react-native';

/** Unified Apple-style frosted glass tokens — cool blue-gray tones. */
export const glassTheme = {
  blur: {
    subtle: Platform.select({ ios: 24, android: 18, default: 20 }) ?? 20,
    medium: Platform.select({ ios: 40, android: 28, default: 32 }) ?? 32,
    strong: Platform.select({ ios: 56, android: 36, default: 44 }) ?? 44,
    dock: Platform.select({ ios: 56, android: 40, default: 48 }) ?? 48,
  },
  radius: {
    card: 20,
    panel: 16,
    chip: 12,
    hero: 24,
  },
  border: {
    light: 'rgba(255,255,255,0.55)',
    lightHairline: 'rgba(60,60,67,0.10)',
    dark: 'rgba(255,255,255,0.14)',
    darkHairline: 'rgba(84,84,88,0.45)',
  },
  fill: {
    light: 'rgba(255,255,255,0.55)',
    lightElevated: 'rgba(255,255,255,0.78)',
    dark: 'rgba(28,28,30,0.42)',
    darkElevated: 'rgba(44,44,46,0.62)',
  },
  backdrop: {
    light: ['#E8EEF7', '#F4F7FB', '#FFFFFF'] as const,
    dark: ['#0A0C12', '#12151C', '#1C1C1E'] as const,
    lightGlow: 'rgba(0,122,255,0.08)',
    darkGlow: 'rgba(10,132,255,0.12)',
  },
  overlay: {
    lightSheen: ['rgba(255,255,255,0.72)', 'rgba(210,228,255,0.22)', 'rgba(255,255,255,0.38)'] as const,
    darkSheen: ['rgba(120,120,128,0.22)', 'rgba(44,44,46,0.08)', 'rgba(18,18,20,0.28)'] as const,
    specularLight: ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)'] as const,
    specularDark: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)'] as const,
  },
  motion: {
    pressScale: 0.98,
    softPressScale: 0.992,
    duration: {
      fast: 140,
      base: 220,
      slow: 320,
    },
  },
  spacing: {
    screenX: 20,
    screenY: 16,
    section: 24,
    cardPad: 16,
  },
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

export function glassCardShadow(isDark: boolean): ViewStyle {
  return {
    shadowColor: isDark ? '#000000' : '#1C3A5E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.28 : 0.06,
    shadowRadius: 16,
    elevation: Platform.OS === 'android' ? 3 : 0,
  };
}
