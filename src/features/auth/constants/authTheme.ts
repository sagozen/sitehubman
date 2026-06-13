/** Snap Tap login screen: premium NFC identity presentation. */
import {
  SNAP_TAP_BORDER,
  SNAP_TAP_BRAND,
  SNAP_TAP_BRAND_PRESSED,
  SNAP_TAP_GRAY,
  SNAP_TAP_TEXT,
} from '@/src/constants/snapTapBrand';

export const authLoginTheme = {
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
} as const;
