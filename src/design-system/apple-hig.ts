/**
 * Apple Human Interface Guidelines — Canonical Design Rulebook
 *
 * This file is the SINGLE source of truth for all Apple HIG rules in this app.
 * Every component and screen MUST use these tokens instead of hardcoded values.
 *
 * References:
 *   - https://developer.apple.com/design/human-interface-guidelines/
 *   - Apple UIKit System Colors (iOS 17)
 *   - Apple Dynamic Type sizes (UIFontTextStyle)
 */
import { Platform } from 'react-native';

// ─── COLORS ─────────────────────────────────────────────────────────────────
// Exact Apple UIKit system colors. Dark/light adaptive.

export const appleColors = {
  dark: {
    // System Backgrounds (monochrome palette)
    background:          '#000000',   // monochromeBlack
    backgroundSecondary: '#1a1a1a',   // monochromeDarkSurface
    backgroundTertiary:  '#2a2a2a',   // monochromeSurfaceVariant
    groupedBackground:   '#000000',   // monochromeBlack
    groupedSecondary:    '#1a1a1a',   // monochromeDarkSurface
    groupedTertiary:     '#2a2a2a',   // monochromeSurfaceVariant

    // Labels (monochromeText hierarchy)
    label:            '#ffffff',                    // monochromeTextPrimary
    labelSecondary:   '#b3b3b3',                    // monochromeTextSecondary
    labelTertiary:    '#808080',                    // monochromeTextMuted
    labelQuaternary:  '#808080',                    // monochromeTextMuted
    placeholderText:  '#808080',                    // monochromeTextMuted

    // Fills (used for controls, not backgrounds)
    fillPrimary:      'rgba(255,255,255,0.12)',     // systemFill
    fillSecondary:    'rgba(255,255,255,0.08)',     // secondarySystemFill
    fillTertiary:     'rgba(255,255,255,0.05)',     // tertiarySystemFill
    fillQuaternary:   'rgba(255,255,255,0.03)',     // quaternarySystemFill

    // Separators (monochromeBorder)
    separator:        '#3a3a3a',                   // monochromeBorder
    opaqueSeparator:  '#3a3a3a',                   // monochromeBorder

    // System Tints (spotifyGreen accent)
    blue:    '#1DB954',  // spotifyGreen
    green:   '#1DB954',  // spotifyGreen
    indigo:  '#5E5CE6',  // systemIndigo
    orange:  '#FF9F0A',  // systemOrange
    pink:    '#FF375F',  // systemPink
    purple:  '#BF5AF2',  // systemPurple
    red:     '#ff4444',  // error
    teal:    '#1DB954',  // spotifyGreen
    yellow:  '#FFD60A',  // systemYellow
    gray:    '#808080',  // monochromeTextMuted
    gray2:   '#b3b3b3',  // monochromeTextSecondary
    gray3:   '#3a3a3a',  // monochromeBorder
    gray4:   '#2a2a2a',  // monochromeSurfaceVariant
    gray5:   '#1a1a1a',  // monochromeDarkSurface
    gray6:   '#000000',  // monochromeBlack

    // Semantic (resolved)
    tint:        '#1DB954',  // spotifyGreen
    link:        '#1DB954',
    destructive: '#ff4444',  // error
    success:     '#1DB954',  // spotifyGreen
    warning:     '#FF9F0A',
  },
  light: {
    background:       '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    backgroundTertiary:  '#FFFFFF',
    groupedBackground:   '#F2F2F7',
    groupedSecondary:    '#FFFFFF',
    groupedTertiary:     '#F2F2F7',

    label:            '#000000',
    labelSecondary:   'rgba(60,60,67,0.60)',
    labelTertiary:    'rgba(60,60,67,0.30)',
    labelQuaternary:  'rgba(60,60,67,0.18)',
    placeholderText:  'rgba(60,60,67,0.30)',

    fillPrimary:      'rgba(120,120,128,0.20)',
    fillSecondary:    'rgba(120,120,128,0.16)',
    fillTertiary:     'rgba(118,118,128,0.12)',
    fillQuaternary:   'rgba(118,118,128,0.08)',

    separator:        'rgba(60,60,67,0.29)',
    opaqueSeparator:  '#C6C6C8',

    blue:    '#007AFF',
    green:   '#34C759',
    indigo:  '#5856D6',
    orange:  '#FF9500',
    pink:    '#FF2D55',
    purple:  '#AF52DE',
    red:     '#FF3B30',
    teal:    '#5AC8FA',
    yellow:  '#FFCC00',
    gray:    '#8E8E93',
    gray2:   '#AEAEB2',
    gray3:   '#C7C7CC',
    gray4:   '#D1D1D6',
    gray5:   '#E5E5EA',
    gray6:   '#F2F2F7',

    tint:       '#007AFF',
    link:       '#007AFF',
    destructive:'#FF3B30',
    success:    '#34C759',
    warning:    '#FF9500',
  },
} as const;

// ─── TYPOGRAPHY ─────────────────────────────────────────────────────────────
// Apple HIG Dynamic Type — UIFontTextStyle scale
// All sizes are the "Default" (xL content size category) values

