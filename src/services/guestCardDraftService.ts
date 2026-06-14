import AsyncStorage from '@react-native-async-storage/async-storage';
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
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import type { OrderCurrency } from '@/src/constants/cardProducts';
import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';
import type { ProductType } from '@/src/constants/options';
import { buildCardProfileUrl } from '@/src/constants/publicProfile';
import { auth, db } from '@/src/services/firebaseClient';
import { getDefaultSalesUid } from '@/src/services/defaultSalesService';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';
import {
  type GuestCardChoice,
  type GuestCardDraft,
  loadGuestCardDraft,
  loadGuestLastOrderId,
  saveGuestLastOrderId,
} from '@/src/services/guestDraftService';
import type { AppUser, CardDesign, PaymentStatus } from '@/src/types/models';
import { createStaffNotification } from '@/src/services/notificationService';
import { resolveOrderBranch } from '@/src/utils/branch';
import { buildOrderPricingFields } from '@/src/utils/orderPricing';

export const CURRENT_GUEST_ID_KEY = 'currentGuestId';
export const CURRENT_CARD_ID_KEY = 'currentCardId';
const CURRENT_GUEST_ACCESS_KEY = 'currentGuestAccessKey';
const CURRENT_PUBLIC_SLUG_KEY = 'currentPublicSlug';

const SLUG_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export type GuestDraftSyncState = 'local' | 'saving' | 'synced' | 'offline' | 'error';

export type GuestCardProfile = {
  fullName: string;
  role: string;
  company: string;
  phone: string;
  telegram: string;
  email: string;
  website: string;
  address: string;
  bio: string;
};

export type GuestCardDesign = {
  theme: 'minimal' | string;
  backgroundColor: string;
  accentColor: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  cardDesign?: CardDesign;
  product?: ProductType;
  cardChoice?: GuestCardChoice;
  gradientIndex?: number;
  customImageUri?: string | null;
};

export type GuestCardOwnerType = 'guest' | 'customer';

export type GuestCloudCard = {
  cardId: string;
  ownerId: string;
  ownerType: GuestCardOwnerType;
  guestId: string;
  userId: string | null;
  publicSlug: string;
  publicProfileUrl: string;
  status: 'draft' | 'preview_ready' | 'ordered' | 'locked' | 'printed' | 'encoded' | 'verified' | 'active' | 'published';
  designLocked?: boolean;
  lockedPublicProfileUrl?: string;
  printProfileUrl?: string;
  profile: GuestCardProfile;
  design: GuestCardDesign;
  sessionOwnerUid?: string;
  guestAccessKey?: string;
};

export type GuestDraftSession = {
  guestId: string;
  cardId: string;
  publicSlug: string;
  guestAccessKey: string;
  syncState: GuestDraftSyncState;
};

export type GuestCardOrderInput = {
  shippingName: string;
  phone: string;
  deliveryAddress: string;
  quantity: number;
  cardType: ProductType;
  paymentMethod: CambodiaPaymentMethodId | string;
  currency?: OrderCurrency;
  paymentReference?: string;
};

function randomString(length: number): string {
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return value;
}

function prefixedAutoId(prefix: 'GST' | 'CRD'): string {
  const raw = doc(collection(db, firebaseCollections.cards)).id?.replace(/[^a-zA-Z0-9]/g, '') ?? '';
  return `${prefix}_${raw.slice(0, 8) || randomString(8)}`;
}

function createCardId(): string {
  const raw = doc(collection(db, firebaseCollections.cards)).id?.replace(/[^a-zA-Z0-9]/g, '') ?? randomString(8);
  return `BC-NFC_${raw.slice(0, 8).toUpperCase()}`;
}

