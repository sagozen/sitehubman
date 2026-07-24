/**
 * SeoHead.tsx
 * Injects rich SEO meta tags for Expo web output:
 * - Standard HTML meta (title, description, keywords, robots)
 * - Open Graph / Facebook (og:title, og:description, og:image, og:url, og:type)
 * - Twitter Card (summary_large_image)
 * - JSON-LD Structured Data (WebPage, Person)
 * - Canonical URL
 * - Apple mobile web app meta tags
 *
 * Usage:
 *   <SeoHead
 *     title="Profile | SiteHub Man"
 *     description="..."
 *     slug="john-doe"          // optional, for /u/[slug] pages
 *     displayName="John Doe"   // optional
 *     imageUrl="https://..."   // optional OG image
 *   />
 */

import { Platform } from 'react-native';

interface SeoHeadProps {
  title?: string;
  description?: string;
  slug?: string;
  displayName?: string;
  headline?: string;
  imageUrl?: string;
  type?: 'website' | 'profile' | 'article';
  noIndex?: boolean;
}

const BASE_URL = 'https://sitehubman.vercel.app';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;
const SITE_NAME = 'SiteHub Man';

export function SeoHead({
  title = 'SiteHub Man – Smart NFC Digital Business Cards',
  description = 'Create premium NFC digital business cards, share your bio instantly via tap or QR code, and track every interaction. The future of networking.',
  slug,
  displayName,
  headline,
  imageUrl,
  type = 'website',
  noIndex = false,
}: SeoHeadProps) {
  // Only render on web platform
  if (Platform.OS !== 'web') return null;

  const canonicalUrl = slug ? `${BASE_URL}/u/${slug}` : BASE_URL;
  const ogImage = imageUrl || DEFAULT_OG_IMAGE;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  // Build JSON-LD structured data
  const jsonLd =
    slug && displayName
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: displayName,
            description: headline || description,
            url: canonicalUrl,
            image: ogImage,
            sameAs: [`${BASE_URL}/u/${slug}`],
          },
          url: canonicalUrl,
          name: fullTitle,
          description,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: SITE_NAME,
          description,
          url: BASE_URL,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'iOS, Android, Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        };

  // Inject via document.head for web
  if (typeof document !== 'undefined') {
    injectMeta({ title: fullTitle, description, slug, displayName, ogImage, canonicalUrl, type, noIndex, jsonLd });
  }

  return null;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

interface InjectMetaArgs {
  title: string;
  description: string;
  slug?: string;
  displayName?: string;
  ogImage: string;
  canonicalUrl: string;
  type: string;
  noIndex: boolean;
  jsonLd: object;
}

function injectMeta({ title, description, ogImage, canonicalUrl, type, noIndex, jsonLd }: InjectMetaArgs) {
  // Page title
  document.title = title;

  // Standard meta
  setMeta('description', description);
  setMeta('keywords', 'NFC card, digital business card, smart card, bio link, QR code, contactless sharing, tap to share, networking, profile link, GENFC');
  setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  setMeta('author', 'SiteHub Man');
  setMeta('application-name', 'SiteHub Man');

  // Apple mobile web app
  setMeta('apple-mobile-web-app-capable', 'yes');
  setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  setMeta('apple-mobile-web-app-title', 'SiteHub Man');
  setMeta('mobile-web-app-capable', 'yes');
  setMeta('theme-color', '#0B1220');
  setMeta('color-scheme', 'dark');

  // Viewport
  setMeta('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');

  // Open Graph
  setMeta('og:type', type, 'property');
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:url', canonicalUrl, 'property');
  setMeta('og:image', ogImage, 'property');
  setMeta('og:image:width', '1200', 'property');
  setMeta('og:image:height', '630', 'property');
  setMeta('og:image:alt', title, 'property');
  setMeta('og:site_name', 'SiteHub Man', 'property');
  setMeta('og:locale', 'en_US', 'property');

  // Twitter Card
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', ogImage);
  setMeta('twitter:image:alt', title);
  setMeta('twitter:site', '@sitehubman');
  setMeta('twitter:creator', '@sitehubman');

  // Canonical
  setLink('canonical', canonicalUrl);

  // JSON-LD structured data
  let ldScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(jsonLd);
}
