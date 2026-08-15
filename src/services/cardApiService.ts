/**
 * Card API Service — Web <-> App Bi-directional Sync & Analytics
 *
 * Implements full 14 user-editable profile fields, unlimited social links,
 * and automated analytics tracking (card views & link clicks).
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export type CardProfileLayout = 'minimal' | 'bold' | 'photo_forward';

export type CardProfileTheme =
  | 'classic_dark'
  | 'clean_light'
  | 'aqua_glow'
  | 'emerald_pro'
  | 'sunset_amber'
  | 'violet_luxe';

/** The 14 User-Editable Profile Fields + Automatic Timestamps */
export interface CardProfileData {
  id: string;
  ownerUserId: string;
  slug: string;
  name: string;
  jobType: string;
  title: string;
  bio: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  avatarUrl: string;
  theme: CardProfileTheme;
  layout: CardProfileLayout;
  vibes: string[]; // up to 5 personality tags
  createdAt: string;
  updatedAt: string;
}

/** Supported Social Platforms */
export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'x'
  | 'spotify'
  | 'discord'
  | 'twitch'
  | 'github'
  | 'linkedin'
  | 'bolt';

export interface CardSocialLink {
  id: string;
  profileId: string;
  platform: SocialPlatform;
  handle: string;
  url: string;
  displayOrder: number;
}

/** Analytics Tracking: Card Views (source: "nfc" tap or "direct" visit) */
export interface CardViewRecord {
  id: string;
  profileId: string;
  source: 'nfc' | 'direct';
  timestamp: string;
  device?: string;
  country?: string;
}

/** Analytics Tracking: Link Clicks */
export interface LinkClickRecord {
  id: string;
  profileId: string;
  platform: SocialPlatform | string;
  url: string;
  timestamp: string;
}

export interface CardAnalyticsSummary {
  totalViews: number;
  nfcTaps: number;
  directVisits: number;
  totalLinkClicks: number;
  clicksByPlatform: Record<string, number>;
}

/** Complete Card Package for Web <-> App JSON Integration */
export interface CardPackageJson {
  profile: CardProfileData;
  socialLinks: CardSocialLink[];
  analytics: CardAnalyticsSummary;
  apiVersion: '1.0';
  exportedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & COLLECTIONS
// ═══════════════════════════════════════════════════════════════════════════

const COLLECTIONS = {
  PROFILES: 'profiles',
  SOCIAL_LINKS: 'social_links',
  CARD_VIEWS: 'card_views',
  LINK_CLICKS: 'link_clicks',
};

// ═══════════════════════════════════════════════════════════════════════════
// API IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch a profile by its custom URL slug (e.g. tap.io/your-name)
 */
export async function getCardProfileBySlug(slug: string): Promise<{
  profile: CardProfileData;
  socialLinks: CardSocialLink[];
} | null> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  try {
    const q = query(
      collection(db, COLLECTIONS.PROFILES),
      where('slug', '==', cleanSlug),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const profile = mapFirestoreToProfile(docSnap.id, docSnap.data());
    const socialLinks = await getSocialLinksForProfile(profile.id);

    return { profile, socialLinks };
  } catch (err) {
    console.error('getCardProfileBySlug error:', err);
    return null;
  }
}

/**
 * Fetch profile by profileId
 */
export async function getCardProfileById(profileId: string): Promise<{
  profile: CardProfileData;
  socialLinks: CardSocialLink[];
} | null> {
  try {
    const ref = doc(db, COLLECTIONS.PROFILES, profileId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const profile = mapFirestoreToProfile(snap.id, snap.data());
    const socialLinks = await getSocialLinksForProfile(profile.id);

    return { profile, socialLinks };
  } catch (err) {
    console.error('getCardProfileById error:', err);
    return null;
  }
}

/**
 * Fetch all social links for a profile, ordered by displayOrder
 */
export async function getSocialLinksForProfile(profileId: string): Promise<CardSocialLink[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SOCIAL_LINKS),
      where('profileId', '==', profileId)
    );
    const snap = await getDocs(q);

