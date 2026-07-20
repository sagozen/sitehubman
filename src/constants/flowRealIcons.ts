import type { ImageSourcePropType } from 'react-native';

/** Real / native / brand icon ids used across customer flows. */
export type FlowRealIconId =
  | 'phone'
  | 'mail'
  | 'telegram'
  | 'google'
  | 'whatsapp'
  | 'link'
  | 'share'
  | 'message'
  | 'ecard'
  | 'profile'
  | 'preview'
  | 'order'
  | 'track'
  | 'nfc'
  | 'connections'
  | 'orders'
  | 'drafts';

const BRAND_IMAGES: Partial<Record<FlowRealIconId, ImageSourcePropType>> = {
  telegram: require('@/assets/images/auth/telegram.png') as ImageSourcePropType,
  google: require('@/assets/images/auth/google.jpg') as ImageSourcePropType,
};

export function getFlowBrandImage(id: FlowRealIconId): ImageSourcePropType | null {
  return BRAND_IMAGES[id] ?? null;
}
