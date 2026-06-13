import { TextStyle, ViewStyle } from 'react-native';
import type { UserRole } from '@/src/types/models';
import { iosDesign, iosFonts, iosPalette, iosTypography, premiumPalette, rolePalettes } from '@/src/design-system/ios';

export type TextVariant = 'display' | 'h1' | 'h2' | 'body' | 'caption';
export type ThemeMode = 'light' | 'dark';
export type RoleThemeKey = 'default' | 'sales' | 'printer' | 'admin';

export interface RoleTheme {
  key: RoleThemeKey;
  primary: string;
  primaryDark: string;
  soft: string;
  background: string;
  surface: string;
  accent: string;
  alert: string;
  text: string;
  muted: string;
}

interface ColorModeTokens {
  background: string;
  surface: string;
  textPrimary: string;
  textMuted: string;
  border: string;
}

export const theme = {
  colors: {
    background: iosPalette.light.background,
    surface: iosPalette.light.surface,
    surfaceSoft: iosPalette.light.surfaceSoft,
    surfaceGlass: iosPalette.light.surfaceGlass,
    primary: iosPalette.light.primary,
    primarySoft: iosPalette.light.primarySoft,
    primaryDark: iosPalette.light.primaryDark,
    secondary: iosPalette.light.textSecondary,
    accent: iosPalette.light.primary,
    textPrimary: iosPalette.light.textPrimary,
    textMuted: iosPalette.light.textSecondary,
    textInverse: '#FFFFFF',
    border: iosPalette.light.border,
    iconInactive: iosPalette.light.iconInactive,
    charcoal: iosPalette.light.charcoal,
    warning: '#FF9500',
    danger: '#FF3B30',
    success: premiumPalette.accent,
    info: premiumPalette.systemBlue,
    pending: iosPalette.light.iconInactive,
  },
  spacing: iosDesign.spacing,
  radius: iosDesign.radius,
  iconSize: iosDesign.iconSize,
  avatarSize: iosDesign.avatarSize,
  controlHeight: iosDesign.controlHeight,
  shadows: {
    card: iosDesign.shadows.card satisfies ViewStyle,
    floating: iosDesign.shadows.floating satisfies ViewStyle,
    control: iosDesign.shadows.control satisfies ViewStyle,
  },
  status: {
    success: premiumPalette.accent,
    active: premiumPalette.systemBlue,
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    pending: iosPalette.light.iconInactive,
    neutral: iosPalette.light.iconInactive,
  },
  statusTint: {
    success: 'rgba(48,209,88,0.12)',
    active: 'rgba(0,122,255,0.10)',
    warning: 'rgba(255,149,0,0.12)',
    error: 'rgba(255,59,48,0.10)',
    info: 'rgba(0,122,255,0.10)',
    pending: '#F2F2F7',
    neutral: '#F2F2F7',
    role: '#F2F2F7',
  },
  statusText: {
    success: '#248A3D',
    active: premiumPalette.systemBlue,
    warning: '#C93400',
    error: '#D70015',
    info: '#007AFF',
    pending: '#6E6E73',
    neutral: '#6E6E73',
    role: '#6E6E73',
  },
  roles: {
    default: {
      key: 'default',
      primary: rolePalettes.default.primary,
      primaryDark: rolePalettes.default.primaryDark,
      soft: rolePalettes.default.soft,
      background: iosPalette.light.background,
      surface: iosPalette.light.surface,
      accent: rolePalettes.default.primary,
      alert: '#FF3B30',
      text: iosPalette.light.textPrimary,
      muted: iosPalette.light.textSecondary,
    },
    sales: {
      key: 'sales',
      primary: rolePalettes.sales.primary,
      primaryDark: rolePalettes.sales.primaryDark,
      soft: rolePalettes.sales.soft,
      background: iosPalette.light.background,
      surface: iosPalette.light.surface,
      accent: rolePalettes.sales.primary,
      alert: '#FF3B30',
      text: iosPalette.light.textPrimary,
      muted: iosPalette.light.textSecondary,
    },
    printer: {
      key: 'printer',
      primary: rolePalettes.printer.primary,
      primaryDark: rolePalettes.printer.primaryDark,
      soft: rolePalettes.printer.soft,
      background: iosPalette.light.background,
      surface: iosPalette.light.surface,
      accent: rolePalettes.printer.primary,
      alert: '#FF9500',
      text: iosPalette.light.textPrimary,
      muted: iosPalette.light.textSecondary,
    },
    admin: {
      key: 'admin',
      primary: rolePalettes.admin.primary,
      primaryDark: rolePalettes.admin.primaryDark,
      soft: rolePalettes.admin.soft,
      background: iosPalette.light.background,
      surface: iosPalette.light.surface,
      accent: rolePalettes.admin.primary,
      alert: '#FF3B30',
      text: iosPalette.light.textPrimary,
      muted: iosPalette.light.textSecondary,
    },
  } satisfies Record<RoleThemeKey, RoleTheme>,
  modes: {
    light: {
      background: iosPalette.light.background,
      surface: iosPalette.light.surface,
      textPrimary: iosPalette.light.textPrimary,
      textMuted: iosPalette.light.textSecondary,
      border: iosPalette.light.border,
    },
    dark: {
      background: iosPalette.dark.background,
      surface: iosPalette.dark.surface,
      textPrimary: iosPalette.dark.textPrimary,
      textMuted: iosPalette.dark.textSecondary,
      border: iosPalette.dark.separator,
    },
  } satisfies Record<ThemeMode, ColorModeTokens>,
  typography: {
    fontFamily: iosFonts.regular,
    fontFamilyRegular: iosFonts.regular,
    fontFamilyMedium: iosFonts.medium,
    fontFamilySemiBold: iosFonts.semibold,
    fontFamilyBold: iosFonts.bold,
    fontFamilyExtraBold: iosFonts.extrabold,
    fontFamilyBlack: iosFonts.black,
    variants: {
      display: {
        ...iosTypography.display,
        color: iosPalette.light.textPrimary,
      } satisfies TextStyle,
      h1: {
        ...iosTypography.h1,
        color: iosPalette.light.textPrimary,
      } satisfies TextStyle,
      h2: {
        ...iosTypography.h2,
        color: iosPalette.light.textPrimary,
      } satisfies TextStyle,
      body: {
        ...iosTypography.body,
        color: iosPalette.light.textPrimary,
      } satisfies TextStyle,
      caption: {
        ...iosTypography.caption,
        color: iosPalette.light.textSecondary,
      } satisfies TextStyle,
    } satisfies Record<TextVariant, TextStyle>,
  },
} as const;

export type AppTheme = typeof theme;

export function getRoleTheme(role?: UserRole | RoleThemeKey | null): RoleTheme {
  if (role === 'sales') return theme.roles.sales;
  if (role === 'printer') return theme.roles.printer;
  if (role === 'admin' || role === 'super_admin') return theme.roles.admin;
  if (role === 'default') return theme.roles.default;
  return theme.roles.default;
}
