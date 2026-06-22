/**
 * Centralized motion tokens for the design system.
 * Use these everywhere instead of magic numbers so animations feel consistent.
 */

import { Easing } from 'react-native-reanimated';

/** Reanimated-compatible cubic-bezier strings. */
export const Easings = {
  /** Standard ease for most UI transitions. */
  standard: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  /** Decelerate - things entering the screen. */
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  /** Accelerate - things leaving the screen. */
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  /** Sharp - quick interactions (haptic-style). */
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1.0),
  /** Spring-ish for things that should feel alive. */
  emphasized: Easing.bezier(0.2, 0.0, 0.0, 1.0),
} as const;

export const MotionDuration = {
  /** Almost instant (chip selection, toggle). */
  instant: 120,
  /** Standard UI transition (button press feedback). */
  fast: 180,
  /** Standard screen-level transition. */
  base: 260,
  /** Larger motion (sheet, modal). */
  slow: 380,
  /** Cinematic (success animation, hero entrance). */
  hero: 620,
} as const;

export const MotionScale = {
  /** Press feedback. */
  pressed: 0.96,
  /** Soft press feedback for big surfaces. */
  softPressed: 0.985,
  /** Card lift on hover. */
  lifted: 1.02,
  /** Hero entrance pop. */
  heroPop: 1.05,
} as const;

/** Stagger helpers for cascading list/grid entry animations. */
export const MotionStagger = {
  /** Cards in a list. */
  list: 55,
  /** Grid items. */
  grid: 40,
  /** Hero feature entrance. */
  hero: 120,
} as const;

/** Helpers to clamp an index into a stagger window. */
export function staggerDelay(index: number, step: number, max = 600): number {
  return Math.min(index * step, max);
}