async function getStoredSession(): Promise<GuestDraftSession | null> {
  const [guestId, cardId, guestAccessKey, publicSlug] = await Promise.all([
    AsyncStorage.getItem(CURRENT_GUEST_ID_KEY),
    AsyncStorage.getItem(CURRENT_CARD_ID_KEY),
    AsyncStorage.getItem(CURRENT_GUEST_ACCESS_KEY),
    AsyncStorage.getItem(CURRENT_PUBLIC_SLUG_KEY),
  ]);

  if (!guestId || !cardId) return null;
  return {
    guestId,
    cardId,
    guestAccessKey: guestAccessKey || randomString(24),
    publicSlug: publicSlug || randomString(8),
    syncState: auth.currentUser ? 'synced' : 'local',
  };
}

async function saveStoredSession(session: GuestDraftSession): Promise<void> {
  await AsyncStorage.multiSet([
    [CURRENT_GUEST_ID_KEY, session.guestId],
    [CURRENT_CARD_ID_KEY, session.cardId],
    [CURRENT_GUEST_ACCESS_KEY, session.guestAccessKey],
    [CURRENT_PUBLIC_SLUG_KEY, session.publicSlug],
  ]);
}

async function createUniquePublicSlug(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = randomString(8);
    try {
      const existing = await getDocs(
        query(collection(db, firebaseCollections.cards), where('publicSlug', '==', slug), limit(1))
      );
      if (existing.empty) return slug;
    } catch {
      return slug;
    }
  }
  return randomString(10);
}

function profileFromDraft(draft?: GuestCardDraft | null): GuestCardProfile {
  return {
    fullName: draft?.displayName?.trim() || '',
    role: draft?.jobTitle?.trim() || '',
    company: draft?.company?.trim() || '',
    phone: draft?.phone?.trim() || '',
    telegram: draft?.telegram?.trim() || '',
    email: draft?.email?.trim() || '',
    website: '',
    address: '',
    bio: '',
  };
}

function isCloudImageUri(uri: string | null | undefined): uri is string {
  const trimmed = uri?.trim();
  return Boolean(trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://')));
}

function cloudImageUriOrNull(uri: unknown): string | null {
  if (typeof uri !== 'string') return null;
  return isCloudImageUri(uri) ? uri.trim() : null;
}

function designFromDraft(draft?: GuestCardDraft | null): GuestCardDesign {
  const design: GuestCardDesign = {
    theme: 'minimal',
    backgroundColor: '#FFFFFF',
    accentColor: '#007AFF',
    logoUrl: null,
    avatarUrl: null,
    cardDesign: draft?.cardDesign ?? 'classic_black',
    product: draft?.product ?? 'pvc_card',
    cardChoice: draft?.cardChoice ?? 'physical',
    customImageUri: null,
  };
  if (draft?.gradientIndex !== undefined) design.gradientIndex = draft.gradientIndex;
  design.customImageUri = cloudImageUriOrNull(draft?.customImageUri);
  return design;
}

/** Firestore rejects `undefined`; omit optional design fields when empty. */
function designForFirestore(design: GuestCardDesign): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    theme: design.theme ?? 'minimal',
    backgroundColor: design.backgroundColor ?? '#FFFFFF',
    accentColor: design.accentColor ?? '#007AFF',
    logoUrl: design.logoUrl ?? null,
    avatarUrl: design.avatarUrl ?? null,
    cardDesign: design.cardDesign ?? 'classic_black',
    product: design.product ?? 'pvc_card',
    cardChoice: design.cardChoice ?? 'physical',
    customImageUri: cloudImageUriOrNull(design.customImageUri),
  };
  if (design.gradientIndex !== undefined) payload.gradientIndex = design.gradientIndex;
  return payload;
}

function designForCloudSync(draft?: GuestCardDraft | null): Record<string, unknown> {
  return designForFirestore(designFromDraft(draft));
}

function fallbackCardFromDraft(session: GuestDraftSession, draft?: GuestCardDraft | null): GuestCloudCard {
  const publicProfileUrl = buildCardProfileUrl(session.publicSlug);
  return {
    cardId: session.cardId,
    ownerId: session.guestId,
    ownerType: 'guest',
    guestId: session.guestId,
    userId: null,
    publicSlug: session.publicSlug,
    publicProfileUrl,
    status: 'draft',
    profile: profileFromDraft(draft),
    design: designFromDraft(draft),
    guestAccessKey: session.guestAccessKey,
  };
}

