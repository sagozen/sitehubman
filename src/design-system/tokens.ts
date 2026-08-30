/**
 * Design Tokens — Premium SaaS Quality
 * World-class design system foundations
 * Handcrafted with intention, not AI-generated
 */

import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════

export const typography = {
  /**
   * Font Families
   * Using Inter on Android/Web, SF Pro on iOS
   */
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Inter-Regular',
      default: 'Inter, -apple-system, system-ui, sans-serif',
    })!,
    medium: Platform.select({
      ios: 'System',
      android: 'Inter-Medium',
      default: 'Inter, -apple-system, system-ui, sans-serif',
    })!,
    semibold: Platform.select({
      ios: 'System',
      android: 'Inter-SemiBold',
      default: 'Inter, -apple-system, system-ui, sans-serif',
    })!,
    bold: Platform.select({
      ios: 'System',
      android: 'Inter-Bold',
      default: 'Inter, -apple-system, system-ui, sans-serif',
    })!,
  },

  /**
   * Font Scales
   * Precise sizing with proper line heights and letter spacing
   */
  scale: {
    display: {
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.4,
      fontWeight: '700' as const,
    },
    h1: {
      fontSize: 24,
      lineHeight: 31,
      letterSpacing: -0.3,
      fontWeight: '600' as const,
    },
    h2: {
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.2,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: -0.1,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0,
      fontWeight: '400' as const,
    },
    bodyEmphasis: {
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: -0.1,
      fontWeight: '500' as const,
    },
    caption: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0,
      fontWeight: '400' as const,
    },
    footnote: {
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.1,
      fontWeight: '400' as const,
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
  /**
   * Light Mode Palette
   */
  light: {
    // Surfaces
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: '#FAFAFA',
    surfaceSubdued: '#F4F4F5',

    // Text
    ink: '#09090B',
    inkSecondary: '#71717A',
    inkTertiary: '#A1A1AA',
    inkInverse: '#FFFFFF',

    // Borders
    border: 'rgba(0,0,0,0.06)',
    borderStrong: 'rgba(0,0,0,0.12)',
    borderSubtle: 'rgba(0,0,0,0.03)',

    // Primary
    primary: '#0A84FF',
    primarySoft: 'rgba(10,132,255,0.1)',
    primaryDark: '#0066CC',
    primaryText: '#0066CC',

    // Status
    success: '#30D158',
    successSoft: 'rgba(48,209,88,0.12)',
    successDark: '#248A3D',
    successText: '#248A3D',

    warning: '#FF9F0A',
    warningSoft: 'rgba(255,159,10,0.12)',
    warningDark: '#C93400',
    warningText: '#C93400',

    error: '#FF453A',
    errorSoft: 'rgba(255,69,58,0.1)',
    errorDark: '#D70015',
    errorText: '#D70015',

    info: '#0A84FF',
    infoSoft: 'rgba(10,132,255,0.1)',
    infoDark: '#0066CC',
    infoText: '#0066CC',

    // Interactive
    hover: 'rgba(0,0,0,0.04)',
    pressed: 'rgba(0,0,0,0.08)',
    focus: '#0A84FF',
    disabled: '#A1A1AA',
  },

  /**
   * Dark Mode Palette
   */
  dark: {
    // Surfaces
    background: '#09090B',
    surface: '#18181B',
    surfaceElevated: '#27272A',
    surfaceSubdued: '#0F0F12',

    // Text
    ink: '#FAFAFA',
    inkSecondary: '#A1A1AA',
    inkTertiary: '#71717A',
    inkInverse: '#09090B',

    // Borders
    border: 'rgba(255,255,255,0.1)',
    borderStrong: 'rgba(255,255,255,0.18)',
    borderSubtle: 'rgba(255,255,255,0.05)',

    // Primary
    primary: '#0A84FF',
    primarySoft: 'rgba(10,132,255,0.15)',
    primaryDark: '#66B3FF',
    primaryText: '#66B3FF',

    // Status
    success: '#30D158',
    successSoft: 'rgba(48,209,88,0.15)',
    successDark: '#5DD87C',
    successText: '#5DD87C',

    warning: '#FF9F0A',
    warningSoft: 'rgba(255,159,10,0.15)',
    warningDark: '#FFB340',
    warningText: '#FFB340',

    error: '#FF453A',
    errorSoft: 'rgba(255,69,58,0.15)',
    errorDark: '#FF6961',
    errorText: '#FF6961',

    info: '#0A84FF',
    infoSoft: 'rgba(10,132,255,0.15)',
    infoDark: '#66B3FF',
    infoText: '#66B3FF',

    // Interactive
    hover: 'rgba(255,255,255,0.06)',
    pressed: 'rgba(255,255,255,0.1)',
    focus: '#0A84FF',
    disabled: '#52525B',
  },

  /**
   * Semantic Role Colors
   */
  roles: {
    sales: '#10B981',
    salesSoft: 'rgba(16,185,129,0.12)',
    production: '#F59E0B',
    productionSoft: 'rgba(245,158,11,0.12)',
    admin: '#8B5CF6',
    adminSoft: 'rgba(139,92,246,0.12)',
    customer: '#0EA5E9',
    customerSoft: 'rgba(14,165,233,0.12)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING SCALE (8pt Grid System)
// ═══════════════════════════════════════════════════════════════════════════

export const spacing = {
  0: 0,
  1: 4,   // 0.5 × base
  2: 8,   // 1 × base
  3: 12,  // 1.5 × base
  4: 16,  // 2 × base
  5: 20,  // 2.5 × base
  6: 24,  // 3 × base
  7: 28,  // 3.5 × base
  8: 32,  // 4 × base
  10: 40, // 5 × base
  12: 48, // 6 × base
  14: 56, // 7 × base
  16: 64, // 8 × base
  20: 80, // 10 × base
  24: 96, // 12 × base
  30: 120, // 15 × base
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════════════

export const radius = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  xxxl: 20,
  full: 9999,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS (Subtle, Intentional Elevation)
// ═══════════════════════════════════════════════════════════════════════════

export const shadows = {
  /**
   * No shadow — use border instead
   */
  none: Platform.select({
    ios: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: { elevation: 0 },
    default: { boxShadow: 'none' },
  })!,

  /**
   * Level 1 — Subtle lift
   * Use for cards on colored backgrounds
   */
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  })!,

  /**
   * Level 2 — Standard elevation
   * Use for elevated cards and modals
   */
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: { boxShadow: '0 4px 6px rgba(0,0,0,0.07)' },
  })!,

  /**
   * Level 3 — Floating
   * Use for dropdowns, popovers, floating action buttons
   */
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
    },
    android: { elevation: 6 },
    default: { boxShadow: '0 10px 15px rgba(0,0,0,0.1)' },
  })!,

  /**
   * Level 4 — Modal overlay
   * Use for modal dialogs and sheets
   */
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.15,
      shadowRadius: 25,
    },
    android: { elevation: 10 },
    default: { boxShadow: '0 20px 25px rgba(0,0,0,0.15)' },
  })!,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ICON SIZES
