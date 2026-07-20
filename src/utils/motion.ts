/**
 * Enhanced motion tokens for the design system with Millennial-appealing interactions.
 * Use these everywhere instead of magic numbers so animations feel consistent and delightful.
 */

import { Easing } from 'react-native-reanimated';

/** Enhanced easing curves for more sophisticated animations */
export const Easings = {
  /** Standard ease for most UI transitions - refined for smoother feel */
  standard: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  /** Soft ease for subtle interactions */
  soft: Easing.bezier(0.35, 0.1, 0.25, 1.0),
  /** Crisp touch response for buttons */
  crisp: Easing.bezier(0.33, 0.01, 0.68, 0.99),
  /** Decelerate - things entering the screen */
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  /** Accelerate - things leaving the screen */
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  /** Sharp - quick interactions (haptic-style) */
  sharp: Easing.bezier(0.4, 0.0, 0.6, 0),
  /** Spring-ish feel alive.emphasized: Easing.bezier(0.4, 0.0, 0.6, 1.0),
  /** Spring-ish for things that should feel alive */
  emphasized: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  /** Bouncy for playful interactions */
  bouncy: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  /** Elastic for delightful surprises */
  elastic: Easing.bezier(0.68, -0.55, 0.265, 1.55),
} as const;

export const MotionDuration = {
  /** Almost instant (micro-interactions) */
  instant: 80,
  /** Quick feedback (toggle states) */
  immediate: 100,
  /** Standard UI transition (button press) */
  quick: 120,
  /** Enhanced standard for better responsiveness */
  fast: 160,
  /** Standard screen-level transition */
  base: 220,
  /** Slightly slower for deliberate actions */
  moderate: 280,
  /** Larger motion (sheet, modal) */
  slow: 350,
  /** Cinematic (hero entrance, major transitions) */
  prominent: 500,
  /** Epic animations for special moments */
  epic: 800,
} as const;

export const MotionScale = {
  /** Subtle press feedback */
  pressedLight: 0.98,
  /** Standard press feedback */
  pressed: 0.95,
  /** Strong press feedback for important actions */
  pressedFirm: 0.92,
  /** Soft press feedback for large surfaces */
  softPressed: 0.985,
  /** Card lift on hover/interaction */
  lifted: 1.02,
  /** Moderate lift for emphasis */
  liftedMedium: 1.04,
  /** Significant lift for focal points */
  liftedLarge: 1.06,
  /** Hero entrance pop */
  heroPop: 1.08,
  /** Scale for dragged elements */
  dragged: 0.97,
  /** Scale for pinch-to-zoom interactions */
  pinched: 0.9,
} as const;

export const MotionOpacity = {
  /** Barely visible */
  faint: 0.05,
  /** Subtle presence */
  subtle: 0.15,
  /** Noticeable but not dominant */
  muted: 0.3,
  /** Standard disabled state */
  disabled: 0.5,
  /** Soft active state */
  softActive: 0.7,
  /** Nearly full */
  nearFull: 0.9,
  /** Almost imperceptible change */
  whisper: 0.95,
} as const;

export const MotionBlur = {
  /** No blur */
  none: 0,
  /** Very subtle motion blur */
  slight: 2,
  /** Moderate motion blur */
  moderate: 4,
  /** Pronounced motion blur */
  pronounced: 8,
  /** Maximum blur for speed lines */
  extreme: 16,
} as const;

/** Stagger helpers for cascading list/grid entry animations */
export const MotionStagger = {
  /** Cards in a vertical list */
  list: 45,
  /** Grid items in rows */
  grid: 35,
  /** Horizontal scroll items */
  horizontal: 40,
  /** Staggered radial pattern */
  radial: 50,
  /** Hero feature entrance with pause */
  hero: 100,
  /** Complex staggered layouts */
  complex: 60,
} as const;

/** Enhanced helpers with better control */
export function staggerDelay(index: number, step: number, max = 500): number {
  return Math.min(index * step, max);
}

export function createSpringConfig(damping: number, stiffness: number) {
  return { damping, stiffness, velocity: 0 };
}

export function createTimingConfig(duration: number, easing: any) {
  return { duration, easing, useNativeDriver: true };
}

/** Preset animation configurations for common patterns */
export const AnimationPresets = {
  /** Button press feedback */
  buttonPress: {
    scale: MotionScale.pressed,
    duration: MotionDuration.quick,
    easing: Easings.crisp,
  },

  /** Card lift on hover */
  cardHover: {
    scale: MotionScale.lifted,
    duration: MotionDuration.base,
    easing: Easings.standard,
  },

  /** Icon tap effect */
  iconTap: {
    scale: [1, 0.9, 1.1, 1],
    duration: MotionDuration.base,
    easing: Easings.bouncy,
  },

  /** Pull-to-refresh style */
  pullToRefresh: {
    duration: MotionDuration.slow,
    easing: Easings.decelerate,
  },

  /** Modal presentation */
  modalPresent: {
    duration: MotionDuration.prominent,
    easing: Easings.standard,
  },

  /** Toast notification */
  toastAppear: {
    duration: MotionDuration.fast,
    easing: Easings.accelerate,
  },
  toastDisappear: {
    duration: MotionDuration.fast,
    easing: Easings.decelerate,
  },

  /** Floating action button */
  fabPress: {
    scale: MotionScale.pressedFirm,
    rotation: 5, // slight rotation for dynamism
    duration: MotionDuration.immediate,
    easing: Easings.crisp,
  },

  /** List item reveal */
  listItemReveal: {
    delay: (index: number) => index * MotionStagger.list,
    duration: MotionDuration.base,
    easing: Easings.standard,
  },

  /** Grid item reveal */
  gridItemReveal: {
    delay: (index: number) => index * MotionStagger.grid,
    duration: MotionDuration.base,
    easing: Easings.standard,
  },
};