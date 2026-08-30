/**
 * @package packages/shared
 * Shared TypeScript types used by BOTH:
 *   - Mobile App (React Native / Expo) at root
 *   - Web App (Vite / React) at web/
 *
 * Import in mobile: import type { CardProfile } from '../../packages/shared/types';
 * Import in web:    import type { CardProfile } from '../../packages/shared/types';
 */

// ─── Core Card Profile ────────────────────────────────────────────────────────

export interface CardProfile {
  id: string;
  slug: string;
  userId: string;

  // Identity
  fullName: string;
  jobType?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;

  // Contact
  phone?: string;
  email?: string;
  website?: string;
  location?: string;

  // Design
  theme?: CardTheme;
  layout?: CardLayout;

  // Social
  socialLinks?: SocialLink[];
  vibes?: Vibe[];

  // Analytics
  analytics?: CardAnalytics;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ─── Social Links ─────────────────────────────────────────────────────────────

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'x'
  | 'linkedin'
  | 'github'
  | 'spotify'
  | 'youtube'
  | 'facebook'
  | 'snapchat'
  | 'pinterest'
  | 'discord'
  | 'telegram'
  | 'website'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
  displayOrder: number;
  isVisible: boolean;
}

// ─── Vibes / Tags ────────────────────────────────────────────────────────────

export type Vibe =
  | 'creative'
  | 'tech'
  | 'business'
  | 'music'
  | 'fitness'
  | 'food'
  | 'travel'
  | 'gaming'
  | 'fashion'
  | 'art'
  | 'sports'
  | 'education'
  | string; // allows custom vibes

// ─── Card Design ─────────────────────────────────────────────────────────────

export type CardTheme = 'dark' | 'light' | 'midnight' | 'amber' | 'ocean';

export type CardLayout = 'classic' | 'minimal' | 'bold' | 'card';

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface CardAnalytics {
  totalViews: number;
  nfcTaps: number;
  qrScans: number;
  linkClicks: number;
  contactSaves: number;
}

export interface AnalyticsEvent {
  cardId: string;
  slug: string;
  source: 'nfc' | 'qr' | 'direct' | 'web';
  eventType: 'card_view' | 'link_click' | 'contact_save';
  platform?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface CardSyncPayload {
  cardId: string;
  slug: string;
  profile: Omit<CardProfile, 'id' | 'slug' | 'userId'>;
}

export interface AuthSyncPayload {
  userId: string;
  email: string;
  displayName?: string;
  provider: 'google' | 'apple' | 'email' | 'telegram';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── NFC Specific ─────────────────────────────────────────────────────────────

export interface NfcTag {
  id: string;
  cardId?: string;
  slug?: string;
  encodedAt?: string;
  isEncoded: boolean;
}

export interface DeepLinkParams {
  cardId?: string;
  slug?: string;
  source?: string;
}