export const appleType = {
  // San Francisco font stack
  font: Platform.select({
    ios:     'System',          // Maps to SF Pro automatically on iOS
    android: 'sans-serif',
    default: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
  })!,

  // Scale — matches Apple HIG Dynamic Type specification exactly
  scale: {
    largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const, letterSpacing:  0.37  },
    title1:     { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing:  0.36  },
    title2:     { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing:  0.35  },
    title3:     { fontSize: 20, lineHeight: 25, fontWeight: '600' as const, letterSpacing:  0.38  },
    headline:   { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.41  },
    body:       { fontSize: 17, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.41  },
    callout:    { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, letterSpacing: -0.32  },
    subhead:    { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.23  },
    footnote:   { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: -0.08  },
    caption1:   { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing:  0     },
    caption2:   { fontSize: 11, lineHeight: 13, fontWeight: '400' as const, letterSpacing:  0.06  },
  },
} as const;

export type AppleTypeScale = keyof typeof appleType.scale;

// ─── SPACING ─────────────────────────────────────────────────────────────────
// 4pt base grid. All spacing must be a multiple of 4.

export const appleSpacing = {
  xs:      4,   // 4px (xs)
  sm:      8,   // 8px (sm)
  md:     16,   // 16px (md)
  lg:     24,   // 24px (lg)
  xl:     32,   // 32px (xl)
  xxs:     4,
  xxl:    32,
  xxxl:   40,
  section: 48,
  // Named semantic spacings
  screenH: 16,  // Standard horizontal padding on any screen
  rowH:    16,  // Left padding inside a list row
  cardPad: 16,  // Padding inside a card
  stackGap: 8,  // Gap between stacked UI elements
} as const;

// ─── BORDER RADIUS ───────────────────────────────────────────────────────────
// Border Radii: 4px (small), 8px (medium), 12px (large), 9999px (circular/pill buttons)

export const appleRadius = {
  small:    4,   // 4px (small)
  medium:   8,   // 8px (medium)
  large:   12,   // 12px (large)
  circular: 9999, // 9999px (circular/pill buttons)
  pill:    9999,
  xs:       4,
  sm:       4,
  md:       8,
  lg:      12,
  xl:      12,
  xxl:     12,
  full:  9999,
} as const;

// ─── CONTROL SIZES ───────────────────────────────────────────────────────────
// Apple HIG: minimum interactive element = 44×44pt.

export const appleControl = {
  hitTarget:   44,  // Minimum tap target (Apple HIG requirement)
  inputHeight: 44,  // Text inputs
  buttonSm:    32,  // Small buttons (non-primary)
  buttonMd:    44,  // Standard buttons
  buttonLg:    52,  // Large / primary CTA buttons
  buttonCTA:   56,  // Full-width bottom CTA
  navBar:      44,  // Navigation bar height (compact)
  tabBar:      49,  // Tab bar height (+ safe area bottom)
  tabBarIcon:  24,  // Tab bar icon size
  tabBarLabel: 10,  // Tab bar label font size
} as const;

// ─── MOTION ──────────────────────────────────────────────────────────────────
// Apple-feel spring and timing presets.

export const appleMotion = {
  // Durations
  instant:  0,
  quick:    150,  // Fast feedback (button press in)
  base:     220,  // Standard interaction
  slow:     350,  // Screen transitions

  // Press feedback (applied to all interactive elements)
  pressScale:   0.97,   // Scale on press-in
  pressOpacity: 0.88,   // Opacity on press-in
  disabledOpacity: 0.40, // Disabled state

  // Spring configs (pass to withSpring)
  spring: {
    gentle:  { damping: 20, stiffness: 150, mass: 1 },   // Standard
    snappy:  { damping: 15, stiffness: 300, mass: 0.8 },  // Button release
    bouncy:  { damping: 10, stiffness: 250, mass: 1 },    // Celebratory
  },
} as const;

// ─── HAPTICS ─────────────────────────────────────────────────────────────────
// Rule: every interactive element must use one of these.

export const appleHapticRule = {
  // Use for: navigation, selection, scroll snap
  navigation: 'light',
  // Use for: confirm, submit, toggle
  confirm:    'medium',
  // Use for: destructive actions, errors, alarms
  destructive:'heavy',
  // Use for: success feedback
  success:    'success',
  // Use for: errors
  error:      'error',
} as const;

// ─── ACCESSIBILITY ───────────────────────────────────────────────────────────

export const appleA11y = {
  // Every icon-only button MUST have an accessibilityLabel
  iconButtonLabel: 'Required',
  // All interactive elements MUST have accessibilityRole
  interactiveRole: 'Required',
  // Dynamic Type: allow font scaling up to this multiplier
  maxFontSizeMultiplier: 1.4,
  // Minimum contrast ratio (WCAG AA)
  minContrastRatio: 4.5,
} as const;

// ─── CANONICAL EXPORT ────────────────────────────────────────────────────────
// This is THE rulebook. Import { appleHIG } wherever you need Apple HIG tokens.

export const appleHIG = {
  colors:   appleColors,
  type:     appleType,
  spacing:  appleSpacing,
  radius:   appleRadius,
  control:  appleControl,
  motion:   appleMotion,
  haptic:   appleHapticRule,
  a11y:     appleA11y,

  // Convenience resolver — call with isDark boolean
  c: (isDark: boolean) => (isDark ? appleColors.dark : appleColors.light),
} as const;

export type AppleHIG = typeof appleHIG;
