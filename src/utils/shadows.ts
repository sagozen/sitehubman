import { Platform, type ViewStyle } from 'react-native';

function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace('#', '');

  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16);
    const g = parseInt(sanitized[1] + sanitized[1], 16);
    const b = parseInt(sanitized[2] + sanitized[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (sanitized.length === 6) {
    const r = parseInt(sanitized.substring(0, 2), 16);
    const g = parseInt(sanitized.substring(2, 4), 16);
    const b = parseInt(sanitized.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Already rgba() / rgb() or unknown format - return as-is.
  return hex;
}

export interface ShadowOptions {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
  elevation?: number;
}

/**
 * Platform-aware shadow helper.
 *
 * On web it emits `boxShadow` (avoids the React Native Web deprecation warning
 * for shadowColor/shadowOffset/shadowOpacity/shadowRadius). On iOS it keeps the
 * native shadow props, and on Android it uses `elevation`.
 */
export function createShadow({
  color = '#000000',
  offset = { width: 0, height: 2 },
  opacity = 0.1,
  radius = 4,
  elevation = 2,
}: ShadowOptions = {}): ViewStyle {
  return Platform.select({
    web: {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${hexToRgba(color, opacity)}`,
    },
    ios: {
      shadowColor: color,
      shadowOffset: offset,
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
    default: {
      shadowColor: color,
      shadowOffset: offset,
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation,
    },
  }) as ViewStyle;
}
