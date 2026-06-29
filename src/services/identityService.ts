/**
 * identityService.ts — Centralized ID generation and identity resolution.
 *
 * All entity IDs in SiteHubMan follow a prefix convention:
 *   guestId      → GST_xxxxxxxx   (temporary visitor identity)
 *   cardId       → BC-NFC_XXXXXXXX (card identity)
 *   orderNumber  → ORD_xxxxxxxx   (human-readable order reference)
 *   profileSlug  → chanthean-a1b2c3 (public profile URL segment)
 *
 * Firestore document IDs remain auto-generated for orders.
 * `orderNumber` is a business-facing display ID stored as a field.
 */

import { collection, doc } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { firebaseCollections } from '@/src/constants/collections';

// ---------------------------------------------------------------------------
// Characters & helpers
// ---------------------------------------------------------------------------

const SLUG_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomString(length: number, charset = SLUG_CHARS): string {
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += charset[Math.floor(Math.random() * charset.length)];
  }
  return value;
}

/**
 * Extract the first 8 alphanumeric chars from a Firestore auto-ID.
 * Falls back to a random string if the auto-ID is empty or unavailable.
 */
function firestoreFragment(collectionName: string, length = 8): string {
  try {
    const raw = doc(collection(db, collectionName)).id?.replace(/[^a-zA-Z0-9]/g, '') ?? '';
    return raw.slice(0, length) || randomString(length, ALPHANUM);
  } catch {
    return randomString(length, ALPHANUM);
  }
}

// ---------------------------------------------------------------------------
// ID Generators
// ---------------------------------------------------------------------------

/** Generate a guest identity ID: `GST_xxxxxxxx` */
export function generateGuestId(): string {
  return `GST_${firestoreFragment(firebaseCollections.guests)}`;
}

/** Generate a card identity ID: `BC-NFC_XXXXXXXX` */
export function generateCardId(): string {
  return `BC-NFC_${firestoreFragment(firebaseCollections.cards).toUpperCase()}`;
}

/**
 * Generate a human-readable order number: `ORD_xxxxxxxx`
 *
 * This is NOT the Firestore document ID — it is stored as a field on the order
 * document for display, search, receipts, and customer support.
 */
export function generateOrderNumber(): string {
  return `ORD_${firestoreFragment(firebaseCollections.orders)}`;
}

/**
 * Generate a public profile slug from a name.
 *
 * If a name is provided, creates `name-suffix` (e.g. `chanthean-a1b2c3`).
 * Otherwise, generates a random 8-character slug.
 */
export function generateProfileSlug(name?: string): string {
  const suffix = randomString(6, ALPHANUM.toLowerCase());
  if (!name?.trim()) return randomString(8);

  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return base ? `${base}-${suffix}` : randomString(8);
}

/**
 * Generate a guest access key — a long random token for session verification.
 */
export function generateGuestAccessKey(length = 28): string {
  return randomString(length, ALPHANUM);
}

// ---------------------------------------------------------------------------
// Identity Resolution
// ---------------------------------------------------------------------------

export type OwnerIdentity = {
  ownerId: string;
  ownerType: 'guest' | 'customer';
  userId: string | null;
  guestId: string;
};

/**
 * Resolve the owner identity for a card or order based on the current state.
 *
 * - If a real `userId` is provided and the user is not anonymous, ownership
 *   is assigned to the customer.
 * - Otherwise, the guest retains ownership.
 */
export function resolveOwnerIdentity(
  guestId: string,
  userId?: string | null,
  isAnonymous?: boolean,
): OwnerIdentity {
  const cleanUserId = userId?.trim() || null;

  if (cleanUserId && !isAnonymous) {
    return {
      ownerId: cleanUserId,
      ownerType: 'customer',
      userId: cleanUserId,
      guestId,
    };
  }

  return {
    ownerId: guestId,
    ownerType: 'guest',
    userId: null,
    guestId,
  };
}

/** Check if an ownerId belongs to a guest (starts with `GST_`). */
export function isGuestIdentity(ownerId: string): boolean {
  return ownerId.startsWith('GST_');
}

/** Check if an ownerId belongs to a customer (does NOT start with `GST_`). */
export function isCustomerIdentity(ownerId: string): boolean {
  return Boolean(ownerId) && !ownerId.startsWith('GST_');
}

/** Check if a card ID follows the `BC-NFC_` format. */
export function isValidCardId(cardId: string): boolean {
  return /^BC-NFC_[A-Z0-9]{4,}$/.test(cardId);
}

/** Check if an order number follows the `ORD_` format. */
export function isValidOrderNumber(orderNumber: string): boolean {
  return /^ORD_[a-zA-Z0-9]{4,}$/.test(orderNumber);
}
