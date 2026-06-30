import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Enhanced haptic system for millennial-appealing tactile feedback.
 * Combines subtle, sophisticated patterns with clear feedback hierarchy.
 */

/**
 * Detect haptic capability with graceful fallbacks
 */
const supportsHaptics = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Safe execution wrapper - prevents haptics from crashing the app
 */
function safe(fn: () => Promise<void> | void) {
  if (!supportsHaptics) return;
  try {
    // @ts-ignore - expo-haptics return types can be tricky
    void fn();
  } catch (e) {
    // Silently fail - haptics should never impact core functionality
    // __DEV__ && console.warn('Haptic feedback unavailable:', e);
  }
}

/**
 * Enhanced haptic feedback with intensity levels and patterns
 */
export const Haptics = {
  // Basic tactile feedback - refined for better feel
  light() {
    // More subtle touch for delicate interactions
    safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light));
  },

  medium() {
    // Standard feedback - slightly enhanced for better perception
    safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium));
  },

  heavy() {
    // Strong feedback for significant actions
    safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
  },

  // Specialized feedback types
  soft() {
    // Gentle feedback for exploratory interactions
    safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft));
  },

  rigid() {
    // Firm feedback for confirmations
    safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid));
  },

  // Notification-style feedback for system-level events
  success() {
    // Positive outcome confirmation
    if (Platform.OS === 'ios') {
      safe(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success));
    } else {
      // Android approximation - slightly stronger impact
      safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
    }
  },

  warning() {
    // Cautionary feedback
    if (Platform.OS === 'ios') {
      safe(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning));
    } else {
      // Android - medium with slight emphasis
      safe(() => {
        setTimeout(() => {
          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        }, 30);
      });
    }
  },

  error() {
    // Negative outcome feedback
    if (Platform.OS === 'ios') {
      safe(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error));
    } else {
      // Android - heavy impact
      safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
    }
  },

  // Selection feedback for discrete value changes
  selection() {
    // Subtle feedback for scrolling/picking
    if (Platform.OS === 'ios') {
      safe(() => ExpoHaptics.selectionAsync());
    }
    // Android: often omitted as it can feel spammy
  },

  // Enhanced patterned responses for delight
  // These create memorable micro-interactions that millennials appreciate

  /**
   * Soft confirmation - for gentle positive feedback
   * Feels like a gentle tap - reassuring but not intrusive
   */
  softConfirmation() {
    safe(() => {
      // Light tap followed by barely-there release
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      setTimeout(() => {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      }, 40);
    });
  },

  /**
   * Confident click - for decisive actions
   * Feels solid and assured - like clicking a quality switch
   */
  confidentClick() {
    safe(() => {
      // Firm press with slight release
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      }, 35);
    });
  },

  /**
   * Delight ripple - for discovery moments
   * Creates a pleasant wave sensation - like dropping a pebble in water
   */
  delightRipple() {
    safe(() => {
      // Triple tap with increasing then decreasing intensity
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      setTimeout(() => {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      }, 30);
      setTimeout(() => {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      }, 70);
      setTimeout(() => {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      }, 120);
    });
  },

  /**
   * Gentle nudge - for subtle guidance
   * Almost imperceptible - like a breeze letting you know something's there
   */
  gentleNudge() {
    safe(() => {
      // Barely-there tap
      setTimeout(() => {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      }, 20);
    });
  },

  /**
   * Celebration burst - for achievements
   * Feels like confetti - multiple light taps in quick succession
   */
  celebration() {
    safe(() => {
      // Rapid succession for celebratory feel
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
        }, i * 50);
      }
    });
  },

  /**
   * Thoughtful pause - for decision moments
   * Single, deliberate pulse that gives weight to choices
   */
  thoughtfulPause() {
    safe(() => {
      // Longer, more deliberate press
      setTimeout(() => {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      }, 60);
    });
  },

  // Legacy compatibility - maintains existing API
  legacy: {
    selection() {
      Haptics.selection();
    },
    light() {
      Haptics.light();
    },
    medium() {
      Haptics.medium();
    },
    heavy() {
      Haptics.heavy();
    },
    soft() {
      Haptics.soft();
    },
    rigid() {
      Haptics.rigid();
    },
    success() {
      Haptics.success();
    },
    warning() {
      Haptics.warning();
    },
    error() {
      Haptics.error();
    },
  },
};

