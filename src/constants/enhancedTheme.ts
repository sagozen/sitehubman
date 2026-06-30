import { Easing } from 'react-native-reanimated';
import { iosDesign, iosTypography } from '@/src/design-system/ios';
import { MotionDuration, Easings, MotionScale, MotionOpacity, AnimationPresets } from '@/src/utils/motion';
import { Haptics, UIHaptics } from '@/src/utils/haptics';

/**
 * Enhanced Theme Configuration
 * Centralizes all design tokens, animations, and haptics for consistent, delightful experiences
 */

/** Design System Tokens */
export const DesignTokens = {
  // Spacing - 8-point grid system with enhancements
  spacing: {
    ...iosDesign.spacing,
    // Additional micro-spacing for fine control
    xxxs: 1,
    xxsm: 2,
    xsm: 3,
    // Enhanced spacing for better readability
    comfortable: 24,
    relaxed: 32,
    spacious: 40,
    generous: 48,
  },

  // Border Radius - refined for modern aesthetics
  radius: {
    ...iosDesign.radius,
    // More nuanced radius values
    none: 0,
    subtle: 2,
    moderate: 4,
    standard: 6,
    rounded: 8,
    soft: 10,
    semiRound: 12,
    rounded: 16,
    veryRound: 20,
    pill: 999,
  },

  // Elevation/Shadow - sophisticated depth system
  elevation: {
    none: 'none',
    flat: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    low: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    high: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    // Specialized elevations
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    floating: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
    dialog: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 8,
    },
  },

  // Opacity - refined for better hierarchy
  opacity: {
    ...MotionOpacity,
    // Additional opacity values for nuanced states
    bare: 0.02,
    whisper: 0.05,
    faint: 0.08,
    dim: 0.12,
    muted: 0.2,
    subdued: 0.25,
    toned: 0.3,
    soft: 0.35,
    moderate: 0.4,
    significant: 0.5,
    substantial: 0.6,
    pronounced: 0.7,
    strong: 0.8,
    bold: 0.85,
    full: 1.0,
  },

  // Color System - enhanced for better accessibility and emotion
  colors: {
    // Base neutrals - carefully tuned for readability
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      950: '#030712',
    },
    // Primary brand colors - enhanced for emotional resonance
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#172554',
    },
    // Accent colors for highlights and accents
    accent: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#0E4B8F',
      900: '#164E63',
    },
    // Semantic colors for feedback
    success: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    // Info/neutral blues
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
  },

  // Typography - enhanced with fluid scaling
  typography: {
    // Base font sizes with responsive scaling
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
      '4xl': 30,
      '5xl': 36,
      '6xl': 42,
      '7xl': 48,
      '8xl': 56,
      '9xl': 64,
    },
    // Font weights with semantic names
    fontWeight: {
      thin: '100',
      extraLight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
      extraBold: '800',
      black: '900',
    },
    // Line heights for optimal readability
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    // Letter tracking for different contexts
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // Animation System - refined for delight
  animation: {
    duration: {
      ...MotionDuration,
      // Additional timing values
      instant: 50,
      immediate: 75,
      quick: 100,
      brisk: 150,
      standard: 200,
      moderate: 250,
      deliberate: 300,
      generous: 350,
      substantial: 400,
      considerable: 500,
      significant: 600,
      major: 700,
      extensive: 800,
      prolonged: 900,
      lengthy: 1000,
    },
    easing: {
      ...Easings,
      // Additional easing curves for specific use cases
      'soft-start': Easing.bezier(0.4, 0, 0.6, 1),
      'soft-end': Easing.bezier(0.25, 0.1, 0.25, 1),
      'soft-both': Easing.bezier(0.42, 0, 0.58, 1),
      'extra-decelerate': Easing.bezier(0.0, 0.0, 0.2, 1),
      'extra-accelerate': Easing.bezier(0.9, 0.0, 1.0, 1.0),
      'bounce-out': Easing.bezier(0.34, 1.56, 0.64, 1),
      'bounce-in': Easing.bezier(0.6, -0.28, 0.73, 0.045),
      'bounce-in-out': Easing.bezier(0.33, 1.53, 0.69, 0.78),
    },
    scale: {
      ...MotionScale,
      // Additional scale values
      barely: 0.99,
      slightly: 0.98,
      noticeably: 0.95,
      considerably: 0.9,
      substantially: 0.85,
      greatly: 0.8,
      immensely: 0.75,
    },
    opacity: {
      ...MotionOpacity,
      // Additional opacity states
      imperceptible: 0.01,
      nearlyInvisible: 0.03,
      veryFaint: 0.05,
      faint: 0.08,
      dim: 0.12,
      subdued: 0.18,
      muted: 0.25,
      soft: 0.35,
      light: 0.4,
      fair: 0.5,
      considerable: 0.6,
      substantial: 0.7,
      significant: 0.75,
      strong: 0.8,
      bold: 0.85,
      nearlyFull: 0.9,
      almost: 0.95,
      virtually: 0.98,
      practically: 0.99,
    },
  },

  // Haptic Feedback - enhanced for delightful touch
  haptics: {
    ...Haptics,
    // Context-specific recommendations
    ui: UIHaptics,
    // Intensity levels
    intensity: {
      none: 0,
      subtle: 0.25,
      light: 0.5,
      medium: 0.75,
      firm: 1.0,
      strong: 1.25,
      intense: 1.5,
    },
  },

  // Touch Targets - accessibility-first
  touch: {
    minimum: 48, // 48x48 dp minimum
    recommended: 56, // 56x56 dp preferred
    comfortable: 64, // 64x64 dp for frequent use
    generous: 72, // 72x72 dp for critical actions
  },

  // Breakpoints - responsive design
  breakpoints: {
    xs: 0,      // Extra small: phones
    sm: 576,    // Small: small tablets
    md: 768,    // Medium: tablets, small laptops
    lg: 992,    // Large: laptops, small desktops
    xl: 1200,   // Extra large: desktops, large screens
    xxl: 1400,  // 2x extra large: extra large screens
  },

  // Z-index layers for proper stacking
  zIndex: {
    base: 0,
    overlay: 10,
    modal: 100,
    popup: 200,
    toast: 300,
    tooltip: 400,
    system: 500,
  },

  // Transition presets for common UI patterns
  transitions: {
    fadeIn: 'opacity 200ms ease-in',
    fadeOut: 'opacity 200ms ease-out',
    fadeInOut: 'opacity 300ms ease-in-out',
    slideUp: 'transform 250ms ease-out, opacity 250ms ease-out',
    slideDown: 'transform 250ms ease-out, opacity 250ms ease-out',
    slideLeft: 'transform 250ms ease-out, opacity 250ms ease-out',
    slideRight: 'transform 250ms ease-out, opacity 250ms ease-out',
    scaleIn: 'transform 200ms ease-out, opacity 200ms ease-out',
    scaleOut: 'transform 200ms ease-in, opacity 200ms ease-in',
    rotate: 'transform 300ms ease-in-out',
    float: 'transform 3s ease-in-out infinite',
    pulse: 'transform 2s ease-in-out infinite',
  },
};

