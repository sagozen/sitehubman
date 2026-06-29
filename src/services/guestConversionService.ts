/**
 * guestConversionService.ts — Single entry point for guest → customer conversion.
 *
 * When a guest registers, logs in, or completes checkout, this service:
 *   1. Finds all cards owned by the guestId → updates ownerType to 'customer'
 *   2. Finds all orders with guestId → attaches customerId/userId
 *   3. Updates guests/{guestId}: status → 'converted', convertedToUserId
 *   4. Preserves cardId, orderId, orderNumber, publicSlug — no ID changes
 *
 * Production must never start from guestId alone.
 */

import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db } from '@/src/services/firebaseClient';
import {
  CURRENT_GUEST_ID_KEY,
  CURRENT_CARD_ID_KEY,
  type GuestDraftSession,
  type GuestCloudCard,
  loadGuestCloudCard,
} from '@/src/services/guestCardDraftService';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';
import { loadGuestLastOrderId } from '@/src/services/guestDraftService';
import { ensureCustomerTrialOnSignup } from '@/src/services/customerTrialService';
import type { AppUser, OwnerType } from '@/src/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConversionResult = {
  success: boolean;
  guestId: string | null;
  customerId: string;
  cardsConverted: number;
  ordersConverted: number;
  errors: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getStoredGuestSession(): Promise<{ guestId: string; cardId: string; guestAccessKey: string } | null> {
  const [guestId, cardId, guestAccessKey] = await Promise.all([
    AsyncStorage.getItem(CURRENT_GUEST_ID_KEY),
    AsyncStorage.getItem(CURRENT_CARD_ID_KEY),
    AsyncStorage.getItem('currentGuestAccessKey'),
  ]);
  if (!guestId) return null;
  return {
    guestId,
    cardId: cardId || '',
    guestAccessKey: guestAccessKey || '',
  };
}

/**
 * Find all cards belonging to a guest by guestId, sessionOwnerUid, or guestAccessKey.
 */
async function findGuestCards(
  guestId: string,
  guestAccessKey: string,
  sessionOwnerUid: string,
): Promise<{ docId: string; data: Record<string, unknown> }[]> {
  const cards = new Map<string, { docId: string; data: Record<string, unknown> }>();

  const constraints = [
    where('guestId', '==', guestId),
    where('guestAccessKey', '==', guestAccessKey),
    where('sessionOwnerUid', '==', sessionOwnerUid),
  ];

  await Promise.all(
    constraints.map(async (constraint) => {
      try {
        const snap = await getDocs(
          query(collection(db, firebaseCollections.cards), constraint, limit(50)),
        );
        snap.docs.forEach((cardDoc) => {
          cards.set(cardDoc.id, { docId: cardDoc.id, data: cardDoc.data() as Record<string, unknown> });
        });
      } catch {
        // Best-effort: some constraints may fail if indexes don't exist yet
      }
    }),
  );

  return [...cards.values()];
}

/**
 * Find all orders belonging to a guest by guestId.
 */
