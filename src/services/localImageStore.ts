import { resolveOptimizedImageUrl } from '@/src/services/cloudinaryService';
import { isCloudinaryUrl } from '@/src/utils/cloudinaryConfig';

/**
 * @deprecated Local image file storage removed — use Cloudinary URLs only.
 * Kept as a thin resolver for legacy file:// references in drafts.
 */
export async function resolveStoredImageUri(uri: string | undefined | null): Promise<string | null> {
  if (!uri?.trim()) return null;
  const trimmed = uri.trim();
  if (trimmed.startsWith('file://') || trimmed.startsWith('data:')) return null;
  return resolveOptimizedImageUrl(trimmed) ?? trimmed;
}

/** @deprecated Images are not cached to device storage — HTTP cache + URL cache only. */
export async function cacheRemoteImage(url: string): Promise<string> {
  return resolveOptimizedImageUrl(url) ?? url;
}

/** @deprecated Upload to Cloudinary instead of persisting picker URIs locally. */
export async function persistPickerImage(_sourceUri: string, _key: string): Promise<string> {
  throw new Error('Local image storage is disabled. Upload to Cloudinary instead.');
}

/** @deprecated */
export function isPersistedLocalImageUri(_uri: string | undefined | null): boolean {
  return false;
}

export function isRemoteImageUrl(uri: string | undefined | null): boolean {
  if (!uri?.trim()) return false;
  return uri.startsWith('http://') || uri.startsWith('https://') || isCloudinaryUrl(uri);
}
