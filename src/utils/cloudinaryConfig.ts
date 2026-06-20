/** Cloudinary delivery + upload preset config. Lock unsigned presets to the SiteHub folder in Cloudinary. */
export function getCloudinaryCloudName(): string {
  return process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? '';
}

export function getCloudinaryUploadPreset(): string {
  return process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() ?? '';
}

export function getCloudinaryFolder(): string {
  return process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER?.trim() || 'sitehub';
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(getCloudinaryCloudName() && getCloudinaryUploadPreset());
}

export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return url.includes('res.cloudinary.com/');
}
