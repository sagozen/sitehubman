import { Linking, Platform } from 'react-native';

/**
 * Universal Native Deep Link Handler
 * Opens native mobile apps directly with zero browser redirect delay.
 */

export interface SocialLinkTarget {
  platform: 'whatsapp' | 'telegram' | 'linkedin' | 'instagram' | 'phone' | 'email' | 'website' | 'x' | 'youtube' | 'facebook';
  value: string; // Phone number, username, handle, or URL
}

export async function openNativeDeepLink(target: SocialLinkTarget): Promise<void> {
  const { platform, value } = target;
  if (!value) return;

  const cleanVal = value.trim();

  let nativeUrl = '';
  let webFallback = '';

  switch (platform) {
    case 'whatsapp': {
      const cleanPhone = cleanVal.replace(/[^0-9+]/g, '').replace('+', '');
      nativeUrl = `whatsapp://send?phone=${cleanPhone}`;
      webFallback = `https://wa.me/${cleanPhone}`;
      break;
    }

    case 'telegram': {
      const cleanUsername = cleanVal.replace('@', '').replace('https://t.me/', '');
      nativeUrl = `tg://resolve?domain=${cleanUsername}`;
      webFallback = `https://t.me/${cleanUsername}`;
      break;
    }

    case 'linkedin': {
      const cleanHandle = cleanVal.replace('https://www.linkedin.com/in/', '').replace('https://linkedin.com/in/', '').replace('/', '');
      nativeUrl = `linkedin://profile/${cleanHandle}`;
      webFallback = cleanVal.startsWith('http') ? cleanVal : `https://linkedin.com/in/${cleanHandle}`;
      break;
    }

    case 'instagram': {
      const cleanUsername = cleanVal.replace('@', '').replace('https://instagram.com/', '').replace('/', '');
      nativeUrl = `instagram://user?username=${cleanUsername}`;
      webFallback = `https://instagram.com/${cleanUsername}`;
      break;
    }

    case 'phone': {
      const cleanPhone = cleanVal.replace(/[^0-9+]/g, '');
      nativeUrl = `tel:${cleanPhone}`;
      webFallback = `tel:${cleanPhone}`;
      break;
    }

    case 'email': {
      nativeUrl = `mailto:${cleanVal}`;
      webFallback = `mailto:${cleanVal}`;
      break;
    }

    case 'x': {
      const cleanHandle = cleanVal.replace('@', '').replace('https://x.com/', '').replace('https://twitter.com/', '');
      nativeUrl = `twitter://user?screen_name=${cleanHandle}`;
      webFallback = `https://x.com/${cleanHandle}`;
      break;
    }

    default: {
      const url = cleanVal.startsWith('http') ? cleanVal : `https://${cleanVal}`;
      nativeUrl = url;
      webFallback = url;
      break;
    }
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(webFallback, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
    } else {
      await Linking.openURL(webFallback);
    }
  } catch {
    await Linking.openURL(webFallback).catch(() => undefined);
  }
}
