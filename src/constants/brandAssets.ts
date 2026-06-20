/** Page background for login + guest consumer flows. */
export { SNAP_TAP_PAGE_BG } from '@/src/constants/snapTapBrand';

/** Snap Tap brand images supplied by product — use these, not generic icons. */
export const brandAssets = {
  logo: require('@/assets/images/snap-tap-logo.png'),
  heroIllustration: require('@/assets/images/snap-tap-hero.png'),
} as const;

/** Official-style social login marks (bundled; do not hotlink CDN at runtime). */
export const authBrandAssets = {
  google: require('@/assets/images/auth/google.jpg'),
  telegram: require('@/assets/images/auth/telegram.png'),
} as const;

export const SOCIAL_ICON_SIZE = 24;

export const BRAND_NAME = 'Snap Tap';
export const BRAND_TAGLINE = 'Your digital identity hub';
