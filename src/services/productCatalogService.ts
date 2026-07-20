import { collection, getDocs } from 'firebase/firestore';
import {
  buildDefaultProductCatalog,
  CATALOG_PRODUCT_IDS,
  type CatalogProduct,
  type CatalogProductId,
  type ProductCatalog,
} from '@/src/constants/productCatalogDefaults';
import type { ProductType } from '@/src/constants/options';
import { db } from '@/src/services/firebaseClient';

let cache: ProductCatalog | null = null;
let loadPromise: Promise<ProductCatalog> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeProductCatalog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProductCatalogSync(): ProductCatalog {
  return cache ?? buildDefaultProductCatalog();
}

function mergeRemoteProduct(base: CatalogProduct, raw: Record<string, unknown>): CatalogProduct {
  const price = typeof raw.price === 'number' ? raw.price : Number(raw.price);
  return {
    ...base,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : base.name,
    emoji: typeof raw.emoji === 'string' && raw.emoji.trim() ? raw.emoji : base.emoji,
    priceUsd: Number.isFinite(price) && price >= 0 ? price : base.priceUsd,
    isActive: raw.isActive !== false,
  };
}

export async function refreshProductCatalog(): Promise<ProductCatalog> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const defaults = buildDefaultProductCatalog();
    try {
      const snap = await getDocs(collection(db, 'products'));
      const remoteById = new Map(snap.docs.map((docSnap) => [docSnap.id, docSnap.data()]));

      for (const id of CATALOG_PRODUCT_IDS) {
        const base = defaults.products[id];
        const remote = remoteById.get(id);
        if (remote && typeof remote === 'object') {
          defaults.products[id] = mergeRemoteProduct(base, remote as Record<string, unknown>);
        }
      }

      const latestUpdate = snap.docs
        .map((docSnap) => docSnap.data().updatedAt)
        .find((value) => value != null);
      defaults.updatedAt =
        latestUpdate && typeof latestUpdate === 'object' && 'toDate' in latestUpdate
          ? (latestUpdate as { toDate: () => Date }).toDate().toISOString()
          : null;
    } catch {
      // Offline or rules — keep bundled defaults.
    }

    cache = defaults;
    notify();
    return cache;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export function invalidateProductCatalogCache() {
  cache = null;
}

export function getEcardPriceUsd(): number {
  const product = getProductCatalogSync().products.ecard;
  return product.isActive ? product.priceUsd : buildDefaultProductCatalog().products.ecard.priceUsd;
}

export function getMaterialPriceUsd(material: ProductType): number {
  const product = getProductCatalogSync().products[material];
  if (!product || !product.isActive) {
    return buildDefaultProductCatalog().products[material].priceUsd;
  }
  return product.priceUsd;
}

/** Physical NFC checkout — material price from live catalog. */
export function getPhysicalPriceUsd(material?: ProductType): number {
  if (material) return getMaterialPriceUsd(material);
  return getMaterialPriceUsd('pvc_card');
}

export function getActiveMaterialProductOptions() {
  const catalog = getProductCatalogSync();
  return CATALOG_PRODUCT_IDS.filter((id) => id !== 'ecard')
    .map((id) => catalog.products[id as ProductType])
    .filter((product) => product.isActive)
    .map((product) => ({
      label: product.name,
      value: product.id as ProductType,
      price: product.priceUsd,
      emoji: product.emoji,
    }));
}

/** Material + digital options with live Firestore prices. */
export function getProductTypeOptions() {
  const catalog = getProductCatalogSync();
  return CATALOG_PRODUCT_IDS.map((id) => {
    const product = catalog.products[id];
    return {
      label: product.name,
      value: id === 'ecard' ? 'ecard' : (id as ProductType),
      price: product.priceUsd,
      emoji: product.emoji,
      isActive: product.isActive,
    };
  }).filter((option) => option.isActive || option.value === 'ecard');
}

export function getCatalogProduct(id: CatalogProductId): CatalogProduct {
  return getProductCatalogSync().products[id];
}

export function resolveLineTotalUsd(
  productType: string,
  quantity: number,
  material?: ProductType,
): number {
  const qty = Math.max(1, quantity);
  if (productType === 'ecard') {
    return getEcardPriceUsd() * qty;
  }
  if (productType === 'physical_nfc' || material) {
    return getPhysicalPriceUsd(material) * qty;
  }
  if (material) {
    return getMaterialPriceUsd(material) * qty;
  }
  const materialMatch = CATALOG_PRODUCT_IDS.find((id) => id === productType && id !== 'ecard');
  if (materialMatch) {
    return getMaterialPriceUsd(materialMatch as ProductType) * qty;
  }
  return getPhysicalPriceUsd('pvc_card') * qty;
}
