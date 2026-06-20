import type { ImageSourcePropType } from 'react-native';
import { MARKETING_SCENE_ASSETS } from '@/src/constants/marketingSceneAssets';
import { buildCloudinaryUrl } from '@/src/services/cloudinaryService';
import { getCloudinaryFolder, isCloudinaryConfigured } from '@/src/utils/cloudinaryConfig';

/**
 * Production marketing scenes — 15 AI image slots.
 * Drop final PNGs into assets/images/marketing/{filename}.
 * Upload same publicId to Cloudinary when ready (optional CDN).
 */
export type MarketingSceneId =
  | 'splash'
  | 'welcome'
  | 'create-profile'
  | 'design-card'
  | 'nfc-tap-demo'
  | 'qr-nfc-benefits'
  | 'business-use-case'
  | 'team-enterprise'
  | 'production-tracking'
  | 'shipping-success'
  | 'profile-preview'
  | 'analytics-dashboard'
  | 'verification'
  | 'premium-membership'
  | 'hero-home';

export type MarketingSceneDef = {
  id: MarketingSceneId;
  filename: string;
  label: string;
  placement: string;
  screens: string[];
  prompt: string;
  defaultWidth: number;
};

const FOLDER = `${getCloudinaryFolder()}/marketing`;

const bundledCache = new Map<MarketingSceneId, ImageSourcePropType>();

export const MARKETING_SCENES: Record<MarketingSceneId, MarketingSceneDef> = {
  splash: {
    id: 'splash',
    filename: 'splash.png',
    label: 'Splash',
    placement: 'App launch',
    screens: ['Root splash / boot'],
    defaultWidth: 1200,
    prompt:
      'Premium NFC technology logo emerging from soft glass surface, glowing NFC waves, luxury Apple keynote style, minimal white background, elegant blue accent #2596be, ultra realistic, premium startup branding, photorealistic, 8k',
  },
  welcome: {
    id: 'welcome',
    filename: 'welcome.png',
    label: 'Welcome',
    placement: 'First app open',
    screens: ['Guest onboarding step 1'],
    defaultWidth: 1200,
    prompt:
      'Person tapping NFC card to smartphone, digital profile instantly appears, modern business networking, premium office environment, luxury technology advertisement, photorealistic, 8k',
  },
  'create-profile': {
    id: 'create-profile',
    filename: 'create-profile.png',
    label: 'Create profile',
    placement: 'Create My Card',
    screens: ['Card preview', 'Edit bio intro'],
    defaultWidth: 1000,
    prompt:
      'Modern digital profile builder interface floating above smartphone, editable profile card, QR code, NFC icon, elegant UI elements, clean Apple-style design, realistic product presentation, 8k',
  },
  'design-card': {
    id: 'design-card',
    filename: 'design-card.png',
    label: 'Design card',
    placement: 'Card designer',
    screens: ['Guest design', 'Checkout'],
    defaultWidth: 1200,
    prompt:
      'Collection of luxury NFC cards, matte black, white minimalist, transparent acrylic, metal gold, displayed like premium Apple products, photorealistic studio lighting, 8k',
  },
  'nfc-tap-demo': {
    id: 'nfc-tap-demo',
    filename: 'nfc-tap-demo.png',
    label: 'NFC tap',
    placement: 'NFC feature page',
    screens: ['NFC demo', 'NfcVisualGuide step 3'],
    defaultWidth: 1200,
    prompt:
      'Close-up smartphone detecting NFC card, glowing signal transfer, instant contact sharing visualization, premium tech photography, ultra realistic, 8k',
  },
  'qr-nfc-benefits': {
    id: 'qr-nfc-benefits',
    filename: 'qr-nfc-benefits.png',
    label: 'QR + NFC',
    placement: 'Benefits section',
    screens: ['Home features strip', 'Landing middle'],
    defaultWidth: 1000,
    prompt:
      'Elegant NFC card beside QR profile displayed on smartphone screen, modern digital identity ecosystem, clean white background, luxury branding, 8k',
  },
  'business-use-case': {
    id: 'business-use-case',
    filename: 'business-use-case.png',
    label: 'Business use',
    placement: 'Landing page',
    screens: ['Home why NFC section'],
    defaultWidth: 1200,
    prompt:
      'Real estate agent sharing NFC card with customer, focus on card and phone interaction, professional environment, premium business photography, 8k',
  },
  'team-enterprise': {
    id: 'team-enterprise',
    filename: 'team-enterprise.png',
    label: 'Team / company',
    placement: 'Enterprise',
    screens: ['Connections team profiles'],
    defaultWidth: 1200,
    prompt:
      'Multiple employees using branded NFC cards, corporate identity management, premium office environment, photorealistic, 8k',
  },
  'production-tracking': {
    id: 'production-tracking',
    filename: 'production-tracking.png',
    label: 'Production',
    placement: 'Order status',
    screens: ['Track order', 'NfcVisualGuide step 2'],
    defaultWidth: 1000,
    prompt:
      'NFC card manufacturing workflow, printing, NFC encoding, quality check, packaging, delivery tracking dashboard, premium logistics visualization, 8k',
  },
  'shipping-success': {
    id: 'shipping-success',
    filename: 'shipping-success.png',
    label: 'Delivered',
    placement: 'Order complete',
    screens: ['Track order delivered state'],
    defaultWidth: 1000,
    prompt:
      'Luxury NFC package delivered to customer, premium packaging, branded card box, realistic commercial product photography, 8k',
  },
  'profile-preview': {
    id: 'profile-preview',
    filename: 'profile-preview.png',
    label: 'Live preview',
    placement: 'Preview screen',
    screens: ['Public bio', 'Card preview'],
    defaultWidth: 1000,
    prompt:
      'Premium smartphone displaying digital business profile, social links, contact actions, elegant UI, floating glass cards, Apple-inspired design, photorealistic, 8k',
  },
  'analytics-dashboard': {
    id: 'analytics-dashboard',
    filename: 'analytics-dashboard.png',
    label: 'Analytics',
    placement: 'Analytics',
    screens: ['Guest analytics', 'Connections stats'],
    defaultWidth: 1000,
    prompt:
      'Modern analytics dashboard showing NFC taps, profile views, leads generated, clean premium interface, technology startup aesthetic, 8k',
  },
  verification: {
    id: 'verification',
    filename: 'verification.png',
    label: 'Verify NFC',
    placement: 'Activate / verify',
    screens: ['Activate card'],
    defaultWidth: 1000,
    prompt:
      'NFC card authenticity verification interface, secure digital identity, shield icon, modern cybersecurity aesthetic, luxury technology branding, 8k',
  },
  'premium-membership': {
    id: 'premium-membership',
    filename: 'premium-membership.png',
    label: 'Premium',
    placement: 'Upgrade',
    screens: ['Checkout premium', 'Trial upsell'],
    defaultWidth: 1000,
    prompt:
      'Gold premium NFC card beside luxury smartphone, elite business branding, exclusive membership concept, photorealistic commercial advertisement, 8k',
  },
  'hero-home': {
    id: 'hero-home',
    filename: 'hero-home.png',
    label: 'Hero',
    placement: 'Homepage hero',
    screens: ['Guest home', 'Customer home hero'],
    defaultWidth: 1400,
    prompt:
      'Ultra premium NFC business ecosystem, luxury NFC card floating beside smartphone displaying digital profile, QR code integration, glowing NFC waves, Apple product launch photography, white minimal background, blue accent #2596be, hyper realistic, photorealistic, focus on product and technology, no excessive people',
  },
};

