import { ImageSourcePropType } from 'react-native';
import {
  getMarketingSceneBundled,
  type MarketingSceneId,
} from '@/src/constants/marketingScenes';
import { buildCloudinaryUrl } from '@/src/services/cloudinaryService';
import { getCloudinaryFolder, isCloudinaryConfigured } from '@/src/utils/cloudinaryConfig';

/** Product-focused marketing photos — NFC cards, mockups, production (no people). */
export type ProductPhotoId =
  | 'nfc-card-hero'
  | 'nfc-card-stack'
  | 'nfc-tap-demo'
  | 'qr-card-backup'
  | 'card-mockup-premium'
  | 'card-mockup-metal'
  | 'card-mockup-wood'
  | 'digital-profile-preview'
  | 'production-print'
  | 'production-encode'
  | 'production-qa'
  | 'packaging-delivery'
  | 'before-after-nfc'
  | 'sales-orders-board'
  | 'printer-workshop'
  | 'customer-cards';

type ProductPhotoEntry = {
  publicId: string;
  label: string;
  defaultWidth: number;
};

const FOLDER = `${getCloudinaryFolder()}/products`;

/** Maps legacy product photo IDs to production marketing scenes. */
const PRODUCT_SCENE_MAP: Partial<Record<ProductPhotoId, MarketingSceneId>> = {
  'nfc-card-hero': 'hero-home',
  'nfc-card-stack': 'design-card',
  'nfc-tap-demo': 'nfc-tap-demo',
  'qr-card-backup': 'qr-nfc-benefits',
  'card-mockup-premium': 'design-card',
  'card-mockup-metal': 'design-card',
  'card-mockup-wood': 'design-card',
  'digital-profile-preview': 'profile-preview',
  'production-print': 'production-tracking',
  'production-encode': 'production-tracking',
  'production-qa': 'production-tracking',
  'packaging-delivery': 'shipping-success',
  'customer-cards': 'business-use-case',
  'sales-orders-board': 'team-enterprise',
  'printer-workshop': 'production-tracking',
};

/** Lazy loaders — legacy paths when marketing PNG is missing. */
const FALLBACK_LOADERS: Partial<Record<ProductPhotoId, () => ImageSourcePropType>> = {
  'nfc-card-hero': () => require('@/assets/images/guest/guest-card-product.png'),
  'nfc-card-stack': () => require('@/assets/images/guest/guest-card-product.png'),
  'nfc-tap-demo': () => require('@/assets/images/guest/guest-hero-lifestyle.png'),
  'card-mockup-premium': () => require('@/assets/images/guest/guest-card-product.png'),
  'production-print': () => require('@/assets/images/guest/guest-production.png'),
  'production-encode': () => require('@/assets/images/guest/guest-production.png'),
  'packaging-delivery': () => require('@/assets/images/guest/guest-production.png'),
  'sales-orders-board': () => require('@/assets/images/roles/sales-dashboard-hero.png'),
  'printer-workshop': () => require('@/assets/images/roles/printer-workshop-hero.png'),
  'customer-cards': () => require('@/assets/images/roles/customer-account-hero.png'),
};

const fallbackCache = new Map<ProductPhotoId, ImageSourcePropType>();

const CATALOG: Record<ProductPhotoId, ProductPhotoEntry> = {
  'nfc-card-hero': {
    publicId: `${FOLDER}/nfc-card-hero`,
    label: 'Premium NFC business card',
    defaultWidth: 900,
  },
  'nfc-card-stack': {
    publicId: `${FOLDER}/nfc-card-stack`,
    label: 'NFC card collection',
    defaultWidth: 800,
  },
  'nfc-tap-demo': {
    publicId: `${FOLDER}/nfc-tap-demo`,
    label: 'Tap phone to NFC card',
    defaultWidth: 900,
  },
  'qr-card-backup': {
    publicId: `${FOLDER}/qr-card-backup`,
    label: 'QR code on NFC card',
    defaultWidth: 800,
  },
  'card-mockup-premium': {
    publicId: `${FOLDER}/card-mockup-premium`,
    label: 'Premium PVC NFC card',
    defaultWidth: 720,
  },
  'card-mockup-metal': {
    publicId: `${FOLDER}/card-mockup-metal`,
    label: 'Metal NFC card',
    defaultWidth: 720,
  },
  'card-mockup-wood': {
    publicId: `${FOLDER}/card-mockup-wood`,
    label: 'Wood NFC card',
    defaultWidth: 720,
  },
  'digital-profile-preview': {
    publicId: `${FOLDER}/digital-profile-preview`,
    label: 'Digital profile preview',
    defaultWidth: 800,
  },
  'production-print': {
    publicId: `${FOLDER}/production-print`,
    label: 'Card printing',
    defaultWidth: 900,
  },
  'production-encode': {
    publicId: `${FOLDER}/production-encode`,
    label: 'NFC chip encoding',
    defaultWidth: 900,
  },
  'production-qa': {
    publicId: `${FOLDER}/production-qa`,
    label: 'Quality check',
    defaultWidth: 800,
  },
  'packaging-delivery': {
    publicId: `${FOLDER}/packaging-delivery`,
    label: 'Packaging & delivery',
    defaultWidth: 900,
  },
  'before-after-nfc': {
    publicId: `${FOLDER}/before-after-nfc`,
    label: 'Before & after NFC',
    defaultWidth: 960,
  },
  'sales-orders-board': {
    publicId: `${FOLDER}/sales-orders-board`,
    label: 'Order pipeline',
    defaultWidth: 960,
  },
  'printer-workshop': {
    publicId: `${FOLDER}/printer-workshop`,
    label: 'Print workshop',
    defaultWidth: 960,
  },
  'customer-cards': {
    publicId: `${FOLDER}/customer-cards`,
    label: 'Your NFC cards',
    defaultWidth: 900,
  },
};

