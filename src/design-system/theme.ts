import { Platform } from 'react-native';

export const premiumDarkTheme = {
  palette: {
    background: '#000000',       // Absolute True Black Canvas
    surface: '#111114',          // High-Contrast High-End Card Surface
    border: 'rgba(255, 255, 255, 0.08)', // Ultra-Thin Soft Metallic Divider
    text: {
      primary: '#FFFFFF',        // Stark Crisp White for Primary Headers
      secondary: '#6E6E73',      // Muted Description Tone
      muted: 'rgba(255, 255, 255, 0.45)' // soft positioningText mapping
    },
    accent: {
      bluePulse: '#007AFF',      // Radar electromagnetic diagnostic aura
      greenSuccess: '#34C759',   // Verification tick / Operational status
      amberWarning: '#FF9500'    // Offline state / Sector check notification
    }
  },
  typography: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontMedium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
    fontSemibold: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
    fontBold: Platform.select({ ios: 'System', default: 'sans-serif' }),
  }
};
