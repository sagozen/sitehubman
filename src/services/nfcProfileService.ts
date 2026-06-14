import { Platform } from 'react-native';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { buildCardProfileUrl, buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { db } from '@/src/services/firebaseClient';
import {
  BioPage,
  BioTheme,
  NfcCard,
  NfcCardLifecycleStatus,
  NfcStatus,
  Profile,
  TapEventSource,
} from '@/src/types/models';

function toIso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export function verificationToLifecycle(status: NfcStatus): NfcCardLifecycleStatus {
  switch (status) {
    case 'verified':
      return 'active';
    case 'written':
    case 'writing':
      return 'encoded';
    case 'disabled':
      return 'disabled';
    case 'not_written':
    default:
      return 'assigned';
  }
}

export function lifecycleToVerification(status: NfcCardLifecycleStatus): NfcStatus {
  switch (status) {
    case 'active':
      return 'verified';
    case 'encoded':
      return 'written';
    case 'disabled':
      return 'disabled';
    case 'blank':
      return 'not_written';
    case 'assigned':
    default:
      return 'not_written';
  }
}

export function bioPageToProfile(bio: BioPage): Profile {
  const published = bio.status !== 'expired';
  return {
    profileId: bio.id,
    ownerUserId: bio.ownerUid ?? bio.userId,
    publicSlug: bio.publicSlug ?? bio.slug,
    name: bio.displayName,
    phone: bio.whatsapp,
    email: bio.email,
    tagline: bio.tagline,
    photoUrl: bio.photoUrl,
    whatsapp: bio.whatsapp,
    instagram: bio.instagram,
    telegram: bio.telegram,
    links: bio.customLinks ?? [],
    theme: bio.theme,
    isPublished: published,
    views: bio.views,
    taps: bio.taps,
    updatedAt: bio.updatedAt,
  };
}

export function profileToBioPage(profile: Profile): BioPage {
  return {
    id: profile.profileId,
    userId: profile.ownerUserId,
    ownerUid: profile.ownerUserId,
    slug: profile.publicSlug,
    publicSlug: profile.publicSlug,
    status: profile.isPublished ? 'active' : 'expired',
    displayName: profile.name,
    tagline: profile.tagline,
    photoUrl: profile.photoUrl,
    whatsapp: profile.whatsapp ?? profile.phone,
    instagram: profile.instagram,
    telegram: profile.telegram,
    email: profile.email,
    customLinks: profile.links,
    theme: profile.theme,
    views: profile.views,
    taps: profile.taps,
    updatedAt: profile.updatedAt,
  };
}

function mapBioPage(id: string, data: Record<string, unknown>): BioPage {
  return {
    id,
    userId: String(data.userId ?? id),
    ownerUid: data.ownerUid ? String(data.ownerUid) : undefined,
    slug: String(data.slug ?? ''),
    publicSlug: data.publicSlug ? String(data.publicSlug) : undefined,
    status: data.status as BioPage['status'],
    displayName: String(data.displayName ?? ''),
    tagline: data.tagline ? String(data.tagline) : undefined,
    photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
    whatsapp: data.whatsapp ? String(data.whatsapp) : undefined,
    instagram: data.instagram ? String(data.instagram) : undefined,
    telegram: data.telegram ? String(data.telegram) : undefined,
    email: data.email ? String(data.email) : undefined,
    customLinks: Array.isArray(data.customLinks) ? (data.customLinks as BioPage['customLinks']) : [],
    theme: (data.theme as BioTheme) ?? 'vibrant_pink',
    views: typeof data.views === 'number' ? data.views : 0,
    taps: typeof data.taps === 'number' ? data.taps : 0,
    updatedAt: toIso(data.updatedAt),
  };
}

async function readBioPage(userId: string): Promise<BioPage | null> {
  const snap = await getDoc(doc(db, firebaseCollections.bioPages, userId));
  if (!snap.exists()) return null;
  return mapBioPage(snap.id, snap.data() as Record<string, unknown>);
}

async function readNfcCard(cardId: string): Promise<NfcCard | null> {
  const snap = await getDoc(doc(db, firebaseCollections.nfcCards, cardId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    cardId: data.cardId ?? snap.id,
    chipUID: data.chipUID ?? '',
    profileUrl: data.profileUrl ?? '',
    orderId: data.orderId ?? '',
    cardCode: data.cardCode ?? snap.id,
    ownerUserId: data.ownerUserId,
    profileId: data.profileId,
    status: data.status,
    writtenBy: data.writtenBy ?? '',
    writtenAt: toIso(data.writtenAt),
    verificationStatus: data.verificationStatus ?? 'not_written',
    updatedAt: toIso(data.updatedAt),
  };
}

async function readOrderByCardCode(cardCode: string): Promise<{ createdBy: string } | null> {
  const normalized = cardCode.trim().toUpperCase();
  if (!normalized) return null;
  try {
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.orders), where('cardCode', '==', normalized))
    );
    const first = snapshot.docs[0];
    if (!first) return null;
    return { createdBy: String(first.data().createdBy ?? '') };
  } catch {
    return null;
  }
}

