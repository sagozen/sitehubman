/**
 * Design Tokens Extracted from Apple Wallet, Tesla, Linear, Arc Browser, Nothing OS
 * No invention. No Dribbble. Only real product design principles.
 */

import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY (Apple + Tesla + Linear)
// ═══════════════════════════════════════════════════════════════════════════

export const typography = {
  // Apple's SF Pro / Linear's Display
  display: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5, // Apple's tight tracking for large text
    fontWeight: '600' as const,
  },
  
  // Standard title (all systems agree on 20px)
  title: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3, // Apple + Tesla tracking
    fontWeight: '600' as const,
  },
  
  // Body text (Apple standard)
  body: {
    fontSize: 15,
    lineHeight: 22, // Linear's generous line-height
    letterSpacing: -0.1,
    fontWeight: '400' as const,
  },
  
  // Detail text
  detail: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0, // Neutral tracking
    fontWeight: '400' as const,
  },
  
  // Caption (uppercase, widely used)
  caption: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6, // Wide tracking for uppercase
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING (8pt grid from all systems)
// ═══════════════════════════════════════════════════════════════════════════

export const spacing = {
  // Micro spacing
  1: 4,
  2: 8,   // Base unit
  3: 12,
  4: 16,
  
  // Standard spacing
  5: 20,
  6: 24,  // Tesla's card padding
  8: 32,
  
  // Generous spacing (Linear + Arc)
  10: 40,
  12: 48, // Linear's section gaps
  16: 64, // Linear's list item height
  24: 96, // Arc's max spacing
  
  // Screen edges
  screenX: 20,  // Apple standard
  screenY: 24,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CORNER RADIUS (Industry standard across all systems)
// ═══════════════════════════════════════════════════════════════════════════

export const radius = {
  card: 16,    // All systems agree on 16px for cards
  button: 10,  // Apple's button radius
  input: 10,   // Apple's input radius
  badge: 6,    // Linear's badge radius
  sheet: 12,   // iOS sheet radius
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ELEVATION (Apple Wallet style)
// ═══════════════════════════════════════════════════════════════════════════

export const elevation = {
  // Level 0: Border only (Nothing + Tesla preference)
  none: {
    borderWidth: 0.5, // Apple's precise 0.5px
    borderColor: 'rgba(0,0,0,0.1)',
    shadowOpacity: 0,
  },
  
  // Level 1: Subtle lift
  subtle: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: {},
  }),
  
  // Level 2: Standard card
  low: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  }),
  
  // Level 3: NFC card (Apple Wallet style)
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COLOR (Tesla + Nothing monochrome with Apple accents)
// ═══════════════════════════════════════════════════════════════════════════

export const color = {
  // Primary (Tesla's Electric Blue)
  primary: '#3E6AE1',
  
  // Monochrome base (Nothing + Tesla)
  black: '#0A0A0A',
  white: '#FFFFFF',
  
  // Surfaces (Apple standard)
  surface: '#FFFFFF',
  surfaceVariant: '#FAFAFA',
  surfaceSecondary: '#F5F5F5',
  
  // Borders (Apple precision)
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  
  // Text hierarchy
  text: '#0A0A0A',
  textMedium: '#666666',
  textLight: '#999999',
  
  // Status (Physical colors, not vibrant)
  success: '#16A34A',
  error: '#DC2626',
  warning: '#EA580C',
  info: '#2563EB',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION (Combined from all systems)
// ═══════════════════════════════════════════════════════════════════════════

export const duration = {
  fast: 100,    // Apple button press
  base: 200,    // Tesla state change
  slow: 300,    // Sheet present
} as const;

export const easing = {
  standard: [0.4, 0, 0.2, 1] as const,
  enter: [0, 0, 0.2, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON (Linear's clear hierarchy)
// ═══════════════════════════════════════════════════════════════════════════

export const button = {
  height: 44,
  paddingX: 24,
  radius: radius.button,
  
  variants: {
    primary: {
      background: color.black,
      text: color.white,
    },
    secondary: {
      background: color.surfaceSecondary,
      text: color.black,
    },
    tertiary: {
      background: 'transparent',
      text: color.black,
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CARD (Apple Wallet dimensions)
// ═══════════════════════════════════════════════════════════════════════════

export const card = {
  padding: spacing[6], // 24px (Tesla standard)
  radius: radius.card,
  
  // NFC card dimensions (credit card ratio)
  nfc: {
    width: 343,
    height: 216,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// LIST (Linear's generous sizing)
// ═══════════════════════════════════════════════════════════════════════════

export const list = {
  itemHeight: 64, // Linear's comfortable height
  paddingX: 24,
  separator: `0.5px solid ${color.borderLight}`,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════

export const tokens = {
  typography,
  spacing,
  radius,
  elevation,
  color,
  duration,
  easing,
  button,
  card,
  list,
} as const;
