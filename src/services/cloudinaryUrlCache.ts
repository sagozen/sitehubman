import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CloudinaryTransformOptions } from '@/src/services/cloudinaryService';
import { optimizeCloudinaryUrl, resolveOptimizedImageUrl } from '@/src/services/cloudinaryService';
import { isCloudinaryUrl } from '@/src/utils/cloudinaryConfig';

const CACHE_PREFIX = 'sitehub_cloudinary_url_v1:';
const MAX_ENTRIES = 200;

function cacheKey(source: string, options: CloudinaryTransformOptions): string {
  const parts = [
    source,
    options.width ?? '',
    options.height ?? '',
    options.crop ?? '',
    options.thumbnail ? 'thumb' : '',
    options.format ?? 'auto',
  ];
  return `${CACHE_PREFIX}${parts.join('|')}`;
}

/** Cache optimized Cloudinary URL strings locally — never image binaries. */
export async function getCachedOptimizedUrl(
  source: string | null | undefined,
  options: CloudinaryTransformOptions = {},
): Promise<string> {
  const trimmed = source?.trim() ?? '';
  if (!trimmed) return trimmed;

  const optimized = resolveOptimizedImageUrl(trimmed, options) ?? trimmed;
  if (!isCloudinaryUrl(optimized)) return optimized;

  const key = cacheKey(trimmed, options);
  try {
    const hit = await AsyncStorage.getItem(key);
    if (hit) return hit;
    await AsyncStorage.setItem(key, optimized);
    await trimCacheIfNeeded();
  } catch {
    // ignore cache failures
  }
  return optimized;
}

export async function prefetchCloudinaryUrls(urls: string[], width = 800): Promise<void> {
  const { Image } = await import('react-native');
  await Promise.all(
    urls.map(async (url) => {
      if (!url.trim()) return;
      const optimized = isCloudinaryUrl(url)
        ? optimizeCloudinaryUrl(url, { width, crop: 'limit', format: 'auto', quality: 'auto' })
        : url;
      await getCachedOptimizedUrl(url, { width, crop: 'limit' });
      try {
        await Image.prefetch(optimized);
      } catch {
        // ignore prefetch errors
      }
    }),
  );
}

async function trimCacheIfNeeded(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()) ?? [];
    const ours = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (ours.length <= MAX_ENTRIES) return;
    const drop = ours.slice(0, ours.length - MAX_ENTRIES);
    await AsyncStorage.multiRemove(drop);
  } catch {
    // ignore
  }
}
