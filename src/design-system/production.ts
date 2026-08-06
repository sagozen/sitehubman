/**
 * Production Design Tokens
 * Manufacturing-grade, ship-ready design system
 * No concepts. No dribbble. Real product.
 * 
 * Inspired by: Apple Wallet, Linear, Stripe Dashboard, Arc Browser, Nothing, Tesla UI, Monzo
 */

import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY (SF Pro / Inter)
// ═══════════════════════════════════════════════════════════════════════════

export const productionTypography = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    fontWeight: '400' as const,
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COLORS (Manufacturing-grade, physical colors)
// ═══════════════════════════════════════════════════════════════════════════

export const productionColors = {
  // Primary (90% of UI)
  black: '#0A0A0A',
  white: '#FFFFFF',
  
  // Surfaces
  surface: '#FFFFFF',
  surfaceVariant: '#FAFAFA',
  surfaceSecondary: '#F5F5F5',
  
  // Borders
  border: '#E5E5E5',
  borderSubtle: '#F0F0F0',
  
  // Text
  text: '#0A0A0A',
  textMedium: '#666666',
  textSubtle: '#999999',
  
  // Status (Physical, not vibrant)
  success: '#16A34A',
  error: '#DC2626',
  warning: '#EA580C',
  info: '#2563EB',
  
  // Interactive
  press: '#F5F5F5',
  hover: '#FAFAFA',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING (Generous, production-grade)
// ═══════════════════════════════════════════════════════════════════════════

export const productionSpacing = {
  // Micro
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  
  // Standard
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  
  // Generous (Linear/Stripe-style)
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  
  // Screen
  screenX: 24,
  screenY: 20,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// RADIUS (Consistent, not excessive)
// ═══════════════════════════════════════════════════════════════════════════

export const productionRadius = {
  button: 10,
  input: 10,
  card: 16,
  cardSmall: 12,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS (Apple Wallet-style, subtle)
// ═══════════════════════════════════════════════════════════════════════════

export const productionShadows = {
  none: Platform.select({
    ios: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: { elevation: 0 },
    default: {},
  })!,
  
  subtle: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: {},
  })!,
  
  raised: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  })!,
  
  floating: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 6 },
    default: {},
  })!,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON CONFIG (Clear hierarchy)
// ═══════════════════════════════════════════════════════════════════════════

export const productionButton = {
  height: 44,
  paddingX: 24,
  radius: 10,
  
  primary: {
    background: productionColors.black,
    text: productionColors.white,
    pressBackground: '#1A1A1A',
  },
  
  secondary: {
    background: productionColors.surfaceSecondary,
    text: productionColors.black,
    pressBackground: productionColors.border,
  },
  
  tertiary: {
    background: 'transparent',
    text: productionColors.black,
    pressBackground: productionColors.surfaceSecondary,
  },
  
  danger: {
    background: productionColors.error,
    text: productionColors.white,
    pressBackground: '#B91C1C',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CARD CONFIG (Apple Wallet-inspired)
// ═══════════════════════════════════════════════════════════════════════════

export const productionCard = {
  padding: 24,
  radius: 16,
  background: productionColors.white,
  border: `0.5px solid ${productionColors.border}`,
  
  // NFC Card dimensions (credit card ratio)
  nfcWidth: 343,
  nfcHeight: 216,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// INPUT CONFIG (Stripe-inspired)
// ═══════════════════════════════════════════════════════════════════════════

export const productionInput = {
  height: 48,
  paddingX: 16,
  radius: 10,
  background: productionColors.surfaceVariant,
  border: '1px solid transparent',
  
  focus: {
    border: `1px solid ${productionColors.black}`,
  },
  error: {
    border: `1px solid ${productionColors.error}`,
  },
  success: {
    border: `1px solid ${productionColors.success}`,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// LIST CONFIG (Linear-inspired)
// ═══════════════════════════════════════════════════════════════════════════

export const productionList = {
  itemHeight: 64, // Not 44px, more comfortable
  paddingX: 24,
  separator: `0.5px solid ${productionColors.borderSubtle}`,
  pressBackground: productionColors.surfaceVariant,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION (Functional, not decorative)
// ═══════════════════════════════════════════════════════════════════════════

export const productionAnimation = {
  duration: {
    fast: 150,
    base: 200,
    slow: 300,
  },
  
  easing: {
    standard: [0.4, 0, 0.2, 1] as const,
    enter: [0, 0, 0.2, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
  
  scale: {
    buttonPress: 0.98,
    cardPress: 0.99,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ICON SIZE (Minimal usage)
// ═══════════════════════════════════════════════════════════════════════════

export const productionIcon = {
  small: 16,
  medium: 20,
  large: 24,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════

export const production = {
  typography: productionTypography,
  colors: productionColors,
  spacing: productionSpacing,
  radius: productionRadius,
  shadows: productionShadows,
  button: productionButton,
  card: productionCard,
  input: productionInput,
  list: productionList,
  animation: productionAnimation,
  icon: productionIcon,
} as const;