// Context-aware haptic suggestions for different UI elements
export const UIHaptics = {
  // Navigation
  navigation: {
    back: Haptics.light,
    forward: Haptics.light,
    tabChange: Haptics.light,
    modalOpen: Haptics.softConfirmation,
    modalClose: Haptics.light,
  },

  // Buttons & Controls
  buttons: {
    default: Haptics.light,
    primary: Haptics.confidentClick,
    destructive: Haptics.heavy,
    toggle: Haptics.softConfirmation,
  },

  // Form Interactions
  forms: {
    fieldFocus: () => {},
    fieldChange: Haptics.light,
    submit: Haptics.confidentClick,
    validationError: () => Haptics.error(),
    validationSuccess: () => Haptics.celebration(),
  },

  // Discovery & Exploration
  discovery: {
    itemPeek: Haptics.gentleNudge,
    itemSelect: Haptics.confidentClick,
    itemDragStart: Haptics.light,
    itemDrop: Haptics.softConfirmation,
    discoveryMoment: () => Haptics.delightRipple(),
  },

  // Social & Connection
  social: {
    like: Haptics.confidentClick,
    love: () => Haptics.celebration(),
    comment: Haptics.light,
    share: () => Haptics.delightRipple(),
    match: () => {
      // Special celebration for connections
      Haptics.confidentClick();
      setTimeout(() => Haptics.celebration(), 100);
    },
    messageSent: Haptics.light,
    messageReceived: Haptics.softConfirmation,
  },

  // Productivity
  productivity: {
    taskComplete: () => Haptics.celebration(),
    taskIncomplete: Haptics.light,
    save: Haptics.confidentClick,
    delete: () => {
      // Heavier feedback for destructive actions
      Haptics.heavy();
      setTimeout(() => Haptics.light(), 150);
    },
    archive: Haptics.light,
  },

  // Creative Tools
  creative: {
    brushStroke: Haptics.light,
    layerChange: Haptics.light,
    effectApply: Haptics.confidentClick,
    undo: Haptics.light,
    redo: Haptics.light,
    saveVersion: () => Haptics.celebration(),
  },

  // Onboarding & Tutorials
  onboarding: {
    firstSuccess: () => Haptics.celebration(),
    stepComplete: Haptics.softConfirmation,
    milestone: () => Haptics.celebration(),
  },
};

// Haptic intensity levels for granular control
export const HapticIntensity = {
  none: 0,
  subtle: 0.25,
  light: 0.5,
  medium: 0.75,
  firm: 1.0,
  strong: 1.25,
};

// Utility to create custom haptic patterns
export const createHapticPattern = (
  impulses: { time: number; intensity: number }[]
) => {
  return () => {
    impulses.forEach(({ time, intensity }) => {
      setTimeout(() => {
        // Map intensity to haptic type
        let hapticType =
          ExpoHaptics.ImpactFeedbackStyle.Light; // default

        if (intensity >= 0.8) {
          hapticType = ExpoHaptics.ImpactFeedbackStyle.Heavy;
        } else if (intensity >= 0.6) {
          hapticType = ExpoHaptics.ImpactFeedbackStyle.Medium;
        } else if (intensity >= 0.3) {
          hapticType = ExpoHaptics.ImpactFeedbackStyle.Light;
        } else {
          hapticType = ExpoHaptics.ImpactFeedbackStyle.Soft;
        }

        // iOS specific - Android will map appropriately
        if (Platform.OS === 'ios') {
          ExpoHaptics.impactAsync(hapticType);
        } else {
          // Android approximation
          if (intensity >= 0.7) {
            ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
          } else if (intensity >= 0.4) {
            ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
          } else {
            ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
          }
        }
      }, time);
    });
  };
};

// Export individual functions for backward compatibility
export const {
  selection,
  light,
  medium,
  heavy,
  soft,
  rigid,
  success,
  warning,
  error,
  softConfirmation,
  confidentClick,
  delightRipple,
  gentleNudge,
  celebration,
  thoughtfulPause,
} = Haptics;

// Backward compatibility exports
export const HapticTap = Haptics;

export const HapticPattern = {
  /** Card flip (front -> back or back -> front). */
  flip() {
    HapticTap.medium();
  },
  /** Tap-to-share success celebration. */
  tapSuccess() {
    HapticTap.success();
    setTimeout(() => HapticTap.light(), 90);
    setTimeout(() => HapticTap.soft(), 180);
  },
  /** New connection received. */
  newConnection() {
    HapticTap.soft();
    setTimeout(() => HapticTap.medium(), 70);
    setTimeout(() => HapticTap.success(), 160);
  },
  /** Follow-up reminder dismissed. */
  followUpDone() {
    HapticTap.light();
    setTimeout(() => HapticTap.success(), 110);
  },
};

// Default export for convenience
export default Haptics;