/**
 * Theme Configuration Constants
 * Exported for use throughout the application
 */
export const ThemeConfig = {
  // Application metadata
  appName: 'SiteHub Man',
  appDescription: 'Professional NFC Business Card Platform',
  version: '1.0.0',

  // Feature flags
  features: {
    animations: true,
    haptics: true,
    darkMode: true,
    responsive: true,
    accessibility: true,
  },

  // Performance thresholds
  performance: {
    // Frame budget targets (ms)
    frameBudget: 16, // 60fps
    expensiveOperation: 50, // Main thread work limit
    longTask: 100, // Long running task threshold
  },

  // Accessibility settings
  accessibility: {
    // Dynamic type support
    enableDynamicType: true,
    // Reduce motion preference
    respectReduceMotion: true,
    // Contrast enhancement
    enhanceContrast: false,
    // VoiceOver/Screen reader optimizations
    screenReaderOptimizations: true,
  },
};

/**
 * Hook-friendly theme accessors
 */
export const useThemeValue = <T>(
  path: string,
  fallback: T
): T => {
  // In a real implementation, this would use React context
  // For now, we'll return the fallback with a warning in dev
  if (__DEV__) {
    console.warn(`[Theme] Using fallback for path "${path}" - consider using context`);
  }
  return fallback;
};

export const useTheme = () => {
  // Returns the full theme object
  // In practice, this would come from React context
  return DesignTokens;
};

export default DesignTokens;