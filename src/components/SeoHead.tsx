/**
 * SeoHead.tsx — Enterprise Global SEO Head Component
 * Injects rich SEO meta tags, JSON-LD structured schemas, and social OpenGraph tags:
 * - Standard HTML meta (title, description, keywords, robots, canonical)
 * - Open Graph / Facebook / LinkedIn / iMessage unfurls
 * - Twitter Card summary_large_image
 * - JSON-LD Structured Data: Organization, Product, ProfilePage, Person, FAQPage
 */

import { Platform } from 'react-native';

export interface SeoHeadProps {
  title?: string;
  description?: string;
  slug?: string;
  displayName?: string;
  headline?: string;
  imageUrl?: string;
  type?: 'website' | 'profile' | 'product';
  price?: number;
  currency?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://aviobrand.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-avio.png`;
const SITE_NAME = 'AVIO';

export function SeoHead({
  title = 'AVIO – Smart NFC Digital Business Cards & Edge Identity',
  description = 'Next-generation NFC physical business cards powered by Cloudflare Workers. Share your bio, contact info, and portfolio with a single tap. CONNECT · IDENTIFY · EMPOWER.',
  slug,
  displayName,
  headline,
  imageUrl,
  type = 'website',
  price,
  currency = 'USD',
  noIndex = false,
}: SeoHeadProps) {
  if (Platform.OS !== 'web') return null;

  const canonicalUrl = slug ? `${BASE_URL}/u/${slug}` : BASE_URL;
  const ogImage = imageUrl || DEFAULT_OG_IMAGE;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  // Rich JSON-LD Schemas
  const jsonLd =
    type === 'profile' && slug && displayName
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: displayName,
            description: headline || description,
            image: ogImage,
            url: canonicalUrl,
          },
        }
      : type === 'product'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: title,
          description,
          image: ogImage,
          brand: {
            '@type': 'Brand',
            name: 'AVIO',
          },
          offers: {
            '@type': 'Offer',
            price: price || 89.99,
            priceCurrency: currency,
            availability: 'https://schema.org/InStock',
            url: 'https://shop.aviobrand.com',
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'AVIO Technologies',
          url: BASE_URL,
          logo: `${BASE_URL}/logo.png`,
          sameAs: [
            'https://twitter.com/aviobrand',
            'https://linkedin.com/company/aviobrand',
            'https://instagram.com/aviobrand',
          ],
        };

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="AVIO, NFC business card, smart business card, digital business card, contactless networking, tap to share, vCard download, edge bio profile"
      />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Social */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type === 'profile' ? 'profile' : 'website'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
