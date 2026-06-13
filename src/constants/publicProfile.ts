/** Public host written to NFC chips and printed QR codes. */
const DEFAULT_PUBLIC_PROFILE_HOST = 'https://sitehubman.vercel.app';

function normalizePublicProfileHost(host?: string): string {
  const value = host?.trim() || DEFAULT_PUBLIC_PROFILE_HOST;
  return value.replace(/\/+$/, '');
}

export const PUBLIC_PROFILE_HOST = normalizePublicProfileHost(
  process.env.EXPO_PUBLIC_PROFILE_HOST
);

export function buildCardProfileUrl(cardId: string): string {
  const id = cardId.trim();
  return `${PUBLIC_PROFILE_HOST}/c/${encodeURIComponent(id)}`;
}

export function buildSlugProfileUrl(slug: string): string {
  const s = slug.trim().toLowerCase();
  return `${PUBLIC_PROFILE_HOST}/p/${encodeURIComponent(s)}`;
}

/** @deprecated Use buildCardProfileUrl; kept for order fields named profileUrl. */
export function buildProfileUrl(cardId: string): string {
  return buildCardProfileUrl(cardId);
}
