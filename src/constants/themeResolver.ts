import type { ColorSchemeName } from 'react-native';
import type { ProfileTheme, TypographyColorKey, UiPreferences } from '@/src/types/models';
import type { ThemeMode } from '@/src/constants/theme';
import { iosPalette } from '@/src/design-system/ios';

export type ColorModePreference = UiPreferences['colorMode'];
export type ResolvedThemeMode = ThemeMode;

export interface ResolvedAppColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSoft: string;
  surfaceGlass: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  separator: string;
  systemBlue: string;
  typographyColor: string;
  // Enhanced color properties for better visual hierarchy
  elevation1: string;
  elevation2: string;
  elevation3: string;
  elevation4: string;
  label: string;
  link: string;
}

interface ProfilePalette {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  light: {
    background: string;
    surface: string;
    surfaceElevated: string;
    surfaceSoft: string;
    textPrimary: string;
    textMuted: string;
    textTertiary: string;
    border: string;
    separator: string;
    surfaceGlass: string;
    systemBlue: string;
    elevation1: string;
    elevation2: string;
    elevation3: string;
    elevation4: string;
    label: string;
    link: string;
  };
  dark: {
    background: string;
    surface: string;
    surfaceElevated: string;
    surfaceSoft: string;
    textPrimary: string;
    textMuted: string;
    textTertiary: string;
    border: string;
    separator: string;
    surfaceGlass: string;
    systemBlue: string;
    elevation1: string;
    elevation2: string;
    elevation3: string;
    elevation4: string;
    label: string;
    link: string;
  };
}

function modeTokens(mode: typeof iosPalette.light | typeof iosPalette.dark) {
  return {
    background: mode.background,
    surface: mode.surface,
    surfaceElevated: mode.surfaceElevated,
    surfaceSoft: mode.surfaceSoft,
    textPrimary: mode.textPrimary,
    textMuted: mode.textSecondary,
    textTertiary: mode.textTertiary,
    border: mode.border,
    separator: mode.separator,
    surfaceGlass: mode.surfaceGlass,
    systemBlue: mode.systemBlue,
    elevation1: mode.elevation1,
    elevation2: mode.elevation2,
    elevation3: mode.elevation3,
    elevation4: mode.elevation4,
    label: mode.label,
    link: mode.link,
  };
}

