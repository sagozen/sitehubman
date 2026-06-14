/**
 * Social Media Avatar URLs
 * Get real profile pictures from social media platforms
 */

/**
 * Get Instagram profile picture URL
 * Format: https://instagram.com/{username}
 */
export function getInstagramAvatar(username: string): string {
  const clean = username.replace('@', '').trim();
  // Instagram Graph API requires auth, but we can use external services or direct image proxy
  return `https://unavatar.io/instagram/${clean}`;
}

/**
 * Get Twitter/X profile picture URL
 */
export function getTwitterAvatar(username: string): string {
  const clean = username.replace('@', '').trim();
  return `https://unavatar.io/twitter/${clean}`;
}

/**
 * Get Facebook profile picture URL
 */
export function getFacebookAvatar(username: string): string {
  const clean = username.trim();
  return `https://unavatar.io/facebook/${clean}`;
}

/**
 * Get LinkedIn profile picture URL
 * Note: LinkedIn doesn't provide public avatars easily
 */
export function getLinkedinAvatar(username: string): string {
  const clean = username.trim();
  // LinkedIn requires auth, using generic fallback
  return `https://unavatar.io/linkedin/${clean}`;
}

/**
 * Get Telegram profile picture URL
 * Note: Telegram doesn't expose avatars publicly
 */
export function getTelegramAvatar(username: string): string | null {
  // Telegram doesn't provide public avatar API
  return null;
}

/**
 * Get WhatsApp profile picture URL
 * Note: WhatsApp doesn't expose avatars publicly
 */
export function getWhatsappAvatar(phone: string): string | null {
  // WhatsApp doesn't provide public avatar API
  return null;
}

/**
 * Get email Gravatar URL
 */
export function getGravatarUrl(email: string): string {
  // Use Gravatar for email addresses
  const hash = email.trim().toLowerCase();
  // For simplicity, using unavatar which handles gravatar
  return `https://unavatar.io/${hash}`;
}

/**
 * Get social media avatar URL by platform
 */
export function getSocialAvatar(
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'telegram' | 'whatsapp' | 'email',
  identifier: string
): string | null {
  switch (platform) {
    case 'instagram':
      return getInstagramAvatar(identifier);
    case 'twitter':
      return getTwitterAvatar(identifier);
    case 'facebook':
      return getFacebookAvatar(identifier);
    case 'linkedin':
      return getLinkedinAvatar(identifier);
    case 'telegram':
      return getTelegramAvatar(identifier);
    case 'whatsapp':
      return getWhatsappAvatar(identifier);
    case 'email':
      return getGravatarUrl(identifier);
    default:
      return null;
  }
}

/**
 * Alternative service: Using ui-avatars.com for fallback initials
 */
export function getInitialsAvatar(name: string, background = '2596BE', color = 'ffffff'): string {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${background}&color=${color}&size=128&bold=true`;
}