async function findGuestOrders(guestId: string): Promise<{ docId: string; data: Record<string, unknown> }[]> {
  try {
    const snap = await getDocs(
      query(collection(db, firebaseCollections.orders), where('guestId', '==', guestId), limit(50)),
    );
    return snap.docs.map((d) => ({ docId: d.id, data: d.data() as Record<string, unknown> }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main Conversion
// ---------------------------------------------------------------------------

/**
 * Convert a guest session into a customer account.
 *
 * This is the single entry point for guest → customer conversion.
 * Call this after successful sign-in or sign-up when a guest session exists.
 *
 * Guarantees:
 *   - All guest-owned cards transfer to customerId (ownerType: 'customer')
 *   - All guest orders attach customerId
 *   - Guest document marked as 'converted'
 *   - cardId, orderId, orderNumber, publicSlug are NEVER changed
 *   - Errors in individual transfers don't block the overall conversion
 */
export async function convertGuestToCustomer(
  user: AppUser,
  cardId?: string | null,
): Promise<ConversionResult> {
  const result: ConversionResult = {
    success: false,
    guestId: null,
    customerId: user.id,
    cardsConverted: 0,
    ordersConverted: 0,
    errors: [],
  };

  // 1. Resolve guest session
  const session = await getStoredGuestSession();
  if (!session?.guestId) {
    // No guest session — nothing to convert, but that's OK
    result.success = true;
    return result;
  }

  result.guestId = session.guestId;
  const sessionOwnerUid = auth.currentUser?.uid || user.id;
  const now = serverTimestamp();

  // 2. Resolve the card to convert
  const resolvedCardId = cardId?.trim() || session.cardId || (await getStoredGuestCardId()) || '';

  // 3. Transfer all guest cards to customer
  try {
    const guestCards = await findGuestCards(session.guestId, session.guestAccessKey, sessionOwnerUid);

    // Also include the specific stored card if not found via queries
    if (resolvedCardId) {
      const stored = await loadGuestCloudCard(resolvedCardId);
      if (stored && !guestCards.some((c) => c.docId === resolvedCardId)) {
        guestCards.push({ docId: resolvedCardId, data: {} });
      }
    }

    await Promise.all(
      guestCards.map(async (card) => {
        try {
          await setDoc(
            doc(db, firebaseCollections.cards, card.docId),
            {
              ownerId: user.id,
              ownerType: 'customer' as OwnerType,
              userId: user.id,
              guestId: session.guestId,
              guestAccessKey: session.guestAccessKey,
              sessionOwnerUid,
              previousGuestId: session.guestId,
              updatedAt: now,
            },
            { merge: true },
          );
          result.cardsConverted += 1;
        } catch (err) {
          result.errors.push(`Card ${card.docId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }),
    );
  } catch (err) {
    result.errors.push(`Card query failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 4. Transfer all guest orders to customer
  try {
    const guestOrders = await findGuestOrders(session.guestId);

    // Also transfer the last stored order
    const lastOrderId = await loadGuestLastOrderId();
    if (lastOrderId && !guestOrders.some((o) => o.docId === lastOrderId)) {
      guestOrders.push({ docId: lastOrderId, data: {} });
    }

    await Promise.all(
      guestOrders.map(async (order) => {
        try {
          await updateDoc(doc(db, firebaseCollections.orders, order.docId), {
            ownerId: user.id,
            ownerType: 'customer' as OwnerType,
            userId: user.id,
            createdBy: user.id,
            updatedBy: user.id,
            guestAccessKey: session.guestAccessKey,
            updatedAt: now,
          });
          result.ordersConverted += 1;
        } catch (err) {
          result.errors.push(`Order ${order.docId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }),
    );
  } catch (err) {
    result.errors.push(`Order query failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 5. Mark guest as converted
  try {
    const guestPayload = {
      guestId: session.guestId,
      status: 'converted',
      convertedToUserId: user.id,
      convertedAt: new Date().toISOString(),
      sessionOwnerUid,
      updatedAt: now,
    };

    await Promise.all([
      setDoc(doc(db, firebaseCollections.guests, session.guestId), guestPayload, { merge: true }),
      setDoc(doc(db, firebaseCollections.guestSessions, session.guestId), guestPayload, { merge: true }),
    ]);
  } catch (err) {
    result.errors.push(`Guest status update: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 6. Ensure customer trial
  try {
    await ensureCustomerTrialOnSignup(user, resolvedCardId || null);
  } catch {
    // Non-critical — don't block conversion
  }

  result.success = result.errors.length === 0;

  if (__DEV__) {
    console.log('[guestConversion] Conversion complete:', {
      guestId: result.guestId,
      customerId: result.customerId,
      cardsConverted: result.cardsConverted,
      ordersConverted: result.ordersConverted,
      errors: result.errors,
    });
  }

  return result;
}

/**
 * Clear stored guest session data from AsyncStorage after successful conversion.
 *
 * Call this AFTER conversion is confirmed successful and the user
 * has been redirected to the customer dashboard.
 */
export async function clearGuestSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    CURRENT_GUEST_ID_KEY,
    CURRENT_CARD_ID_KEY,
    'currentGuestAccessKey',
    'currentPublicSlug',
  ]);
}