// ═══════════════════════════════════════════════════════════════════════════

export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CONTROL HEIGHTS (Buttons, Inputs, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export const controlHeight = {
  sm: 36,
  md: 44,
  lg: 52,
  xl: 60,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION PRESETS
// ═══════════════════════════════════════════════════════════════════════════

export const animation = {
  /**
   * Duration (in milliseconds)
   */
  duration: {
    instant: 0,
    fast: 150,
    base: 220,
    slow: 320,
    slower: 450,
  },

  /**
   * Easing Functions
   */
  easing: {
    standard: [0.4, 0, 0.2, 1] as const,
    decelerate: [0, 0, 0.2, 1] as const,
    accelerate: [0.4, 0, 1, 1] as const,
    sharp: [0.4, 0, 0.6, 1] as const,
  },

  /**
   * Spring Configuration (for Reanimated)
   */
  spring: {
    gentle: {
      damping: 20,
      stiffness: 180,
      mass: 1,
    },
    snappy: {
      damping: 15,
      stiffness: 300,
      mass: 0.8,
    },
    bouncy: {
      damping: 10,
      stiffness: 250,
      mass: 1,
    },
  },

  /**
   * Common Values
   */
  scale: {
    pressed: 0.98,
    pressedSoft: 0.985,
    tap: 0.96,
  },

  opacity: {
    pressed: 0.9,
    disabled: 0.4,
    subtle: 0.6,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Z-INDEX LAYERS
// ═══════════════════════════════════════════════════════════════════════════

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINTS (for responsive web)
// ═══════════════════════════════════════════════════════════════════════════

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL TOKENS
// ═══════════════════════════════════════════════════════════════════════════

export const tokens = {
  typography,
  colors,
  spacing,
  radius,
  shadows,
  iconSize,
  controlHeight,
  animation,
  zIndex,
  breakpoints,
} as const;

export type DesignTokens = typeof tokens;
