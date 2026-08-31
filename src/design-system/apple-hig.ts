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
    // System Backgrounds (Apple HIG layered backgrounds)
    background:       '#000000',   // systemBackground (dark)
    backgroundSecondary: '#1C1C1E', // secondarySystemBackground
    backgroundTertiary:  '#2C2C2E', // tertiarySystemBackground
    groupedBackground:   '#000000', // systemGroupedBackground
    groupedSecondary:    '#1C1C1E', // secondarySystemGroupedBackground
    groupedTertiary:     '#2C2C2E', // tertiarySystemGroupedBackground

    // Labels (Apple HIG: use label, not a hardcoded color)
    label:            '#FFFFFF',                    // label
    labelSecondary:   'rgba(235,235,245,0.60)',     // secondaryLabel
    labelTertiary:    'rgba(235,235,245,0.30)',     // tertiaryLabel
    labelQuaternary:  'rgba(235,235,245,0.18)',     // quaternaryLabel
    placeholderText:  'rgba(235,235,245,0.30)',     // placeholderText

    // Fills (used for controls, not backgrounds)
    fillPrimary:      'rgba(120,120,128,0.36)',     // systemFill
    fillSecondary:    'rgba(120,120,128,0.32)',     // secondarySystemFill
    fillTertiary:     'rgba(118,118,128,0.24)',     // tertiarySystemFill
    fillQuaternary:   'rgba(118,118,128,0.18)',     // quaternarySystemFill

    // Separators
    separator:        'rgba(84,84,88,0.65)',        // separator
    opaqueSeparator:  '#38383A',                   // opaqueSeparator

    // System Tints
    blue:    '#0A84FF',  // systemBlue
    green:   '#30D158',  // systemGreen
    indigo:  '#5E5CE6',  // systemIndigo
    orange:  '#FF9F0A',  // systemOrange
    pink:    '#FF375F',  // systemPink
    purple:  '#BF5AF2',  // systemPurple
    red:     '#FF453A',  // systemRed
    teal:    '#5AC8FA',  // systemTeal
    yellow:  '#FFD60A',  // systemYellow
    gray:    '#8E8E93',  // systemGray
    gray2:   '#636366',  // systemGray2
    gray3:   '#48484A',  // systemGray3
    gray4:   '#3A3A3C',  // systemGray4
    gray5:   '#2C2C2E',  // systemGray5
    gray6:   '#1C1C1E',  // systemGray6

    // Semantic (resolved)
    tint:       '#0A84FF',  // default tint
    link:       '#0A84FF',
    destructive:'#FF453A',
    success:    '#30D158',
    warning:    '#FF9F0A',
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
  xxs:    4,
  xs:     8,
  sm:     12,
  md:     16,   // Standard horizontal screen margin
  lg:     20,
  xl:     24,
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
// Apple HIG uses consistent, meaningful radii.

export const appleRadius = {
  xs:      6,   // Tags, badges, small chips
  sm:      10,  // Inputs, secondary buttons
  md:      12,  // Cards, list rows, grouped table cells
  lg:      14,  // Primary buttons, large cards
  xl:      16,  // Full-width CTAs, large surfaces
  xxl:     20,  // Modal sheet top corners
  full:  9999,  // Pill shapes, avatar/icon containers
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