export function getProductPhotoMeta(id: ProductPhotoId): ProductPhotoEntry {
  return CATALOG[id];
}

/** Optimized Cloudinary HTTPS URL, or empty when not configured (use fallback). */
export function getProductPhotoUrl(id: ProductPhotoId, width?: number): string {
  if (!isCloudinaryConfigured()) return '';
  const entry = CATALOG[id];
  return buildCloudinaryUrl(entry.publicId, {
    width: width ?? entry.defaultWidth,
    crop: 'limit',
    format: 'auto',
    quality: 'auto',
  });
}

export function getProductPhotoFallback(id: ProductPhotoId): ImageSourcePropType | undefined {
  const cached = fallbackCache.get(id);
  if (cached) return cached;

  const sceneId = PRODUCT_SCENE_MAP[id];
  if (sceneId) {
    const sceneBundled = getMarketingSceneBundled(sceneId);
    if (sceneBundled) {
      fallbackCache.set(id, sceneBundled);
      return sceneBundled;
    }
  }

  const loader = FALLBACK_LOADERS[id];
  if (!loader) return undefined;
  const source = loader();
  fallbackCache.set(id, source);
  return source;
}

/** Showcase tiles for guest home — product-first, no people. */
export const productShowcaseItems: {
  id: ProductPhotoId;
  title: string;
  subtitle: string;
}[] = [
  { id: 'card-mockup-premium', title: 'PVC NFC card', subtitle: 'Classic tap-to-open profile' },
  { id: 'card-mockup-metal', title: 'Metal NFC card', subtitle: 'Premium weight & finish' },
  { id: 'card-mockup-wood', title: 'Wood NFC card', subtitle: 'Natural material, smart chip' },
  { id: 'qr-card-backup', title: 'QR backup', subtitle: 'Works when NFC is unavailable' },
];

export const nfcGuideSteps: {
  id: ProductPhotoId;
  step: number;
  title: string;
  body: string;
}[] = [
  {
    step: 1,
    id: 'card-mockup-premium',
    title: 'Design your card',
    body: 'Pick materials, colors, and links — preview your digital profile before print.',
  },
  {
    step: 2,
    id: 'production-print',
    title: 'We print & encode',
    body: 'Production prints your artwork and writes a unique NFC URL to each chip.',
  },
  {
    step: 3,
    id: 'nfc-tap-demo',
    title: 'Tap to open',
    body: 'Anyone taps your card — their phone opens your live profile instantly.',
  },
  {
    step: 4,
    id: 'packaging-delivery',
    title: 'Shipped to you',
    body: 'Track QA, encoding, and delivery from checkout to your door.',
  },
];

/** Legacy role/guest photo map — lazy fallbacks (no eager multi-MB requires). */
export const rolePhotoAssets = {
  guest: {
    get heroLifestyle() {
      return getProductPhotoFallback('nfc-card-hero')!;
    },
    get cardProduct() {
      return getProductPhotoFallback('card-mockup-premium')!;
    },
    get production() {
      return getProductPhotoFallback('production-print')!;
    },
  },
  customer: {
    get account() {
      return getProductPhotoFallback('customer-cards')!;
    },
    get welcome() {
      return getProductPhotoFallback('customer-cards')!;
    },
  },
  sales: {
    get dashboard() {
      return getProductPhotoFallback('sales-orders-board')!;
    },
    get orders() {
      return getProductPhotoFallback('sales-orders-board')!;
    },
  },
  printer: {
    get workshop() {
      return getProductPhotoFallback('printer-workshop')!;
    },
    get queue() {
      return getProductPhotoFallback('printer-workshop')!;
    },
  },
} as const;

export const guestPhotoAssets = rolePhotoAssets.guest;

export const productPhotoIds = {
  guestHero: 'nfc-card-hero' as ProductPhotoId,
  guestDesign: 'card-mockup-premium' as ProductPhotoId,
  guestCheckout: 'nfc-card-stack' as ProductPhotoId,
  guestTrack: 'packaging-delivery' as ProductPhotoId,
  customerAccount: 'customer-cards' as ProductPhotoId,
  salesDashboard: 'sales-orders-board' as ProductPhotoId,
  printerWorkshop: 'printer-workshop' as ProductPhotoId,
};