    const links: CardSocialLink[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        profileId,
        platform: (data.platform || 'instagram') as SocialPlatform,
        handle: data.handle || '',
        url: data.url || '',
        displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
      };
    });

    return links.sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (err) {
    console.error('getSocialLinksForProfile error:', err);
    return [];
  }
}

/**
 * Save or update full 14-field Profile + Social Links
 */
export async function saveCardProfile(
  profileInput: Partial<CardProfileData> & { id: string },
  socialLinksInput?: Omit<CardSocialLink, 'profileId'>[]
): Promise<CardProfileData> {
  const profileId = profileInput.id;
  const now = new Date().toISOString();

  const profileRef = doc(db, COLLECTIONS.PROFILES, profileId);
  const existingSnap = await getDoc(profileRef).catch(() => null);

  const existingData = existingSnap?.exists() ? existingSnap.data() : {};
  const createdAt = existingData?.createdAt || profileInput.createdAt || now;

  // Enforce vibes tag limit (up to 5 tags)
  const vibes = Array.isArray(profileInput.vibes)
    ? profileInput.vibes.slice(0, 5)
    : existingData?.vibes || ['Goated', 'Lowkey'];

  const profileData: CardProfileData = {
    id: profileId,
    ownerUserId: profileInput.ownerUserId || existingData?.ownerUserId || '',
    slug: (profileInput.slug || existingData?.slug || profileId).toLowerCase().trim(),
    name: profileInput.name ?? existingData?.name ?? 'Alex Rivers',
    jobType: profileInput.jobType ?? existingData?.jobType ?? 'Content Creator',
    title: profileInput.title ?? existingData?.title ?? 'Founder & Creative Lead',
    bio: profileInput.bio ?? existingData?.bio ?? 'Building the next gen digital identities.',
    phone: profileInput.phone ?? existingData?.phone ?? '',
    email: profileInput.email ?? existingData?.email ?? '',
    website: profileInput.website ?? existingData?.website ?? '',
    location: profileInput.location ?? existingData?.location ?? 'San Francisco, CA',
    avatarUrl: profileInput.avatarUrl ?? existingData?.avatarUrl ?? '',
    theme: profileInput.theme ?? existingData?.theme ?? 'classic_dark',
    layout: profileInput.layout ?? existingData?.layout ?? 'minimal',
    vibes,
    createdAt,
    updatedAt: now,
  };

  await setDoc(profileRef, profileData, { merge: true });

  // Update social links if provided
  if (socialLinksInput) {
    await updateSocialLinksForProfile(profileId, socialLinksInput);
  }

  return profileData;
}

/**
 * Update social links for a profile
 */