export function getMarketingScene(id: MarketingSceneId): MarketingSceneDef {
  return MARKETING_SCENES[id];
}

export function getMarketingSceneBundled(id: MarketingSceneId): ImageSourcePropType | undefined {
  const cached = bundledCache.get(id);
  if (cached) return cached;
  const source = MARKETING_SCENE_ASSETS[id];
  if (!source) return undefined;
  bundledCache.set(id, source);
  return source;
}

export function getMarketingSceneCloudUrl(id: MarketingSceneId, width?: number): string {
  if (!isCloudinaryConfigured()) return '';
  const scene = MARKETING_SCENES[id];
  return buildCloudinaryUrl(`${FOLDER}/${id}`, {
    width: width ?? scene.defaultWidth,
    crop: 'limit',
    format: 'auto',
    quality: 'auto',
  });
}

/** Scene order for home page story flow. */
export const HOME_STORY_SCENES: MarketingSceneId[] = [
  'hero-home',
  'qr-nfc-benefits',
  'nfc-tap-demo',
  'business-use-case',
];

export const NFC_GUIDE_SCENE_IDS: MarketingSceneId[] = [
  'design-card',
  'production-tracking',
  'nfc-tap-demo',
  'shipping-success',
];

export const ONBOARDING_SCENE_IDS: MarketingSceneId[] = ['welcome', 'design-card', 'production-tracking'];
