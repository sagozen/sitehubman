import { Platform } from 'react-native';
import {
  getCloudinaryCloudName,
  getCloudinaryFolder,
  getCloudinaryUploadPreset,
  isCloudinaryConfigured,
  isCloudinaryUrl,
} from '@/src/utils/cloudinaryConfig';

export type CloudinaryTransformOptions = {
  width?: number;
  height?: number;
  /** cover | limit | fill | scale */
  crop?: 'cover' | 'limit' | 'fill' | 'scale';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  /** Thumbnail preset — square crop. */
  thumbnail?: boolean;
};

export type CloudinaryUploadInput = {
  uri: string;
  folder?: string;
  fileName?: string | null;
  mimeType?: string | null;
  tags?: string[];
  /** Optional public_id suffix (folder still applied). */
  publicId?: string;
};

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_FOLDER_DEPTH = 5;
const SAFE_SEGMENT_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
  'video/webm'
]);

function safeFileName(fileName?: string | null) {
  const fallback = `upload-${Date.now()}.jpg`;
  return (fileName || fallback).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
}

function assertAllowedImageType(mimeType?: string | null) {
  const type = mimeType?.trim().toLowerCase();
  if (type && !ALLOWED_IMAGE_TYPES.has(type)) {
    throw new Error('Only JPG, PNG, WebP, HEIC, or HEIF images are supported.');
  }
}

function normalizeCloudinaryFolder(folder: string): string {
  const trimmed = folder.trim().replace(/^\/+|\/+$/g, '');
  const parts = trimmed.split('/').filter(Boolean);
  if (
    parts.length === 0 ||
    parts.length > MAX_FOLDER_DEPTH ||
    parts[0] !== 'sitehub' ||
    parts.some((part) => !SAFE_SEGMENT_PATTERN.test(part))
  ) {
    throw new Error('Invalid upload folder.');
  }
  return parts.join('/');
}

function normalizeTags(tags?: string[]) {
  return (tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40))
    .filter(Boolean)
    .slice(0, 8);
}

function normalizePublicId(publicId?: string) {
  const trimmed = publicId?.trim();
  if (!trimmed) return '';
  const normalized = trimmed.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9_/-]/g, '-');
  if (normalized.includes('..') || normalized.split('/').some((part) => !part || !SAFE_SEGMENT_PATTERN.test(part))) {
    throw new Error('Invalid image identifier.');
  }
  return normalized.slice(0, 160);
}

/** Compress on dev/production builds; skip when native module is unavailable (e.g. Expo Go). */
async function compressVideoUri(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri;

  try {
    const { Video } = await import('react-native-compressor');
    return await Video.compress(uri, { compressionMethod: 'auto' });
  } catch {
    return uri;
  }
}

async function getNativeFileSize(uri: string): Promise<number | null> {
  if (Platform.OS === 'web') return null;
  try {
    const FileSystem = await import('expo-file-system');
    const info = await FileSystem.getInfoAsync(uri, { size: true } as unknown as undefined);
    const size = (info as { exists?: boolean; size?: number }).size;
    return info.exists && typeof size === 'number' ? size : null;
  } catch {
    return null;
  }
}

function assertUploadSize(size: number | null | undefined) {
  if (typeof size === 'number' && size > MAX_UPLOAD_BYTES) {
    throw new Error('Image must be smaller than 10 MB.');
  }
}

function buildTransformSegment(options: CloudinaryTransformOptions): string {
  const parts: string[] = [`f_${options.format ?? 'auto'}`, `q_${options.quality ?? 'auto'}`];

  if (options.thumbnail) {
    const size = options.width ?? options.height ?? 200;
    parts.push(`w_${size}`, `h_${size}`, 'c_fill', 'g_auto');
    return parts.join(',');
  }

  if (options.width) parts.push(`w_${Math.round(options.width)}`);
  if (options.height) parts.push(`h_${Math.round(options.height)}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  else if (options.width || options.height) parts.push('c_limit');

  return parts.join(',');
}

/** Build an optimized delivery URL from a Cloudinary public ID. */
export function buildCloudinaryUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {},
): string {
  const cloud = getCloudinaryCloudName();
  if (!cloud) return '';
  const id = publicId.replace(/^\/+/, '');
  const transform = buildTransformSegment(options);
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${id}`;
}

/** Insert or replace transformation segment on an existing Cloudinary HTTPS URL. */
export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  options: CloudinaryTransformOptions = {},
): string {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return trimmed;
  if (!isCloudinaryUrl(trimmed)) return trimmed;

  const marker = '/upload/';
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return trimmed;

  const prefix = trimmed.slice(0, idx + marker.length);
  let rest = trimmed.slice(idx + marker.length);
  const transform = buildTransformSegment(options);

  const firstSlash = rest.indexOf('/');
  if (firstSlash > 0) {
    const head = rest.slice(0, firstSlash);
    if (head.includes(',') && !head.startsWith('v')) {
      rest = rest.slice(firstSlash + 1);
    }
  }

  return `${prefix}${transform}/${rest}`;
}