function cardProfileToBioPage(id: string, data: Record<string, unknown>): BioPage {
  const profile = (data.profile && typeof data.profile === 'object' ? data.profile : {}) as Record<string, unknown>;
  const design = (data.design && typeof data.design === 'object' ? data.design : {}) as Record<string, unknown>;
  const publicSlug = String(data.publicSlug ?? id).trim();
  const displayName = String(profile.fullName ?? '').trim() || 'NFC Profile';
  const tagline = [profile.role, profile.company]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .join(' · ');

  return {
    id,
    userId: String(data.userId ?? data.guestId ?? id),
    ownerUid: typeof data.userId === 'string' ? data.userId : undefined,
    slug: publicSlug,
    publicSlug,
    status: 'active',
    displayName,
    tagline: tagline || (typeof profile.bio === 'string' ? profile.bio : undefined),
    photoUrl: typeof design.avatarUrl === 'string' ? design.avatarUrl : undefined,
    whatsapp: typeof profile.phone === 'string' ? profile.phone : undefined,
    instagram: undefined,
    telegram: typeof profile.telegram === 'string' ? profile.telegram : undefined,
    email: typeof profile.email === 'string' ? profile.email : undefined,
    customLinks: typeof profile.website === 'string' && profile.website.trim()
      ? [{ label: 'Website', url: profile.website.trim() }]
      : [],
    theme: 'vibrant_pink',
    views: typeof data.views === 'number' ? data.views : 0,
    taps: typeof data.taps === 'number' ? data.taps : 0,
    updatedAt: toIso(data.updatedAt),
  };
}

async function resolvePublishedCardByPublicSlug(publicSlug: string): Promise<PublicProfileResolve | null> {
  const normalized = publicSlug.trim();
  if (!normalized) return null;

  const cardSnap = await getDocs(
    query(
      collection(db, firebaseCollections.cards),
      where('publicSlug', '==', normalized),
      where('status', 'in', [
        'preview_ready',
        'ordered',
        'locked',
        'printed',
        'encoded',
        'verified',
        'active',
        'published',
      ])
    )
  );
  const cardDoc = cardSnap.docs[0];
  if (!cardDoc) return null;

  return {
    bioPage: cardProfileToBioPage(cardDoc.id, cardDoc.data() as Record<string, unknown>),
    profileId: cardDoc.id,
    cardId: cardDoc.id,
    publicUrl: buildCardProfileUrl(normalized),
  };
}

function mapProfileDoc(id: string, data: Record<string, unknown>): Profile {
  return {
    profileId: id,
    ownerUserId: String(data.ownerUserId ?? id),
    publicSlug: String(data.publicSlug ?? data.slug ?? ''),
    name: String(data.name ?? data.displayName ?? ''),
    phone: data.phone ? String(data.phone) : undefined,
    email: data.email ? String(data.email) : undefined,
    tagline: data.tagline ? String(data.tagline) : undefined,
    photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
    whatsapp: data.whatsapp ? String(data.whatsapp) : undefined,
    instagram: data.instagram ? String(data.instagram) : undefined,
    telegram: data.telegram ? String(data.telegram) : undefined,
    links: Array.isArray(data.links) ? (data.links as Profile['links']) : [],
    theme: (data.theme as Profile['theme']) ?? 'vibrant_pink',
    isPublished: data.isPublished !== false,
    views: typeof data.views === 'number' ? data.views : 0,
    taps: typeof data.taps === 'number' ? data.taps : 0,
    updatedAt: toIso(data.updatedAt),
  };
}

/**
 * When a user saves their bio page, also update the `profile` sub-object on
 * their linked card document so the card face reflects the latest name/phone/email.
 */
