import type { ProductType } from '@/src/constants/options';

/** Firestore `products/{id}` — super admin manages live catalog prices. */
export type CatalogProductId = ProductType | 'ecard';

export type CatalogProduct = {
  id: CatalogProductId;
  name: string;
  emoji: string;
  priceUsd: number;
  isActive: boolean;
  kind: 'material' | 'digital';
};

export type ProductCatalog = {
  products: Record<CatalogProductId, CatalogProduct>;
  updatedAt: string | null;
};

export const CATALOG_PRODUCT_IDS: CatalogProductId[] = [
  'ecard',
  'wood_card',
  'metal_card',
  'pvc_card',
];

const DEFAULT_PRODUCTS: CatalogProduct[] = [
  {
    id: 'ecard',
    name: 'E-Card (Digital)',
    emoji: '📱',
    priceUsd: 12,
    isActive: true,
    kind: 'digital',
  },
  {
    id: 'wood_card',
    name: 'Wood Card',
    emoji: '🪵',
    priceUsd: 9.99,
    isActive: true,
    kind: 'material',
  },
  {
    id: 'metal_card',
    name: 'Metal Card',
    emoji: '⚙️',
    priceUsd: 14.99,
    isActive: true,
    kind: 'material',
  },
  {
    id: 'pvc_card',
    name: 'PVC Card',
    emoji: '💳',
    priceUsd: 6.99,
    isActive: true,
    kind: 'material',
  },
];

export function buildDefaultProductCatalog(): ProductCatalog {
  const products = {} as Record<CatalogProductId, CatalogProduct>;
  for (const product of DEFAULT_PRODUCTS) {
    products[product.id] = { ...product };
  }
  return { products, updatedAt: null };
}

export const DEFAULT_PRODUCT_CATALOG = buildDefaultProductCatalog();
