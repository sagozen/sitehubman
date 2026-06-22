import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Semantic haptic patterns. Centralized so we have one place to tune feel
 * across the entire app and respect platform conventions.
 *
 * - iOS gets the most nuance (selection / light / medium / heavy / soft).
 * - Android falls back to impact variants (selection is a no-op there).
 * - Web silently no-ops because haptics aren't supported.
 */

const supportsHaptics = Platform.OS === 'ios' || Platform.OS === 'android';

function safe(fn: () => Promise<void> | void) {
  if (!supportsHaptics) return;
  try {
    void fn();
  } catch {
    // Ignore - haptics should never crash the app.
  }
}

export const HapticTap = {
  /** Tab switch / picker change. Very subtle. */
  selection() {
    safe(() => Haptics.selectionAsync());
  },
  /** Default button press. */
  light() {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  /** Primary action button. */
  medium() {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  /** Heavy / destructive. */
  heavy() {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  },
  /** Card flip, soft interactive moment. */
  soft() {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
  },
  /** Rigid - confirm / save / success. */
  rigid() {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
  },
  /** Notification: success. */
  success() {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  /** Notification: warning. */
  warning() {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
  /** Notification: error. */
  error() {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
};

/**
 * Patterned haptic sequences for high-fidelity moments.
 * Falls back gracefully on Android (uses one impact if pattern unsupported).
 */
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