function mapCardData(cardId: string, raw: Record<string, unknown>, session?: GuestDraftSession): GuestCloudCard {
  const profile = (raw.profile && typeof raw.profile === 'object' ? raw.profile : {}) as Partial<GuestCardProfile>;
  const design = (raw.design && typeof raw.design === 'object' ? raw.design : {}) as Partial<GuestCardDesign>;
  const userId = typeof raw.userId === 'string' ? raw.userId : null;
  const guestId = String(raw.guestId ?? session?.guestId ?? '');
  const publicSlug = String(raw.publicSlug ?? session?.publicSlug ?? cardId);
  const ownerType: GuestCardOwnerType =
    raw.ownerType === 'customer' || raw.ownerType === 'user' ? 'customer' : 'guest';
  const ownerId =
    typeof raw.ownerId === 'string' && raw.ownerId.trim()
      ? raw.ownerId.trim()
      : ownerType === 'customer'
        ? userId ?? ''
        : guestId;
  const rawStatus = typeof raw.status === 'string' ? raw.status : 'draft';
  const status: GuestCloudCard['status'] =
    rawStatus === 'preview_ready'
    || rawStatus === 'ordered'
    || rawStatus === 'locked'
    || rawStatus === 'printed'
    || rawStatus === 'encoded'
    || rawStatus === 'verified'
    || rawStatus === 'active'
    || rawStatus === 'published'
      ? rawStatus
      : 'draft';

  return {
    cardId,
    ownerId,
    ownerType,
    guestId,
    userId,
    publicSlug,
    publicProfileUrl:
      typeof raw.publicProfileUrl === 'string' && raw.publicProfileUrl.trim()
        ? raw.publicProfileUrl.trim()
        : buildCardProfileUrl(publicSlug),
    status,
    designLocked:
      raw.designLocked === true
      || status === 'locked'
      || status === 'printed'
      || status === 'encoded'
      || status === 'verified'
      || status === 'active',
    lockedPublicProfileUrl: typeof raw.lockedPublicProfileUrl === 'string' ? raw.lockedPublicProfileUrl : undefined,
    printProfileUrl: typeof raw.printProfileUrl === 'string' ? raw.printProfileUrl : undefined,
    profile: {
      fullName: profile.fullName ?? '',
      role: profile.role ?? '',
      company: profile.company ?? '',
      phone: profile.phone ?? '',
      telegram: profile.telegram ?? '',
      email: profile.email ?? '',
      website: profile.website ?? '',
      address: profile.address ?? '',
      bio: profile.bio ?? '',
    },
    design: {
      theme: design.theme ?? 'minimal',
      backgroundColor: design.backgroundColor ?? '#FFFFFF',
      accentColor: design.accentColor ?? '#007AFF',
      logoUrl: design.logoUrl ?? null,
      avatarUrl: design.avatarUrl ?? null,
      cardDesign: design.cardDesign,
      product: design.product,
      cardChoice: design.cardChoice,
      gradientIndex: design.gradientIndex,
      customImageUri: cloudImageUriOrNull(design.customImageUri),
    },
    sessionOwnerUid: typeof raw.sessionOwnerUid === 'string' ? raw.sessionOwnerUid : undefined,
    guestAccessKey: typeof raw.guestAccessKey === 'string' ? raw.guestAccessKey : session?.guestAccessKey,
  };
}

function cardOwnerFields(session: GuestDraftSession, uid?: string | null): {
  ownerId: string;
  ownerType: GuestCardOwnerType;
  userId: string | null;
} {
  const customerId = uid?.trim();
  if (customerId && !auth.currentUser?.isAnonymous) {
    return { ownerId: customerId, ownerType: 'customer', userId: customerId };
  }
  return { ownerId: session.guestId, ownerType: 'guest', userId: null };
}