export async function syncBioToCard(
  userId: string,
  bio: { displayName: string; whatsapp?: string; email?: string; telegram?: string; tagline?: string; photoUrl?: string },
): Promise<void> {
  if (!userId.trim()) return;
  try {
    // Find the user's card by userId or ownerId
    const snap = await getDocs(
      query(collection(db, firebaseCollections.cards), where('userId', '==', userId), limit(1))
    );
    const cardDoc = snap.docs[0];
    if (!cardDoc) return;
    await setDoc(
      cardDoc.ref,
      {
        profile: {
          fullName: bio.displayName.trim(),
          phone: bio.whatsapp?.trim() ?? '',
          email: bio.email?.trim() ?? '',
          telegram: bio.telegram?.trim() ?? '',
          role: bio.tagline?.trim() ?? '',
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Best-effort: don't break bio save if card sync fails
  }
}

export async function syncProfileFromBio(userId: string, bio: Omit<BioPage, 'id' | 'userId' | 'updatedAt'> & { slug: string }): Promise<void> {
  const slug = bio.slug.trim().toLowerCase();
  const isPublished = bio.status !== 'expired';
  await setDoc(
    doc(db, firebaseCollections.profiles, userId),
    {
      profileId: userId,
      ownerUserId: userId,
      publicSlug: slug,
      name: bio.displayName,
      phone: bio.whatsapp,
      email: bio.email,
      tagline: bio.tagline,
      photoUrl: bio.photoUrl,
      whatsapp: bio.whatsapp,
      instagram: bio.instagram,
      telegram: bio.telegram,
      links: bio.customLinks ?? [],
      theme: bio.theme,
      isPublished,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getProfile(profileId: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, firebaseCollections.profiles, profileId));
  if (snap.exists()) {
    return mapProfileDoc(snap.id, snap.data() as Record<string, unknown>);
  }
  const bio = await readBioPage(profileId);
  return bio ? bioPageToProfile(bio) : null;
}

export async function ensureNfcCardAssigned(input: {
  cardId: string;
  orderId?: string;
  ownerUserId?: string;
  profileId?: string;
  chipUID?: string;
}): Promise<void> {
  const cardId = input.cardId.trim();
  if (!cardId) return;

  const ref = doc(db, firebaseCollections.nfcCards, cardId);
  const existing = await getDoc(ref);
  const profileUrl = buildCardProfileUrl(cardId);

  await setDoc(
    ref,
    {
      cardId,
      cardCode: cardId,
      chipUID: input.chipUID ?? cardId,
      profileUrl,
      orderId: input.orderId ?? existing.data()?.orderId ?? '',
      ownerUserId: input.ownerUserId ?? existing.data()?.ownerUserId,
      profileId: input.profileId ?? existing.data()?.profileId,
      status: (existing.data()?.status as NfcCardLifecycleStatus) ?? 'assigned',
      verificationStatus: existing.data()?.verificationStatus ?? 'not_written',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export type PublicProfileResolve = {
  bioPage: BioPage;
  profileId: string;
  cardId?: string;
  publicUrl: string;
};

export async function resolvePublicProfileByCardId(cardId: string): Promise<PublicProfileResolve | null> {
  const normalized = cardId.trim();
  if (!normalized) return null;

  let card: NfcCard | null = await readNfcCard(normalized);
  if (!card) {
    const upper = normalized.toUpperCase();
    if (upper !== normalized) card = await readNfcCard(upper);
  }

  if (card?.status === 'disabled') return null;

  let profileId = card?.profileId;
  if (!profileId) {
    const order = await readOrderByCardCode(normalized);
    if (order) {
      profileId = order.createdBy;
    }
  }

  if (!profileId) {
    return resolvePublishedCardByPublicSlug(normalized);
  }

  const profile = await getProfile(profileId);
  if (!profile || !profile.isPublished) {
    const bio = await readBioPage(profileId);
    if (!bio || bio.status === 'expired') return null;
    return {
      bioPage: bio,
      profileId,
      cardId: normalized,
      publicUrl: buildCardProfileUrl(normalized),
    };
  }

  return {
    bioPage: profileToBioPage(profile),
    profileId,
    cardId: normalized,
    publicUrl: buildCardProfileUrl(normalized),
  };
}

export async function resolvePublicProfileBySlug(slug: string): Promise<PublicProfileResolve | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const card = await resolvePublishedCardByPublicSlug(normalized);
  if (card) return card;

  const profileQuery = await getDocs(
    query(
      collection(db, firebaseCollections.profiles),
      where('publicSlug', '==', normalized),
      where('isPublished', '==', true)
    )
  );
  const profileDoc = profileQuery.docs[0];
  if (profileDoc) {
    const profile = mapProfileDoc(profileDoc.id, profileDoc.data() as Record<string, unknown>);
    if (!profile.isPublished) return null;
    return {
      bioPage: profileToBioPage(profile),
      profileId: profile.profileId,
      publicUrl: buildSlugProfileUrl(normalized),
    };
  }

  const bioSnap = await getDocs(
    query(
      collection(db, firebaseCollections.bioPages),
      where('slug', '==', normalized),
      where('status', 'in', ['active', 'trial']),
    ),
  );
  const bioDoc = bioSnap.docs[0];
  const bio = bioDoc ? mapBioPage(bioDoc.id, bioDoc.data() as Record<string, unknown>) : null;
  if (!bio || bio.status === 'expired') return null;

  return {
    bioPage: bio,
    profileId: bio.id,
    publicUrl: buildSlugProfileUrl(normalized),
  };
}

export async function recordTapEvent(input: {
  profileId: string;
  cardId?: string;
  source: TapEventSource;
  country?: string;
}): Promise<void> {
  if (!input.profileId.trim()) return;

  await addDoc(collection(db, firebaseCollections.tapEvents), {
    profileId: input.profileId,
    cardId: input.cardId?.trim() || undefined,
    device: Platform.OS,
    country: input.country,
    source: input.source,
    createdAt: serverTimestamp(),
  });
}