const profilePalettes: Record<ProfileTheme, ProfilePalette> = {
  aqua: {
    primary: iosPalette.light.systemBlue,
    primaryDark: '#0051D5',
    primarySoft: 'rgba(0,122,255,0.12)',
    accent: iosPalette.light.systemBlue,
    light: {
      background: iosPalette.light.background,
      surface: iosPalette.light.surface,
      surfaceElevated: iosPalette.light.surfaceElevated,
      surfaceSoft: iosPalette.light.surfaceSoft,
      textPrimary: iosPalette.light.textPrimary,
      textMuted: iosPalette.light.textSecondary,
      textTertiary: iosPalette.light.textTertiary,
      border: iosPalette.light.border,
      separator: iosPalette.light.separator,
      surfaceGlass: 'rgba(255,255,255,0.82)',
      systemBlue: iosPalette.light.systemBlue,
      elevation1: iosPalette.light.elevation1,
      elevation2: iosPalette.light.elevation2,
      elevation3: iosPalette.light.elevation3,
      elevation4: iosPalette.light.elevation4,
      label: '#6E6E73',
      link: '#007AFF',
    },
    dark: modeTokens(iosPalette.dark),
  },
  mono: {
    primary: '#000000',
    primaryDark: '#000000',
    primarySoft: 'rgba(0,0,0,0.08)',
    accent: '#000000',
    light: {
      background: '#F5F5F7',
      surface: '#FFFFFF',
      surfaceElevated: '#F2F2F7',
      surfaceSoft: '#F2F2F7',
      textPrimary: '#000000',
      textMuted: '#6E6E73',
      textTertiary: 'rgba(60,60,67,0.30)',
      border: 'rgba(60,60,67,0.08)',
      separator: 'rgba(60,60,67,0.29)',
      surfaceGlass: iosPalette.light.surfaceGlass,
      systemBlue: iosPalette.light.systemBlue,
      elevation1: 'rgba(0,0,0,0.05)',
      elevation2: 'rgba(0,0,0,0.08)',
      elevation3: 'rgba(0,0,0,0.11)',
      elevation4: 'rgba(0,0,0,0.14)',
      label: '#6E6E73',
      link: '#007AFF',
    },
    dark: {
      background: '#000000',
      surface: '#1C1C1E',
      surfaceElevated: '#2C2C2E',
      surfaceSoft: '#2C2C2E',
      textPrimary: '#FFFFFF',
      textMuted: 'rgba(235,235,245,0.60)',
      textTertiary: 'rgba(235,235,245,0.30)',
      border: 'rgba(84,84,88,0.65)',
      separator: 'rgba(84,84,88,0.65)',
      surfaceGlass: iosPalette.dark.surfaceGlass,
      systemBlue: iosPalette.dark.systemBlue,
      elevation1: 'rgba(255,255,255,0.05)',
      elevation2: 'rgba(255,255,255,0.08)',
      elevation3: 'rgba(255,255,255,0.11)',
      elevation4: 'rgba(255,255,255,0.14)',
      label: 'rgba(235,235,245,0.6)',
      link: '#5AC8FA',
    },
  },
  // Enhanced profile themes for more visual variety
  system: {
    primary: iosPalette.light.systemBlue,
    primaryDark: '#0051D5',
    primarySoft: 'rgba(0,122,255,0.12)',
    accent: iosPalette.light.systemBlue,
    light: {
      background: iosPalette.light.background,
      surface: iosPalette.light.surface,
      surfaceElevated: iosPalette.light.surfaceElevated,
      surfaceSoft: iosPalette.light.surfaceSoft,
      textPrimary: iosPalette.light.textPrimary,
      textMuted: iosPalette.light.textSecondary,
      textTertiary: iosPalette.light.textTertiary,
      border: iosPalette.light.border,
      separator: iosPalette.light.separator,
      surfaceGlass: 'rgba(255,255,255,0.82)',
      systemBlue: iosPalette.light.systemBlue,
      elevation1: iosPalette.light.elevation1,
      elevation2: iosPalette.light.elevation2,
      elevation3: iosPalette.light.elevation3,
      elevation4: iosPalette.light.elevation4,
      label: '#6E6E73',
      link: '#007AFF',
    },
    dark: modeTokens(iosPalette.dark),
  },
  gaming: {
    primary: '#FF2D55',
    primaryDark: '#E6004A',
    primarySoft: 'rgba(255,45,85,0.12)',
    accent: '#FF2D55',
    light: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceElevated: '#F8F9FA',
      surfaceSoft: '#F8F9FA',
      textPrimary: '#1C1C1E',
      textMuted: '#6E6E73',
      textTertiary: 'rgba(60,60,67,0.30)',
      border: 'rgba(60,60,67,0.12)',
      separator: 'rgba(60,60,67,0.18)',
      surfaceGlass: 'rgba(255,255,255,0.82)',
      systemBlue: '#FF2D55',
      elevation1: 'rgba(255,45,85,0.05)',
      elevation2: 'rgba(255,45,85,0.08)',
      elevation3: 'rgba(255,45,85,0.11)',
      elevation4: 'rgba(255,45,85,0.14)',
      label: '#6E6E73',
      link: '#FF2D55',
    },
    dark: {
      background: '#0A0C12',
      surface: '#1C1C1E',
      surfaceElevated: '#2C2C2E',
      surfaceSoft: '#2C2C2E',
      textPrimary: '#FFFFFF',
      textMuted: 'rgba(235,235,245,0.60)',
      textTertiary: 'rgba(235,235,245,0.30)',
      border: 'rgba(84,84,88,0.65)',
      separator: 'rgba(84,84,88,0.65)',
      surfaceGlass: 'rgba(28,28,30,0.92)',
      systemBlue: '#FF2D55',
      elevation1: 'rgba(255,45,85,0.05)',
      elevation2: 'rgba(255,45,85,0.08)',
      elevation3: 'rgba(255,45,85,0.11)',
      elevation4: 'rgba(255,45,85,0.14)',
      label: 'rgba(235,235,245,0.6)',
      link: '#FF6B81',
    },
  },
  productivity: {
    primary: '#34C759',
    primaryDark: '#28A745',
    primarySoft: 'rgba(52,199,89,0.12)',
    accent: '#34C759',
    light: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceElevated: '#F8F9FA',
      surfaceSoft: '#F8F9FA',
      textPrimary: '#1C1C1E',
      textMuted: '#6E6E73',
      textTertiary: 'rgba(60,60,67,0.30)',
      border: 'rgba(60,60,67,0.12)',
      separator: 'rgba(60,60,67,0.18)',
      surfaceGlass: 'rgba(255,255,255,0.82)',
      systemBlue: '#34C759',
      elevation1: 'rgba(52,199,89,0.05)',
      elevation2: 'rgba(52,199,89,0.08)',
      elevation3: 'rgba(52,199,89,0.11)',
      elevation4: 'rgba(52,199,89,0.14)',
      label: '#6E6E73',
      link: '#34C759',
    },
    dark: {
      background: '#0A0C12',
      surface: '#1C1C1E',
      surfaceElevated: '#2C2C2E',
      surfaceSoft: '#2C2C2E',
      textPrimary: '#FFFFFF',
      textMuted: 'rgba(235,235,245,0.60)',
      textTertiary: 'rgba(235,235,245,0.30)',
      border: 'rgba(84,84,88,0.65)',
      separator: 'rgba(84,84,88,0.65)',
      surfaceGlass: 'rgba(28,28,30,0.92)',
      systemBlue: '#34C759',
      elevation1: 'rgba(52,199,89,0.05)',
      elevation2: 'rgba(52,199,89,0.08)',
      elevation3: 'rgba(52,199,89,0.11)',
      elevation4: 'rgba(52,199,89,0.14)',
      label: 'rgba(235,235,245,0.6)',
      link: '#4DE680',
    },
  },
};

