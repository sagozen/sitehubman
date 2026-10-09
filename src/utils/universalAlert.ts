import { Alert, Platform } from 'react-native';

export interface AlertButtonOption {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Universal cross-platform alert & confirmation dialog.
 * React Native Web's default Alert.alert() is a no-op dummy function alert() {}.
 * This polyfills window.confirm on web while using native Alert.alert on iOS/Android.
 */
export function showAppAlert(
  title: string,
  message?: string,
  buttons?: AlertButtonOption[]
) {
  if (Platform.OS === 'web') {
    if (!buttons || buttons.length <= 1) {
      // Simple information alert
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`${title}${message ? '\n\n' + message : ''}`);
      }
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
      return;
    }

    // Two or more buttons -> Treat as confirmation
    const destructiveOrPrimary = buttons.find((b) => b.style === 'destructive' || b.style === 'default') || buttons[buttons.length - 1];
    const cancelBtn = buttons.find((b) => b.style === 'cancel');

    const confirmed = typeof window !== 'undefined' && window.confirm
      ? window.confirm(`${title}${message ? '\n\n' + message : ''}`)
      : true;

    if (confirmed) {
      destructiveOrPrimary?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
    return;
  }

  // Native iOS / Android
  Alert.alert(title, message, buttons as any);
}
