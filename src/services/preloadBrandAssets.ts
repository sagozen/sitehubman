import { getMarketingSceneBundled } from '@/src/constants/marketingScenes';
import { getProductPhotoUrl, productPhotoIds } from '@/src/constants/productPhotoCatalog';
import { authBrandAssets, brandAssets } from '@/src/constants/brandAssets';
import { prefetchCloudinaryUrls } from '@/src/services/cloudinaryUrlCache';
import { Image as RNImage, Platform, type ImageSourcePropType } from 'react-native';
import { isCloudinaryConfigured } from '@/src/utils/cloudinaryConfig';

const MARKETING_PRELOAD_SCENES = ['hero-home', 'splash', 'welcome'] as const;

const BUNDLED_MODULES: ImageSourcePropType[] = [
  brandAssets.logo,
  brandAssets.heroIllustration,
  authBrandAssets.google,
  authBrandAssets.telegram,
  ...MARKETING_PRELOAD_SCENES.map((id) => getMarketingSceneBundled(id)).filter(
    (source): source is ImageSourcePropType => Boolean(source)
  ),
];

const PRODUCT_PHOTO_IDS = [
  productPhotoIds.guestHero,
  productPhotoIds.guestDesign,
  productPhotoIds.guestTrack,
  productPhotoIds.salesDashboard,
  productPhotoIds.printerWorkshop,
  productPhotoIds.customerAccount,
] as const;

function resolveBundledUri(source: ImageSourcePropType): string | null {
  if (typeof source === 'object' && source !== null && 'uri' in source) {
    const uri = source.uri;
    return typeof uri === 'string' && uri.length > 0 ? uri : null;
  }

  // resolveAssetSource exists on native RN Image only — not on web.
  if (Platform.OS === 'web') return null;
  const resolve = RNImage.resolveAssetSource;
  if (typeof resolve !== 'function') return null;

  try {
    return resolve(source)?.uri ?? null;
  } catch {
    return null;
  }
}

/** Warm Cloudinary product URLs + bundled brand icons at app start. */
export async function preloadBrandAssets(): Promise<void> {
  try {
    if (isCloudinaryConfigured()) {
      const urls = PRODUCT_PHOTO_IDS.map((id) => getProductPhotoUrl(id, 960)).filter(Boolean);
      if (urls.length) {
        await prefetchCloudinaryUrls(urls, 960);
      }
      return;
    }

    if (Platform.OS === 'web') return;

    const uris = BUNDLED_MODULES.map(resolveBundledUri).filter((uri): uri is string => Boolean(uri));
    if (!uris.length) return;

    await Promise.all(
      uris.map(async (uri) => {
        try {
          await RNImage.prefetch(uri);
        } catch {
          // ignore
        }
      }),
    );
  } catch {
    // Preload must never block or crash app startup.
  }
}