export const typographyColorMap: Record<TypographyColorKey, { label: string; color: string }> = {
  deep_teal: { label: 'Default', color: iosPalette.light.textPrimary },
  ocean_blue: { label: 'Ocean Blue', color: '#0C4A6E' },
  forest: { label: 'Forest', color: '#14532D' },
  slate: { label: 'Slate', color: '#334155' },
  indigo: { label: 'Indigo', color: '#3730A3' },
  violet: { label: 'Violet', color: '#5B21B6' },
  rose: { label: 'Rose', color: '#9F1239' },
  amber: { label: 'Amber', color: '#92400E' },
  charcoal: { label: 'Charcoal', color: '#1F2937' },
  midnight: { label: 'Midnight', color: '#0B1220' },
  // Enhanced typography options for more personality
  sky_blue: { label: 'Sky Blue', color: '#5AC8FA' },
  sunflower: { label: 'Sunflower', color: '#FFC107' },
  rose_pink: { label: 'Rose Pink', color: '#FF6B9D' },
  mint_green: { label: 'Mint Green', color: '#4ECDC4' },
  lavender: { label: 'Lavender', color: '#9D8DFF' },
};

export function getTypographyColor(key?: TypographyColorKey, isDark = false): string {
  if (isDark) return iosPalette.dark.textPrimary;
  if (!key) return typographyColorMap.deep_teal.color;
  return typographyColorMap[key]?.color ?? typographyColorMap.deep_teal.color;
}

