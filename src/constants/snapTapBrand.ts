import type { AppIconName } from '@/src/components/AppIcon';

/** Snap Tap brand — use for ~10% of UI only (buttons, active nav, badges, links, stats, attention icons). */
export const SNAP_TAP_BRAND = '#2596BE';
export const SNAP_TAP_BRAND_PRESSED = '#1F7FA3';
export const SNAP_TAP_BRAND_SOFT = 'rgba(37,150,190,0.12)';

/** 75% — page + card surfaces */
export const SNAP_TAP_WHITE = '#FFFFFF';
export const SNAP_TAP_PAGE_BG = '#F9F9FB';

/** 15% — body text, borders, inactive icons */
export const SNAP_TAP_TEXT = '#1D1D1F';
export const SNAP_TAP_GRAY = '#86868B';
export const SNAP_TAP_BORDER = '#E8E8ED';
export const SNAP_TAP_ICON = '#111111';

/** Subtle brand-tinted card (feature strip, tiles). */
export const SNAP_TAP_CARD_SURFACE = '#F4FAFC';
export const SNAP_TAP_CARD_BORDER = 'rgba(37,150,190,0.18)';

/** Default squircle icon stroke/fill on guest consumer UI */
export const SNAP_TAP_SQUIRCLE_ICON = SNAP_TAP_BRAND;

/** QR, NFC, Wallet, Analytics + common home features */
export const SNAP_TAP_ATTENTION_ICONS = new Set<AppIconName>([
  'QrCode',
  'Nfc',
  'Wallet',
  'TrendingUp',
  'ShieldCheck',
  'Bell',
  'Eye',
  'PenLine',
  'CreditCard',
  'Package',
  'FileText',
  'Link',
  'User',
  'Users',
  'Info',
  'Image',
  'ScanLine',
]);

export function isSnapTapAttentionIcon(name: AppIconName): boolean {
  return SNAP_TAP_ATTENTION_ICONS.has(name);
}

/** Guest squircle icons use brand blue unless overridden (e.g. destructive). */
export function snapTapIconColor(name: AppIconName, fallback: string = SNAP_TAP_BRAND): string {
  return fallback;
}

export function snapTapLinkStyle() {
  return { color: SNAP_TAP_BRAND } as const;
}