/** Responsive srcset-style width for device pixel ratio. */
export function pickResponsiveWidth(requestedWidth?: number, pixelRatio = Platform.OS === 'web' ? 1 : 2): number {
  const base = requestedWidth ?? 800;
  return Math.min(Math.round(base * pixelRatio), 2400);
}

export function buildThumbnailUrl(source: string, size = 200): string {
  if (isCloudinaryUrl(source)) {
    return optimizeCloudinaryUrl(source, { thumbnail: true, width: size, height: size });
  }
  return source;
}

export async function uploadImageToCloudinary(
  input: CloudinaryUploadInput,
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
    );
  }

  const cloud = getCloudinaryCloudName();
  const preset = getCloudinaryUploadPreset();
  const folder = normalizeCloudinaryFolder(input.folder?.trim() || getCloudinaryFolder());
  const uri = input.uri.trim();
  if (!uri) throw new Error('Image file is required.');
  assertAllowedImageType(input.mimeType);

  const formData = new FormData();
  const name = safeFileName(input.fileName);

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Unable to read selected image.');
    const blob = await response.blob();
    assertAllowedImageType(blob.type || input.mimeType);
    assertUploadSize(blob.size);
    formData.append('file', blob, name);
  } else {
    assertUploadSize(await getNativeFileSize(uri));
    formData.append('file', {
      uri,
      type: input.mimeType || 'image/jpeg',
      name,
    } as unknown as Blob);
  }

  formData.append('upload_preset', preset);
  formData.append('folder', folder);
  const tags = normalizeTags(input.tags);
  if (tags.length) formData.append('tags', tags.join(','));
  const publicId = normalizePublicId(input.publicId);
  if (publicId) formData.append('public_id', publicId);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
  const uploadResponse = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '');
    throw new Error(detail || 'Cloudinary upload failed.');
  }

  const payload = (await uploadResponse.json()) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
  };

  if (!payload.secure_url || !payload.public_id) {
    throw new Error('Cloudinary upload returned an invalid response.');
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    width: payload.width ?? 0,
    height: payload.height ?? 0,
  };
}

export async function uploadVideoToCloudinary(
  input: CloudinaryUploadInput,
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
    );
  }

  const cloud = getCloudinaryCloudName();
  const preset = getCloudinaryUploadPreset();
  const folder = normalizeCloudinaryFolder(input.folder?.trim() || getCloudinaryFolder());
  const uri = input.uri.trim();
  if (!uri) throw new Error('Video file is required.');

  const type = input.mimeType?.trim().toLowerCase() || 'video/mp4';
  if (!ALLOWED_VIDEO_TYPES.has(type)) {
    throw new Error('Only MP4, MOV, M4V, or WebM videos are supported.');
  }

  const formData = new FormData();
  let finalUri = uri;

  if (Platform.OS !== 'web') {
    finalUri = await compressVideoUri(uri);
  }

  const name = safeFileName(input.fileName || `video-${Date.now()}.mp4`);

  if (Platform.OS === 'web') {
    const response = await fetch(finalUri);
    if (!response.ok) throw new Error('Unable to read selected video.');
    const blob = await response.blob();
    formData.append('file', blob, name);
  } else {
    const size = await getNativeFileSize(finalUri);
    if (size && size > 50 * 1024 * 1024) {
      throw new Error('Video must be smaller than 50 MB after compression.');
    }
    formData.append('file', {
      uri: finalUri,
      type,
      name,
    } as unknown as Blob);
  }

  formData.append('upload_preset', preset);
  formData.append('folder', folder);
  const tags = normalizeTags(input.tags);
  if (tags.length) formData.append('tags', tags.join(','));
  const publicId = normalizePublicId(input.publicId);
  if (publicId) formData.append('public_id', publicId);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/video/upload`;
  const uploadResponse = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '');
    throw new Error(detail || 'Cloudinary upload failed.');
  }

  const payload = (await uploadResponse.json()) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
  };

  if (!payload.secure_url || !payload.public_id) {
    throw new Error('Cloudinary upload returned an invalid response.');
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    width: payload.width ?? 0,
    height: payload.height ?? 0,
  };
}

/** Normalize any image reference to an optimized Cloudinary delivery URL. */
export function resolveOptimizedImageUrl(
  source: string | null | undefined,
  options: CloudinaryTransformOptions = {},
): string | null {
  const trimmed = source?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:')) return trimmed;
  if (isCloudinaryUrl(trimmed)) return optimizeCloudinaryUrl(trimmed, options);
  if (!isCloudinaryConfigured()) return trimmed;
  return trimmed;
}
