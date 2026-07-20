/** Snap Tap login screen: premium NFC identity presentation. */
import {
  SNAP_TAP_BORDER,
  SNAP_TAP_BRAND,
  SNAP_TAP_BRAND_PRESSED,
  SNAP_TAP_GRAY,
  SNAP_TAP_TEXT,
} from '@/src/constants/snapTapBrand';

export const authLoginTheme = {
  // Colors
  palette: {
    background: '#F5F5F7', // Apple-style light gray
    surface: '#FFFFFF',
    textPrimary: '#1D1D1F', // SF Pro High Contrast
    textSecondary: '#86868B', // Muted
    accent: SNAP_TAP_BRAND,
    accentPressed: SNAP_TAP_BRAND_PRESSED,
    border: 'rgba(0, 0, 0, 0.08)',
    glass: 'rgba(255, 255, 255, 0.7)',
  },
  gradient: ['#F8FAFC', '#ECFDF5', '#EAF3FF', '#FFFFFF'] as const,
  gradientLocations: [0, 0.34, 0.72, 1] as const,
  cardBg: '#FFFFFF',
  cardBorder: SNAP_TAP_BORDER,
  cardStroke: 'rgba(15, 23, 42, 0.08)',
  brandBlue: SNAP_TAP_BRAND,
  brandTeal: SNAP_TAP_BRAND,
  titleNavy: SNAP_TAP_TEXT,
  subtitle: SNAP_TAP_GRAY,
  fieldBorder: SNAP_TAP_BORDER,
  fieldBg: '#FFFFFF',
  fieldIcon: SNAP_TAP_BRAND,
  fieldLabel: SNAP_TAP_GRAY,
  fieldFocusBg: '#FFFFFF',
  primary: SNAP_TAP_BRAND,
  primaryPressed: SNAP_TAP_BRAND_PRESSED,
  telegram: '#2AABEE',
  googleBorder: 'rgba(15, 23, 42, 0.1)',
  decorOpacity: 0.2,

  // Premium Design Tokens
  radius: {
    card: 28,
    button: 100, // Pill
    field: 16,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
} as const;
