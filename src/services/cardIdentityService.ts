import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { buildCardProfileUrl } from '@/src/constants/publicProfile';
import { db } from '@/src/services/firebaseClient';

export type CardProductionStatus =
  | 'draft'
  | 'preview_ready'
  | 'ordered'
  | 'locked'
  | 'printed'
  | 'encoded'
  | 'verified'
  | 'active'
  | 'published';

export type CardIdentity = {
  id: string;
  cardId: string;
  ownerId?: string;
  ownerType?: string;
  userId?: string;
  guestId?: string;
  publicSlug: string;
  publicProfileUrl: string;
  lockedPublicProfileUrl?: string;
  printProfileUrl?: string;
  status: CardProductionStatus;
  designLocked: boolean;
  productionOrderId?: string;
  profile?: Record<string, unknown>;
  design?: Record<string, unknown>;
  nfcPasskey?: string;
};

const PRINT_READY_STATUSES = new Set<CardProductionStatus>([
  'locked',
  'printed',
  'encoded',
  'verified',
  'active',
  'published',
]);

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function resolveCardPublicProfileUrl(cardId: string, data: Record<string, unknown>): string {
  const explicit =
    stringOrUndefined(data.publicProfileUrl)
    || stringOrUndefined(data.lockedPublicProfileUrl)
    || stringOrUndefined(data.printProfileUrl);
  if (explicit) return explicit;
  const publicSlug = stringOrUndefined(data.publicSlug) || cardId;
  return buildCardProfileUrl(publicSlug);
}

export function mapCardIdentity(cardId: string, data: Record<string, unknown>): CardIdentity {
  const publicSlug = stringOrUndefined(data.publicSlug) || cardId;
  const status = (stringOrUndefined(data.status) || 'draft') as CardProductionStatus;
  const profile = data.profile && typeof data.profile === 'object'
    ? data.profile as Record<string, unknown>
    : undefined;
  const design = data.design && typeof data.design === 'object'
    ? data.design as Record<string, unknown>
    : undefined;

  return {
    id: cardId,
    cardId: stringOrUndefined(data.cardId) || cardId,
    ownerId: stringOrUndefined(data.ownerId),
    ownerType: stringOrUndefined(data.ownerType),
    userId: stringOrUndefined(data.userId),
    guestId: stringOrUndefined(data.guestId),
    publicSlug,
    publicProfileUrl: resolveCardPublicProfileUrl(cardId, data),
    lockedPublicProfileUrl: stringOrUndefined(data.lockedPublicProfileUrl),
    printProfileUrl: stringOrUndefined(data.printProfileUrl),
    status,
    designLocked: data.designLocked === true || PRINT_READY_STATUSES.has(status),
    productionOrderId: stringOrUndefined(data.productionOrderId),
    profile,
    design,
    nfcPasskey: stringOrUndefined(data.nfcPasskey),
  };
}

export async function getCardIdentity(cardId: string): Promise<CardIdentity | null> {
  const id = cardId.trim();
  if (!id) return null;
  const snap = await getDoc(doc(db, firebaseCollections.cards, id));
  if (!snap.exists()) return null;
  return mapCardIdentity(snap.id, snap.data() as Record<string, unknown>);
}

export async function ensureCardIdentity(input: {
  cardId: string;
  ownerId: string;
  ownerType: 'guest' | 'customer' | 'staff' | 'manual';
  userId?: string | null;
  guestId?: string | null;
  publicSlug?: string;
  status?: CardProductionStatus;
  profile?: Record<string, unknown>;
  design?: Record<string, unknown>;
  orderId?: string;
  createdBy?: string;
}): Promise<CardIdentity> {
  const cardId = input.cardId.trim();
  if (!cardId) throw new Error('Card ID is required.');
  const publicSlug = input.publicSlug?.trim() || cardId;
  const publicProfileUrl = buildCardProfileUrl(publicSlug);
  const ref = doc(db, firebaseCollections.cards, cardId);
  const existing = await getDoc(ref);
  const payload = {
    cardId,
    ownerId: input.ownerId,
    ownerType: input.ownerType,
    userId: input.userId ?? null,
    guestId: input.guestId ?? null,
    publicSlug,
    publicProfileUrl,
    status: input.status ?? 'preview_ready',
    profile: input.profile,
    design: input.design,
    productionOrderId: input.orderId,
    createdBy: input.createdBy,
    createdAt: existing.exists() ? undefined : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(
    ref,
    Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)),
    { merge: true },
  );
  const updated = await getCardIdentity(cardId);
  if (!updated) throw new Error('Card was not found after save.');
  return updated;
}

export async function lockCardForProduction(cardId: string, orderId: string, userId: string): Promise<CardIdentity> {
  let card = await getCardIdentity(cardId);
  if (!card) {
    card = await ensureCardIdentity({
      cardId,
      ownerId: userId,
      ownerType: 'customer',
      orderId,
    });
  }
  if (!card.publicProfileUrl || !card.publicProfileUrl.trim()) {
    const publicSlug = card.publicSlug || cardId;
    const fallbackUrl = buildCardProfileUrl(publicSlug);
    await updateDoc(doc(db, firebaseCollections.cards, card.cardId), {
      publicProfileUrl: fallbackUrl,
      lockedPublicProfileUrl: fallbackUrl,
      printProfileUrl: fallbackUrl,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
    card.publicProfileUrl = fallbackUrl;
    card.lockedPublicProfileUrl = fallbackUrl;
    card.printProfileUrl = fallbackUrl;
  }

  await updateDoc(doc(db, firebaseCollections.cards, card.cardId), {
    status: 'locked' satisfies CardProductionStatus,
    designLocked: true,
    designLockedAt: serverTimestamp(),
    designLockedBy: userId,
    productionOrderId: orderId,
    lockedPublicProfileUrl: card.lockedPublicProfileUrl || card.publicProfileUrl,
    printProfileUrl: card.printProfileUrl || card.publicProfileUrl,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  await recordProductionLog({
    action: 'card_locked_for_production',
    orderId,
    cardId: card.cardId,
    actorId: userId,
  });

  const locked = await getCardIdentity(card.cardId);
  if (!locked) throw new Error('Card not found after production lock.');
  return locked;
}

export async function assertCardReadyForPrint(cardId: string): Promise<CardIdentity> {
  const card = await getCardIdentity(cardId);
  if (!card) throw new Error('Card not found for production.');
  if (!card.publicProfileUrl.trim()) {
    throw new Error('Card public profile URL is missing. Cannot write NFC.');
  }
  if (!card.designLocked && !PRINT_READY_STATUSES.has(card.status)) {
    throw new Error('Card design is not approved/locked for production.');
  }
  return card;
}

export async function updateCardProductionStatus(
  cardId: string,
  status: CardProductionStatus,
  updatedBy: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await updateDoc(doc(db, firebaseCollections.cards, cardId), {
    status,
    ...extra,
    updatedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function recordProductionLog(input: {
  action: string;
  jobId?: string;
  orderId?: string;
  cardId: string;
  actorId?: string;
  metadata?: Record<string, string | number | boolean>;
}): Promise<void> {
  await addDoc(collection(db, firebaseCollections.productionLogs), {
    action: input.action,
    jobId: input.jobId ?? '',
    orderId: input.orderId ?? '',
    cardId: input.cardId,
    actorId: input.actorId ?? '',
    metadata: input.metadata ?? {},
    createdAt: serverTimestamp(),
  });
}