export async function updateSocialLinksForProfile(
  profileId: string,
  links: Omit<CardSocialLink, 'profileId'>[]
): Promise<void> {
  // Delete existing links for this profile
  const existingLinks = await getSocialLinksForProfile(profileId);
  await Promise.all(
    existingLinks.map((link) => setDoc(doc(db, COLLECTIONS.SOCIAL_LINKS, link.id), { _deleted: true }, { merge: true }))
  );

  // Add new links
  await Promise.all(
    links.map((link, index) => {
      const linkId = link.id || `${profileId}_link_${index}_${Date.now()}`;
      return setDoc(
        doc(db, COLLECTIONS.SOCIAL_LINKS, linkId),
        {
          id: linkId,
          profileId,
          platform: link.platform,
          handle: link.handle,
          url: link.url,
          displayOrder: typeof link.displayOrder === 'number' ? link.displayOrder : index,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    })
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Automatically track a Card View (source: "nfc" tap or "direct" visit)
 */
export async function trackCardView(
  profileId: string,
  source: 'nfc' | 'direct' = 'direct',
  metadata?: { device?: string; country?: string }
): Promise<void> {
  if (!profileId) return;

  const now = new Date().toISOString();

  // 1. Log view entry in `card_views` collection
  void addDoc(collection(db, COLLECTIONS.CARD_VIEWS), {
    profileId,
    source,
    timestamp: now,
    device: metadata?.device || 'Mobile Browser',
    country: metadata?.country || 'Global',
  }).catch(() => null);

  // 2. Increment counters on profile
  const profileRef = doc(db, COLLECTIONS.PROFILES, profileId);
  const incField = source === 'nfc' ? { views: increment(1), nfcTaps: increment(1) } : { views: increment(1), directVisits: increment(1) };

  void updateDoc(profileRef, incField).catch(() => null);
}

/**
 * Automatically track a Link Click (which platform was tapped)
 */
export async function trackLinkClick(
  profileId: string,
  platform: string,
  url: string
): Promise<void> {
  if (!profileId) return;

  const now = new Date().toISOString();

  // Log link click entry in `link_clicks` collection
  void addDoc(collection(db, COLLECTIONS.LINK_CLICKS), {
    profileId,
    platform,
    url,
    timestamp: now,
  }).catch(() => null);

  // Increment aggregate link clicks on profile
  const profileRef = doc(db, COLLECTIONS.PROFILES, profileId);
  void updateDoc(profileRef, {
    linkClicks: increment(1),
    [`clicks_${platform}`]: increment(1),
  }).catch(() => null);
}

/**
 * Fetch complete analytics summary for a card profile
 */
export async function getCardAnalytics(profileId: string): Promise<CardAnalyticsSummary> {
  try {
    const viewsQuery = query(
      collection(db, COLLECTIONS.CARD_VIEWS),
      where('profileId', '==', profileId)
    );
    const clicksQuery = query(
      collection(db, COLLECTIONS.LINK_CLICKS),
      where('profileId', '==', profileId)
    );

    const [viewsSnap, clicksSnap] = await Promise.all([
      getDocs(viewsQuery).catch(() => ({ docs: [] })),
      getDocs(clicksQuery).catch(() => ({ docs: [] })),
    ]);

    let nfcTaps = 0;
    let directVisits = 0;

    viewsSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.source === 'nfc') nfcTaps++;
      else directVisits++;
    });

    const clicksByPlatform: Record<string, number> = {};
    clicksSnap.docs.forEach((d) => {
      const data = d.data();
      const p = data.platform || 'other';
      clicksByPlatform[p] = (clicksByPlatform[p] || 0) + 1;
    });

    return {
      totalViews: nfcTaps + directVisits,
      nfcTaps,
      directVisits,
      totalLinkClicks: clicksSnap.docs.length,
      clicksByPlatform,
    };
  } catch (err) {
    console.error('getCardAnalytics error:', err);
    return {
      totalViews: 0,
      nfcTaps: 0,
      directVisits: 0,
      totalLinkClicks: 0,
      clicksByPlatform: {},
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WEB <-> APP JSON INTEGRATION API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export full Card Profile package as standardized JSON for Web & Mobile
 */
export async function exportCardProfileJson(profileId: string): Promise<CardPackageJson | null> {
  const result = await getCardProfileById(profileId);
  if (!result) return null;

  const analytics = await getCardAnalytics(profileId);

  return {
    profile: result.profile,
    socialLinks: result.socialLinks,
    analytics,
    apiVersion: '1.0',
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import a Card Profile JSON package (from Web or Bolt DB into App)
 */
export async function importCardProfileJson(pkg: CardPackageJson): Promise<CardProfileData> {
  if (!pkg || !pkg.profile || !pkg.profile.id) {
    throw new Error('Invalid CardPackageJson format');
  }

  const savedProfile = await saveCardProfile(pkg.profile, pkg.socialLinks);
  return savedProfile;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAPPER UTILITY
// ═══════════════════════════════════════════════════════════════════════════

function mapFirestoreToProfile(id: string, data: Record<string, any>): CardProfileData {
  return {
    id,
    ownerUserId: data.ownerUserId || data.userId || '',
    slug: data.slug || data.publicSlug || id,
    name: data.name || data.fullName || data.displayName || 'Alex Rivers',
    jobType: data.jobType || data.role || 'Content Creator',
    title: data.title || data.jobTitle || 'Creative Lead',
    bio: data.bio || data.tagline || '',
    phone: data.phone || '',
    email: data.email || '',
    website: data.website || '',
    location: data.location || data.address || '',
    avatarUrl: data.avatarUrl || data.photoUrl || '',
    theme: data.theme || 'classic_dark',
    layout: data.layout || 'minimal',
    vibes: Array.isArray(data.vibes) ? data.vibes : ['Goated', 'Lowkey'],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}
