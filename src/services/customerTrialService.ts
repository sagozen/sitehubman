import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { CUSTOMER_TRIAL_DAYS } from '@/src/constants/customerTrial';
import { firebaseCollections } from '@/src/constants/collections';
import type { SocialChannelId } from '@/src/features/customer/types/connections';
import { db } from '@/src/services/firebaseClient';
import { loadGuestCloudCard } from '@/src/services/guestCardDraftService';
import { getBioPage, upsertBioPage } from '@/src/services/firestoreService';
import type { AppUser } from '@/src/types/models';

function addDays(from: Date, days: number): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

export function buildTrialWindow(days = CUSTOMER_TRIAL_DAYS): { trialStartedAt: string; trialEndsAt: string } {
  const now = new Date();
  return {
    trialStartedAt: now.toISOString(),
    trialEndsAt: addDays(now, days).toISOString(),
  };
}

export function isTrialExpired(trialEndsAt?: string | null): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() < Date.now();
}

export function hasActiveTrial(user: Pick<AppUser, 'plan' | 'trialEndsAt'>): boolean {
  if (user.trialEndsAt) return !isTrialExpired(user.trialEndsAt);
  return user.plan === 'guest_trial';
}

export function trialDaysRemaining(trialEndsAt?: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export async function grantCustomerTrial(userId: string, days = CUSTOMER_TRIAL_DAYS): Promise<void> {
  const window = buildTrialWindow(days);
  await setDoc(
    doc(db, firebaseCollections.users, userId),
    {
      plan: 'free',
      trialStartedAt: window.trialStartedAt,
      trialEndsAt: window.trialEndsAt,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    },
    { merge: true },
  );
}

function slugFromGuestCard(publicSlug: string | undefined, fullName: string, userId: string): string {
  const source = (publicSlug || fullName || 'profile').trim().toLowerCase();
  const base = source.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  const suffix = userId.slice(0, 6);
  return base ? `${base}-${suffix}` : `card-${suffix}`;
}

/** Publish the guest card design as a live digital profile — no payment required. */
export async function activateDigitalTrialFromGuestCard(user: AppUser, cardId?: string | null): Promise<void> {
  if (!cardId?.trim()) return;
  const card = await loadGuestCloudCard(cardId.trim());
  if (!card) return;

  const existingBio = await getBioPage(user.id);
  if (existingBio?.slug) return;

  const website = card.profile.website?.trim();
  await upsertBioPage(user.id, {
    slug: slugFromGuestCard(card.publicSlug, card.profile.fullName, user.id),
    displayName: card.profile.fullName || user.displayName || 'My Profile',
    tagline: [card.profile.role, card.profile.company].filter(Boolean).join(' · ') || undefined,
    email: card.profile.email || user.email || undefined,
    whatsapp: card.profile.phone || user.phone || undefined,
    telegram: card.profile.telegram || undefined,
    theme: 'vibrant_pink',
    customLinks: website ? [{ label: 'Website', url: website }] : [],
  });
}

export async function ensureCustomerTrialOnSignup(user: AppUser, cardId?: string | null): Promise<void> {
  // Trial window is now set during signup itself. Avoid extra user-doc writes here,
  // because self-update rules disallow mutating plan/trial fields post-conversion.
  await activateDigitalTrialFromGuestCard(user, cardId);
}

export async function updateBioHiddenChannels(userId: string, hiddenChannels: SocialChannelId[]): Promise<void> {
  await setDoc(
    doc(db, firebaseCollections.bioPages, userId),
    {
      hiddenChannels,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    },
    { merge: true },
  );
}