const typographyColorKeys = Object.keys(typographyColorMap) as TypographyColorKey[];
const profileThemeKeys: ProfileTheme[] = ['aqua', 'mono', 'system', 'gaming', 'productivity'];
const colorModePreferences: ColorModePreference[] = ['light', 'dark', 'system'];

function resolveColorMode(
  raw: Partial<UiPreferences> & Record<string, unknown> | null | undefined
): ColorModePreference {
  const mode = raw?.colorMode;
  if (typeof mode === 'string' && colorModePreferences.includes(mode as ColorModePreference)) {
    return mode as ColorModePreference;
  }
  return 'light';
}

export function resolveThemeMode(
  preference: ColorModePreference,
  systemScheme: ColorSchemeName | null | undefined
): ResolvedThemeMode {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

function resolveTypographyColor(raw: Partial<UiPreferences> | null | undefined): TypographyColorKey {
  const legacy = raw as (Partial<UiPreferences> & { textColor?: TypographyColorKey }) | null | undefined;
  const key = raw?.typographyColor ?? legacy?.textColor;
  if (key && typographyColorKeys.includes(key as TypographyColorKey)) {
    return key as TypographyColorKey;
  }
  return 'deep_teal';
}

function resolveProfileTheme(raw: Partial<UiPreferences> | null | undefined): ProfileTheme {
  const key = raw?.profileTheme as string | undefined;
  if (key === 'whatsapp') return 'aqua';
  if (key && profileThemeKeys.includes(key as ProfileTheme)) {
    return key as ProfileTheme;
  }
  return mapLegacyProfileTheme(raw?.theme);
}

export function normalizeUiPreferences(raw: Partial<UiPreferences> | null | undefined): UiPreferences {
  const extended = raw as (Partial<UiPreferences> & Record<string, unknown>) | null | undefined;
  const profileTheme = resolveProfileTheme(raw);
  const colorMode = resolveColorMode(extended);
  const typographyColor = resolveTypographyColor(raw);

  return {
    language: raw?.language ?? 'en',
    theme: raw?.theme ?? 'vibrant_pink',
    profileTheme,
    colorMode,
    typographyColor,
    primaryCardId: raw?.primaryCardId,
  };
}

function mapLegacyProfileTheme(bioTheme?: UiPreferences['theme']): ProfileTheme {
  void bioTheme;
  return 'aqua';
}

export function resolveAppColors(
  preferences: UiPreferences,
  resolvedMode: ResolvedThemeMode = resolveThemeMode(preferences.colorMode, null)
): ResolvedAppColors {
  const palette = profilePalettes[preferences.profileTheme] ?? profilePalettes.aqua;
  const isDark = resolvedMode === 'dark';
  const mode = isDark ? palette.dark : palette.light;
  const typographyColor = getTypographyColor(preferences.typographyColor, isDark);

  return {
    background: mode.background,
    surface: mode.surface,
    surfaceElevated: mode.surfaceElevated,
    surfaceSoft: mode.surfaceSoft,
    surfaceGlass: mode.surfaceGlass,
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    primarySoft: palette.primarySoft,
    accent: palette.accent,
    textPrimary: mode.textPrimary,
    textMuted: mode.textMuted,
    textTertiary: mode.textTertiary,
    textInverse: isDark ? '#000000' : '#FFFFFF',
    border: mode.border,
    separator: mode.separator,
    systemBlue: mode.systemBlue,
    typographyColor,
    elevation1: mode.elevation1,
    elevation2: mode.elevation2,
    elevation3: mode.elevation3,
    elevation4: mode.elevation4,
    label: mode.label,
    link: mode.link,
  };
}

export function getStatusBarStyle(resolvedMode: ResolvedThemeMode): 'light' | 'dark' {
  return resolvedMode === 'dark' ? 'light' : 'dark';
}