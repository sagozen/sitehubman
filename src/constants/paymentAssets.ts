import type { ImageSourcePropType } from 'react-native';
import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';

const loaders = {
  aba: () => require('@/assets/payments/aba.png') as ImageSourcePropType,
  acleda: () => require('@/assets/payments/acleda.png') as ImageSourcePropType,
  wing: () => require('@/assets/payments/wing.png') as ImageSourcePropType,
  pipay: () => require('@/assets/payments/pipay.png') as ImageSourcePropType,
  emoney: () => require('@/assets/payments/emoney.png') as ImageSourcePropType,
} as const;

/** Brand logos in assets/payments/ — loaded on first checkout render. */
export const PAYMENT_BRAND_IMAGES = {
  get aba() {
    return loaders.aba();
  },
  get acleda() {
    return loaders.acleda();
  },
  get wing() {
    return loaders.wing();
  },
  get pipay() {
    return loaders.pipay();
  },
  get emoney() {
    return loaders.emoney();
  },
} as const;

export const PAYMENT_METHOD_IMAGES: Partial<Record<CambodiaPaymentMethodId, ImageSourcePropType>> = {
  get aba_pay() {
    return PAYMENT_BRAND_IMAGES.aba;
  },
  get acleda() {
    return PAYMENT_BRAND_IMAGES.acleda;
  },
  get wing() {
    return PAYMENT_BRAND_IMAGES.wing;
  },
  get pi_pay() {
    return PAYMENT_BRAND_IMAGES.pipay;
  },
  get truemoney() {
    return PAYMENT_BRAND_IMAGES.emoney;
  },
};

export const PAYMENT_BRAND_LOGO_LIST = [
  { key: 'aba', get source() { return PAYMENT_BRAND_IMAGES.aba; }, label: 'ABA Pay' },
  { key: 'acleda', get source() { return PAYMENT_BRAND_IMAGES.acleda; }, label: 'ACLEDA' },
  { key: 'wing', get source() { return PAYMENT_BRAND_IMAGES.wing; }, label: 'Wing' },
  { key: 'pipay', get source() { return PAYMENT_BRAND_IMAGES.pipay; }, label: 'Pi Pay' },
  { key: 'emoney', get source() { return PAYMENT_BRAND_IMAGES.emoney; }, label: 'eMoney' },
] as const;

export function getPaymentMethodImage(methodId: CambodiaPaymentMethodId): ImageSourcePropType | undefined {
  return PAYMENT_METHOD_IMAGES[methodId];
}
