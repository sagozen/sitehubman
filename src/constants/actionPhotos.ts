import type { ImageSourcePropType } from 'react-native';

const loaders = {
  design: () => require('@/assets/images/guest/guest-card-product.png') as ImageSourcePropType,
  preview: () => require('@/assets/images/guest/guest-hero-lifestyle.png') as ImageSourcePropType,
  order: () => require('@/assets/images/guest/guest-production.png') as ImageSourcePropType,
  connections: () => require('@/assets/images/connections/connections-nfc.png') as ImageSourcePropType,
  profile: () => require('@/assets/images/snap-tap-hero.png') as ImageSourcePropType,
  drafts: () => require('@/assets/images/guest/guest-card-product.png') as ImageSourcePropType, // Placeholder
} as const;

/** Lazy getters — hero PNGs load only when a tile is rendered, not at module init. */
export const actionPhotos = {
  get design() {
    return loaders.design();
  },
  get preview() {
    return loaders.preview();
  },
  get order() {
    return loaders.order();
  },
  get connections() {
    return loaders.connections();
  },
  get profile() {
    return loaders.profile();
  },
  get drafts() {
    return loaders.drafts();
  },
} as const;