function guestSessionPayload(
  session: GuestDraftSession,
  sessionOwnerUid: string,
  status: 'draft' | 'converted' | 'ordered',
  extra: Record<string, unknown> = {},
) {
  return {
    guestId: session.guestId,
    cardId: session.cardId,
    ownerId: session.guestId,
    ownerType: 'guest',
    status,
    sessionOwnerUid,
    guestAccessKey: session.guestAccessKey,
    updatedAt: serverTimestamp(),
    ...extra,
  };
}

async function upsertGuestSessionDocs(
  session: GuestDraftSession,
  sessionOwnerUid: string,
  status: 'draft' | 'converted' | 'ordered',
  extra: Record<string, unknown> = {},
): Promise<void> {
  const payload = guestSessionPayload(session, sessionOwnerUid, status, extra);
  await Promise.all([
    setDoc(doc(db, firebaseCollections.guests, session.guestId), payload, { merge: true }),
    setDoc(doc(db, firebaseCollections.guestSessions, session.guestId), payload, { merge: true }),
  ]);
}

export async function ensureGuestDraftSession(draft?: GuestCardDraft | null): Promise<GuestDraftSession> {
  const existing = await getStoredSession();
  if (existing) return existing;

  const session: GuestDraftSession = {
    guestId: prefixedAutoId('GST'),
    cardId: createCardId(),
    guestAccessKey: randomString(28),
    publicSlug: auth.currentUser ? await createUniquePublicSlug() : randomString(8),
    syncState: auth.currentUser ? 'synced' : 'local',
  };

  await saveStoredSession(session);

  if (!auth.currentUser) {
    return { ...session, syncState: 'local' };
  }

  const sessionOwnerUid = auth.currentUser.uid;
  const card = fallbackCardFromDraft(session, draft);
  const owner = cardOwnerFields(session, sessionOwnerUid);
  const publicProfileUrl = buildCardProfileUrl(session.publicSlug);
  await Promise.all([
    upsertGuestSessionDocs(session, sessionOwnerUid, 'draft', {
      convertedToUserId: owner.userId,
      createdAt: serverTimestamp(),
    }),
    setDoc(doc(db, firebaseCollections.cards, session.cardId), {
      cardId: card.cardId,
      ownerId: owner.ownerId,
      ownerType: owner.ownerType,
      guestId: card.guestId,
      userId: owner.userId,
      publicSlug: card.publicSlug,
      publicProfileUrl,
      status: card.status,
      sessionOwnerUid,
      guestAccessKey: card.guestAccessKey,
      profile: card.profile,
      design: designForFirestore(card.design),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  ]);

  return session;
}

export async function syncGuestCardDraft(draft: GuestCardDraft): Promise<GuestDraftSession> {
  const session = await ensureGuestDraftSession(draft);
  if (!auth.currentUser) {
    return { ...session, syncState: 'local' };
  }

  try {
    const sessionOwnerUid = auth.currentUser.uid;
    const owner = cardOwnerFields(session, sessionOwnerUid);
    const cardRef = doc(db, firebaseCollections.cards, session.cardId);
    const existing = await getDoc(cardRef).catch(() => null);
    const existingData = existing?.exists() ? existing.data() as Record<string, unknown> : null;
    const existingStatus = typeof existingData?.status === 'string' ? existingData.status : '';
    const designLocked =
      existingData?.designLocked === true
      || ['locked', 'printed', 'encoded', 'verified', 'active', 'published'].includes(existingStatus);
    const publicProfileUrl =
      typeof existingData?.publicProfileUrl === 'string' && existingData.publicProfileUrl.trim()
        ? existingData.publicProfileUrl.trim()
        : buildCardProfileUrl(session.publicSlug);
    const payload: Record<string, unknown> = {
      cardId: session.cardId,
      ownerId: owner.ownerId,
      ownerType: owner.ownerType,
      guestId: session.guestId,
      userId: owner.userId,
      publicSlug: session.publicSlug,
      publicProfileUrl,
      status: designLocked ? existingStatus : 'preview_ready',
      sessionOwnerUid,
      guestAccessKey: session.guestAccessKey,
      profile: profileFromDraft(draft),
      updatedAt: serverTimestamp(),
    };
    if (!designLocked) {
      payload.design = designForCloudSync(draft);
    }
    await setDoc(
      cardRef,
      payload,
      { merge: true }
    );
    await upsertGuestSessionDocs(session, sessionOwnerUid, 'draft', { convertedToUserId: owner.userId });
    return { ...session, syncState: 'synced' };
  } catch {
    return { ...session, syncState: 'offline' };
  }
}

export async function loadGuestCloudCard(cardId?: string): Promise<GuestCloudCard | null> {
  const session = await getStoredSession();
  const resolvedCardId = cardId || session?.cardId;
  if (!resolvedCardId) return null;

  if (auth.currentUser) {
    try {
      const snap = await getDoc(doc(db, firebaseCollections.cards, resolvedCardId));
      if (snap.exists()) {
        return mapCardData(snap.id, snap.data() as Record<string, unknown>, session ?? undefined);
      }
    } catch {
      // Fall back to local draft below.
    }
  }

  const draft = await loadGuestCardDraft();
  if (!session || !draft) return null;
  return fallbackCardFromDraft(session, draft);
}

export async function loadCustomerCloudCard(userId: string): Promise<GuestCloudCard | null> {
  const storedCardId = await getStoredGuestCardId();
  if (storedCardId) {
    const storedCard = await loadGuestCloudCard(storedCardId);
    if (storedCard && (!storedCard.userId || storedCard.userId === userId)) {
      return storedCard;
    }
  }

  if (auth.currentUser) {
    try {
      const owned = await getDocs(
        query(collection(db, firebaseCollections.cards), where('ownerId', '==', userId), limit(1))
      );
      if (!owned.empty) {
        const docSnap = owned.docs[0];
        return mapCardData(docSnap.id, docSnap.data() as Record<string, unknown>);
      }
    } catch {
      // Fall through to legacy userId lookup.
    }

    try {
      const owned = await getDocs(
        query(collection(db, firebaseCollections.cards), where('userId', '==', userId), limit(1))
      );
      if (!owned.empty) {
        const docSnap = owned.docs[0];
        return mapCardData(docSnap.id, docSnap.data() as Record<string, unknown>);
      }
    } catch {
      // Fall through to draft/session lookup.
    }
  }

  return loadGuestCloudCard();
}

async function upsertGuestCloudCardDocs(
  card: GuestCloudCard,
  session: GuestDraftSession,
  sessionOwnerUid: string
): Promise<void> {
  const guestRef = doc(db, firebaseCollections.guests, session.guestId);
  const guestSessionRef = doc(db, firebaseCollections.guestSessions, session.guestId);
  const cardRef = doc(db, firebaseCollections.cards, card.cardId);
  const owner = cardOwnerFields(session, card.userId ?? sessionOwnerUid);
  const publicProfileUrl = card.publicProfileUrl || buildCardProfileUrl(card.publicSlug);

  await Promise.all([
    setDoc(
      guestRef,
      guestSessionPayload(session, sessionOwnerUid, card.status === 'ordered' ? 'ordered' : 'draft', { convertedToUserId: owner.userId }),
      { merge: true }
    ),
    setDoc(
      guestSessionRef,
      guestSessionPayload(session, sessionOwnerUid, card.status === 'ordered' ? 'ordered' : 'draft', { convertedToUserId: owner.userId }),
      { merge: true }
    ),
    setDoc(
      cardRef,
      {
        cardId: card.cardId,
        ownerId: owner.ownerId,
        ownerType: owner.ownerType,
        guestId: card.guestId,
        userId: owner.userId,
        publicSlug: card.publicSlug,
        publicProfileUrl,
        status: card.status,
        sessionOwnerUid,
        guestAccessKey: session.guestAccessKey,
        profile: card.profile,
        ...(card.designLocked ? {} : { design: designForFirestore(card.design) }),
        designLocked: card.designLocked ?? false,
        lockedPublicProfileUrl: card.lockedPublicProfileUrl,
        printProfileUrl: card.printProfileUrl,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ),
  ]);
}

async function loadGuestSessionCards(session: GuestDraftSession, selectedCardId?: string): Promise<GuestCloudCard[]> {
  const cards = new Map<string, GuestCloudCard>();
  const addCard = (card: GuestCloudCard | null) => {
    if (card) cards.set(card.cardId, card);
  };

  if (selectedCardId) addCard(await loadGuestCloudCard(selectedCardId));
  addCard(await loadGuestCloudCard(session.cardId));

  if (auth.currentUser) {
    const constraints = [
      where('guestId', '==', session.guestId),
      where('guestAccessKey', '==', session.guestAccessKey),
      where('sessionOwnerUid', '==', auth.currentUser.uid),
    ];
    await Promise.all(
      constraints.map(async (constraint) => {
        try {
          const snap = await getDocs(query(collection(db, firebaseCollections.cards), constraint, limit(50)));
          snap.docs.forEach((cardDoc) => {
            cards.set(cardDoc.id, mapCardData(cardDoc.id, cardDoc.data() as Record<string, unknown>, session));
          });
        } catch {
          // Best-effort migration: selected/stored cards above still migrate.
        }
      }),
    );
  }

  return [...cards.values()];
}

export async function convertGuestCardToUser(user: AppUser, cardId?: string): Promise<void> {
  const session = await getStoredSession();
  const resolvedCardId = cardId || session?.cardId;
  if (!session || !resolvedCardId) return;
  const cards = await loadGuestSessionCards(session, resolvedCardId);
  if (cards.length === 0) return;

  const now = serverTimestamp();
  const sessionOwnerUid = auth.currentUser?.uid || user.id;
  await Promise.all(cards.map((card) => upsertGuestCloudCardDocs({ ...card, ownerType: 'customer', ownerId: user.id, userId: user.id }, session, sessionOwnerUid)));
  await Promise.all([
    ...cards.map((card) =>
      setDoc(
        doc(db, firebaseCollections.cards, card.cardId),
        {
          ownerId: user.id,
          ownerType: 'customer',
          userId: user.id,
          guestId: session.guestId,
          guestAccessKey: session.guestAccessKey,
          sessionOwnerUid,
          updatedAt: now,
          previousGuestId: session.guestId,
        },
        { merge: true },
      )
    ),
    upsertGuestSessionDocs(session, sessionOwnerUid, 'converted', { convertedToUserId: user.id }),
  ]);

  const lastOrderId = await loadGuestLastOrderId();
  if (lastOrderId) {
    await updateDoc(doc(db, firebaseCollections.orders, lastOrderId), {
      ownerId: user.id,
      ownerType: 'customer',
      userId: user.id,
      createdBy: user.id,
      updatedBy: user.id,
      guestAccessKey: session.guestAccessKey,
      updatedAt: now,
    }).catch(() => undefined);
  }
}

export async function verifyCardMigration(cardId: string, customerId: string): Promise<{ migrated: boolean; status: string; }> {
  try {
    const snap = await getDoc(doc(db, firebaseCollections.cards, cardId));
    if (!snap.exists()) return { migrated: false, status: 'not_found' };
    
    const data = snap.data();
    const isOwner = data.ownerId === customerId || data.userId === customerId;
    const isCustomerType = data.ownerType === 'customer';
    
    // Allow any non-deleted status, specifically checking for orderable states.
    const isOrderable = ['draft', 'preview_ready', 'ordered', 'active'].includes(String(data.status));
    
    if (isOwner && isCustomerType && isOrderable) {
      return { migrated: true, status: 'success' };
    }
    
    return { migrated: false, status: 'validation_failed' };
  } catch {
    return { migrated: false, status: 'error' };
  }
}

export async function createGuestCardOrder(cardId: string, input: GuestCardOrderInput): Promise<string> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('Create an account or sign in before ordering a physical card.');
  }

  const session = await getStoredSession();
  const card = await loadGuestCloudCard(cardId);
  if (!session || !card) {
    throw new Error('No guest card draft found. Start a new NFC card first.');
  }
  const uid = auth.currentUser.uid;
  if (card.ownerId !== uid && card.userId !== uid) {
    throw new Error('You can only order a card saved to your account.');
  }

  const quantity = Math.max(1, Math.min(100, Math.floor(input.quantity || 1)));
  const productType = input.cardType || card.design.product || 'pvc_card';
  const currency = input.currency ?? 'KHR';
  const pricing = buildOrderPricingFields({
    productType: 'physical_nfc',
    quantity,
    currency,
    material: productType,
  });
  const assignedSalesman = await getDefaultSalesUid();
  const salesSnap = await getDoc(doc(db, firebaseCollections.users, assignedSalesman));
  const salesBranch = salesSnap.exists() ? String(salesSnap.data().branch ?? '') : '';
  const cardRef = doc(db, firebaseCollections.cards, card.cardId);
  const guestRef = doc(db, firebaseCollections.guests, session.guestId);
  const paymentStatus: PaymentStatus = 'pending_payment';
  const publicProfileUrl = card.publicProfileUrl || buildCardProfileUrl(card.publicSlug);

  await upsertGuestCloudCardDocs({ ...card, ownerId: uid, ownerType: 'customer', userId: uid }, session, uid);

  const orderRef = await addDoc(collection(db, firebaseCollections.orders), {
    cardId: card.cardId,
    guestId: card.guestId,
    ownerId: uid,
    userId: uid,
    ownerType: 'customer',
    guestAccessKey: session.guestAccessKey,
    customerName: input.shippingName.trim() || card.profile.fullName || 'Guest Customer',
    phone: input.phone.trim() || card.profile.phone || '+1000000000',
    email: card.profile.email || '',
    telegram: card.profile.telegram || '',
    company: card.profile.company || '',
    jobTitle: card.profile.role || '',
    deliveryAddress: input.deliveryAddress.trim(),
    productType,
    quantity,
    cardDesign: card.design.cardDesign ?? 'classic_black',
    cardCode: card.cardId,
    nfcEnabled: true,
    nfcTargetUrl: publicProfileUrl,
    qrPrinted: true,
    profileUrl: publicProfileUrl,
    orderSource: 'customer',
    fulfillment: 'physical',
    status: 'new',
    cardStatus: 'active',
    paymentStatus,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference?.trim() || null,
    paymentSubmittedAt: new Date().toISOString(),
    amount: pricing.amount,
    currency,
    salesCommission: pricing.salesCommission,
    salesCommissionCurrency: pricing.salesCommissionCurrency,
    priority: 'standard',
    assignedSalesman,
    branch: resolveOrderBranch(salesBranch),
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await Promise.all([
    setDoc(
      cardRef,
      {
        status: 'ordered',
        ownerId: uid,
        ownerType: 'customer',
        userId: uid,
        orderId: orderRef.id,
        publicProfileUrl,
        guestAccessKey: session.guestAccessKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ),
    setDoc(
      guestRef,
      {
        status: 'ordered',
        orderId: orderRef.id,
        guestAccessKey: session.guestAccessKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ),
    upsertGuestSessionDocs(session, uid, 'ordered', { orderId: orderRef.id, convertedToUserId: uid }),
    saveGuestLastOrderId(orderRef.id),
  ]);

  void createStaffNotification({
    userId: assignedSalesman,
    title: 'New order - payment pending',
    message: `${input.shippingName.trim() || card.profile.fullName} placed an NFC card order. Verify KHQR/ABA then mark paid.`,
    priority: 'high',
    actionUrl: `/order-detail/${orderRef.id}`,
    createdBy: uid,
  }).catch(() => undefined);

  return orderRef.id;
}

/** Mark linked card payment-ready after payment is verified (sales/admin). */
export async function publishGuestCardForOrder(orderId: string): Promise<void> {
  const orderSnap = await getDoc(doc(db, firebaseCollections.orders, orderId));
  if (!orderSnap.exists()) return;
  const data = orderSnap.data() as Record<string, unknown>;
  const cardId = typeof data.cardId === 'string' ? data.cardId : '';
  if (!cardId) return;
  await updateDoc(doc(db, firebaseCollections.cards, cardId), {
    status: 'ordered',
    paymentVerifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
