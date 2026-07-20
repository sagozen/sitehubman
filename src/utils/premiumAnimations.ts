import { withSpring, withTiming, Easing } from 'react-native-reanimated';

/**
 * Premium spring configuration modeled on iOS design specifications.
 */
export const AppleSprings = {
  // Soft, bouncy spring (ideal for buttons, tabs, floating actions)
  bouncy: {
    damping: 15,
    stiffness: 160,
    mass: 0.6,
  },
  // Smooth, fluid spring (ideal for screen entries, modal sheets)
  fluid: {
    damping: 22,
    stiffness: 140,
    mass: 1.0,
  },
  // Tight, snappy spring (ideal for slider tracks, input errors)
  snappy: {
    damping: 20,
    stiffness: 220,
    mass: 0.8,
  },
};

/**
 * Wrap value with the premium bouncy spring
 */
export function withBouncySpring(value: number, callback?: (finished?: boolean) => void) {
  'worklet';
  return withSpring(value, AppleSprings.bouncy, callback);
}

/**
 * Wrap value with the premium fluid spring
 */
export function withFluidSpring(value: number, callback?: (finished?: boolean) => void) {
  'worklet';
  return withSpring(value, AppleSprings.fluid, callback);
}

/**
 * Stripe/Linear quality standard cubic bezier transition
 */
export const CubicBezierTransitions = {
  easeOut: Easing.bezier(0.16, 1, 0.3, 1), // Apple Ease Out
  linearLike: Easing.bezier(0.25, 1, 0.5, 1),
};

export function withPremiumTiming(value: number, duration = 350) {
  'worklet';
  return withTiming(value, {
    duration,
    easing: CubicBezierTransitions.easeOut,
  });
}
