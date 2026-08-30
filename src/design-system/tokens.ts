/**
 * Design Tokens — Apple HIG Aligned
 * Typography, color, spacing, and motion derived from Apple Human Interface Guidelines.
 * For the canonical rulebook, see: src/design-system/apple-hig.ts
 *
 * References:
 *   - Apple HIG Dynamic Type: https://developer.apple.com/design/human-interface-guidelines/typography
 *   - UIKit System Colors: iOS 17 dark/light adaptive palette
 */

import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════

export const typography = {
  /**
   * Font Families — SF Pro on iOS (via 'System'), Inter on Android/Web
   */
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Inter-Regular',
      default: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    })!,
    medium: Platform.select({
      ios: 'System',
      android: 'Inter-Medium',
      default: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    })!,
    semibold: Platform.select({
      ios: 'System',
      android: 'Inter-SemiBold',
      default: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    })!,
    bold: Platform.select({
      ios: 'System',
      android: 'Inter-Bold',
      default: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    })!,
  },

  /**
   * Font Scale — Apple HIG Dynamic Type (Default content size category)
   * Reference: https://developer.apple.com/design/human-interface-guidelines/typography
   */
  scale: {
    display: {      // Large Title
      fontSize: 34, lineHeight: 41, letterSpacing: 0.37, fontWeight: '700' as const,
    },
    h1: {           // Title 1
      fontSize: 28, lineHeight: 34, letterSpacing: 0.36, fontWeight: '700' as const,
    },
    h2: {           // Title 2
      fontSize: 22, lineHeight: 28, letterSpacing: 0.35, fontWeight: '700' as const,
    },
    h3: {           // Title 3
      fontSize: 20, lineHeight: 25, letterSpacing: 0.38, fontWeight: '600' as const,
    },
    headline: {     // Headline (semi-bold body)
      fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontWeight: '600' as const,
    },
    body: {         // Body — Apple HIG: 17pt
      fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontWeight: '400' as const,
    },
    bodyEmphasis: { // Body emphasis
      fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontWeight: '500' as const,
    },
    callout: {      // Callout
      fontSize: 16, lineHeight: 21, letterSpacing: -0.32, fontWeight: '400' as const,
    },
    subhead: {      // Subhead
      fontSize: 15, lineHeight: 20, letterSpacing: -0.23, fontWeight: '400' as const,
    },
    caption: {      // Footnote (used as "caption" in app)
      fontSize: 13, lineHeight: 18, letterSpacing: -0.08, fontWeight: '400' as const,
    },
    footnote: {     // Caption 1
      fontSize: 12, lineHeight: 16, letterSpacing: 0,     fontWeight: '400' as const,
    },
    caption2: {     // Caption 2
      fontSize: 11, lineHeight: 13, letterSpacing: 0.06,  fontWeight: '400' as const,
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
