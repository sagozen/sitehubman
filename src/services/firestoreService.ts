import {
  addDoc,
  collection,
  deleteField,
  doc,
  increment,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { createStaffNotification } from '@/src/services/notificationService';
import { uploadQaVideo } from '@/src/services/qaMediaService';
import { mapOrder, toIso } from '@/src/services/orderMappers';
import { resolveOrderBranch } from '@/src/utils/branch';
import { buildOrderPricingFields } from '@/src/utils/orderPricing';
import { buildProfileUrl } from '@/src/constants/publicProfile';
import {
  ensureNfcCardAssigned,
  lifecycleToVerification,
  recordTapEvent,
  syncBioToCard,
  syncProfileFromBio,
  verificationToLifecycle,
} from '@/src/services/nfcProfileService';
import { auth, db } from '@/src/services/firebaseClient';
import {
  AppNotification,
  BioPage,
  NfcCard,
  NfcStatus,
  CardDesign,
  Order,
  OrderCardStatus,
  OrderStatus,
  PaymentStatus,
  Payout,
  PrinterJob,
  PrinterJobStage,
  SalaryRecord,
  UserRole,
  isPrinterOperatorRole,
} from '@/src/types/models';
import {
  OPERATOR_JOB_TERMINAL_STAGE,
  canTransitionOrderStatus,
  getNextOrderStatus as getNextStatusInFlow,
} from '@/src/utils/orderStatusFlow';
import { getDefaultSalesUid } from '@/src/services/defaultSalesService';
import {
  generateOrderNumber,
  generateProductionPasscode,
  isPhysicalFulfillment,
} from '@/src/utils/orderProduction';
import {
  assertCardReadyForPrint,
  ensureCardIdentity,
  getCardIdentity,
  recordProductionLog,
  updateCardProductionStatus,
} from '@/src/services/cardIdentityService';

export { mapOrder } from '@/src/services/orderMappers';

export { buildProfileUrl } from '@/src/constants/publicProfile';

const PRINTER_STAGE_FLOW: PrinterJobStage[] = [
  'received',
  'printing',
  'nfc_encoding',
  'quality_check',
  'ready_to_ship',
  'completed',
];

const VALID_PRODUCT_TYPES = new Set(['ecard', 'physical_nfc', 'wood_card', 'metal_card', 'pvc_card']);
const VALID_CARD_DESIGNS = new Set(['classic_black', 'matte_silver', 'gold_premium', 'rose_gold', 'custom']);
const VALID_PAYMENT_STATUSES = new Set([
  'unpaid',
  'pending_payment',
  'under_review',
  'paid_verified',
  'partial',
  'paid',
  'paid_qr',
  'cash_received',
]);
const VALID_PRIORITIES = new Set(['standard', 'urgent']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s-]{6,24}$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;

function actorId(fallback?: string) {
  return auth.currentUser?.uid || fallback || '';
}

function assertSignedInStaff() {
  if (!auth.currentUser?.uid) {
    throw new Error('Your session expired. Sign in again and retry.');
  }
}

function sortNewestFirst<T extends { createdAt?: string; updatedAt?: string }>(items: T[]) {
  return items.sort((a, b) => (b.createdAt ?? b.updatedAt ?? '').localeCompare(a.createdAt ?? a.updatedAt ?? ''));
}

function sortIsoNewestFirst<T extends { createdAt: string }>(items: T[]) {
  return items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

function withoutUndefined<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function assertNonEmpty(value: string | undefined, message: string) {
  if (!value?.trim()) throw new Error(message);
}

function assertValidOrderInput(input: CreateOrderInput) {
  assertNonEmpty(input.customerName, 'Customer name is required.');
  assertNonEmpty(input.createdBy, 'A signed-in staff account is required to create orders.');

  if (!input.phone?.trim() && !input.telegram?.trim()) {
    throw new Error('Phone or Telegram contact is required.');
  }
  if (input.phone?.trim() && !PHONE_PATTERN.test(input.phone.trim())) {
    throw new Error('Enter a valid phone number.');
  }
  if (input.email && !EMAIL_PATTERN.test(input.email.trim().toLowerCase())) {
    throw new Error('Enter a valid customer email.');
  }
  if (!VALID_PRODUCT_TYPES.has(input.productType)) {
    throw new Error('Choose a valid product type.');
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000) {
    throw new Error('Quantity must be a whole number from 1 to 1000.');
  }
  if (!VALID_PAYMENT_STATUSES.has(input.paymentStatus)) {
    throw new Error('Choose a valid payment status.');
  }
}

async function getActorRole(userId: string): Promise<UserRole | undefined> {
  if (!userId) return undefined;
  const snap = await getDoc(doc(db, firebaseCollections.users, userId));
  return snap.exists() ? (snap.data().role as UserRole | undefined) : undefined;
}

function canCreateCustomerOrder(role: UserRole | undefined): boolean {
  return role === 'sales' || role === 'agent' || role === 'admin' || role === 'super_admin';
}

async function assertCanCreateCustomerOrder(userId: string): Promise<void> {
  const role = await getActorRole(userId);
  if (!canCreateCustomerOrder(role)) {
    throw new Error('Printer operators cannot create customer orders.');
  }
}

function assertValidStatusTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) return;
  if (!canTransitionOrderStatus(current, next)) {
    throw new Error(`Cannot move order from ${current} to ${next}.`);
  }
}

function assertValidJobTransition(current: PrinterJobStage, next: PrinterJobStage) {
  if (current === next) return;
  if (next === 'failed' || next === 'reprint') return;
  if (current === 'reprint' && (next === 'received' || next === 'printing')) return;
  if (next === OPERATOR_JOB_TERMINAL_STAGE && current !== 'nfc_encoding') {
    const currentIndex = PRINTER_STAGE_FLOW.indexOf(current);
    const terminalIndex = PRINTER_STAGE_FLOW.indexOf(OPERATOR_JOB_TERMINAL_STAGE);
    if (currentIndex === -1 || currentIndex + 1 !== terminalIndex) {
      throw new Error(`Complete NFC encoding before quality check.`);
    }
  }
  const currentIndex = PRINTER_STAGE_FLOW.indexOf(current);
  const nextIndex = PRINTER_STAGE_FLOW.indexOf(next);
  if (currentIndex === -1 || nextIndex === -1 || nextIndex !== currentIndex + 1) {
    throw new Error(`Cannot move job from ${current} to ${next}.`);
  }
}

function orderStatusForStage(stage: PrinterJobStage): OrderStatus | null {
  if (stage === 'printing') return 'printing';
  if (stage === 'nfc_encoding') return 'nfc_writing';
  if (stage === 'quality_check') return 'nfc_verification';
  if (stage === 'ready_to_ship' || stage === 'completed') return 'ready_to_ship';
  return null;
}

function normalizePrinterJobStage(stage: unknown): PrinterJobStage {
  if (stage === 'queued') return 'received';
  if (stage === 'nfc_writing' || stage === 'nfc_verification') return 'nfc_encoding';
  if (stage === 'awaiting_qa') return 'quality_check';
  if (stage === 'done') return 'completed';
  if (
    stage === 'received' ||
    stage === 'printing' ||
    stage === 'nfc_encoding' ||
    stage === 'quality_check' ||
    stage === 'ready_to_ship' ||
    stage === 'completed' ||
    stage === 'failed' ||
    stage === 'reprint'
  ) {
    return stage;
  }
  return 'received';
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  return getNextStatusInFlow(status);
}

export function generateCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BC-';
  for (let i = 0; i < 4; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export type CreateOrderInput = Omit<
  Order,
  | 'id'
  | 'cardCode'
  | 'profileUrl'
  | 'status'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'cardStatus'
  | 'freezeReason'
  | 'frozenAt'
  | 'frozenBy'
  | 'closedAt'
  | 'closedBy'
>;

export type UpdateOrderDetailsInput = Partial<Pick<
  Order,
  | 'customerName'
  | 'phone'
  | 'telegram'
  | 'whatsapp'
  | 'email'
  | 'company'
  | 'jobTitle'
  | 'deliveryAddress'
  | 'productType'
  | 'quantity'
  | 'cardDesign'
  | 'nfcEnabled'
  | 'nfcTargetUrl'
  | 'qrPrinted'
  | 'paymentStatus'
  | 'paymentMethod'
  | 'amount'
  | 'currency'
  | 'fulfillment'
  | 'salesCommission'
  | 'salesCommissionCurrency'
  | 'depositAmount'
  | 'dueDate'
  | 'priority'
  | 'notes'
>>;

async function assertNoDuplicateOpenOrder(input: CreateOrderInput) {
  const phone = input.phone?.trim();
  const telegram = input.telegram?.trim();
  const contactConstraint = phone
    ? where('phone', '==', phone)
    : telegram
      ? where('telegram', '==', telegram)
      : null;

  if (!contactConstraint) return;

  const constraints = [contactConstraint];
  if (input.assignedSalesman) {
    constraints.push(where('assignedSalesman', '==', input.assignedSalesman));
  }

  const duplicateQuery = query(
    collection(db, firebaseCollections.orders),
    ...constraints
  );
  let snapshot;
  try {
    snapshot = await getDocs(duplicateQuery);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code === 'permission-denied' || code === 'failed-precondition') return;
    throw error;
  }

  const duplicate = snapshot.docs
    .map((d) => mapOrder(d.id, d.data()))
    .find((order) => (
      order.productType === input.productType
      && order.status !== 'delivered'
      && (order.cardStatus ?? 'active') !== 'closed'
    ));

  if (duplicate) {
    throw new Error('An open order already exists for this contact and product.');
  }
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  assertSignedInStaff();
  const staffId = actorId(input.createdBy);
  await assertCanCreateCustomerOrder(staffId);
  const normalized: CreateOrderInput = {
    ...input,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    telegram: input.telegram?.trim() || undefined,
    whatsapp: input.whatsapp?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    company: input.company?.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    deliveryAddress: input.deliveryAddress?.trim() || undefined,
    productType: input.productType,
    quantity: input.quantity,
    cardDesign: input.cardDesign,
    designArtworkUrl: input.designArtworkUrl?.trim() || undefined,
    designArtworkPath: input.designArtworkPath?.trim() || undefined,
    designArtworkFileName: input.designArtworkFileName?.trim() || undefined,
    nfcEnabled: input.nfcEnabled,
    nfcTargetUrl: input.nfcTargetUrl?.trim() || undefined,
    qrPrinted: input.qrPrinted,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    amount: input.amount,
    currency: input.currency,
    fulfillment: input.fulfillment,
    salesCommission: input.salesCommission,
    salesCommissionCurrency: input.salesCommissionCurrency,
    depositAmount: input.depositAmount,
    dueDate: input.dueDate?.trim() || undefined,
    priority: input.priority,
    notes: input.notes?.trim() || undefined,
    assignedSalesman: staffId,
    createdBy: staffId,
  };

  assertValidOrderInput(normalized);
  await assertNoDuplicateOpenOrder(normalized);

  const cardId = input.cardId?.trim() || generateCardCode();
  const cardCode = cardId;
  const profileUrl = buildProfileUrl(cardId);
  const orderNumber = generateOrderNumber();
  const physical = isPhysicalFulfillment(input);

  const staffSnap = await getDoc(doc(db, firebaseCollections.users, staffId));
  const staff = staffSnap.exists() ? staffSnap.data() : {};
  const staffBranch = String(staff.branch ?? '');
  const staffCompanyId = String(staff.companyId ?? '');

  const orderRef = await addDoc(collection(db, firebaseCollections.orders), withoutUndefined({
    ...normalized,
    orderNumber,
    orderSource: input.orderSource === 'bulk' ? 'bulk' as const : 'manual' as const,
    productionPasscode: physical ? generateProductionPasscode() : undefined,
    cardId,
    cardCode,
    profileUrl,
    companyId: staffCompanyId || undefined,
    branch: resolveOrderBranch(staffBranch),
    status: (physical ? 'pending_payment' : 'delivered') as OrderStatus,
    cardStatus: 'active' as OrderCardStatus,
    updatedBy: staffId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  await ensureCardIdentity({
    cardId,
    ownerId: staffId,
    ownerType: 'staff',
    userId: staffId,
    publicSlug: cardId,
    status: physical ? 'ordered' : 'active',
    profile: {
      fullName: normalized.customerName,
      role: normalized.jobTitle ?? '',
      company: normalized.company ?? '',
      phone: normalized.phone,
      telegram: normalized.telegram ?? '',
      email: normalized.email ?? '',
      address: normalized.deliveryAddress ?? '',
    },
    design: {
      cardDesign: normalized.cardDesign,
      product: normalized.productType,
      cardChoice: physical ? 'physical' : 'virtual',
      customImageUri: normalized.designArtworkUrl ?? null,
    },
    orderId: orderRef.id,
    createdBy: staffId,
  }).catch(() => undefined);

  await ensureNfcCardAssigned({
    cardId,
    orderId: orderRef.id,
    ownerUserId: staffId,
    profileId: staffId,
  }).catch(() => undefined);

  return orderRef.id;
}

export type CustomerOrderFulfillment = 'digital' | 'physical';

export type CreateCustomerOrderInput = {
  customerName: string;
  phone: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  productType: string;
  quantity: number;
  cardDesign: CardDesign;
  nfcEnabled?: boolean;
  qrPrinted?: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  amount?: number;
  currency?: 'USD' | 'KHR';
  salesCommission?: number;
  salesCommissionCurrency?: 'USD' | 'KHR';
  notes?: string;
  fulfillment: CustomerOrderFulfillment;
};

function assertValidCustomerOrderInput(input: CreateCustomerOrderInput) {
  assertNonEmpty(input.customerName, 'Your name is required.');
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to save your card.');
  if (input.fulfillment === 'physical' && auth.currentUser?.isAnonymous) {
    throw new Error('Create an account or sign in before ordering a physical card.');
  }

  if (!input.phone?.trim() && !input.email?.trim()) {
    throw new Error('Add a phone number or email so we can reach you.');
  }
  if (input.phone?.trim() && !PHONE_PATTERN.test(input.phone.trim())) {
    throw new Error('Enter a valid phone number.');
  }
  if (input.email && !EMAIL_PATTERN.test(input.email.trim().toLowerCase())) {
    throw new Error('Enter a valid email.');
  }
  if (!VALID_PRODUCT_TYPES.has(input.productType)) {
    throw new Error('Choose a valid product type.');
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) {
    throw new Error('Quantity must be between 1 and 100.');
  }
  if (!VALID_CARD_DESIGNS.has(input.cardDesign)) {
    throw new Error('Choose a valid card finish.');
  }
}

/** Customer self-service order from guest design (e-card or physical NFC). */
export async function createCustomerOrder(input: CreateCustomerOrderInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to save your card.');

  assertValidCustomerOrderInput(input);

  const cardId = generateCardCode();
  const cardCode = cardId;
  const profileUrl = buildProfileUrl(cardId);
  const status: OrderStatus = input.fulfillment === 'digital' ? 'delivered' : 'pending_payment';

  const fulfillment = input.fulfillment;
  const salesUid = await getDefaultSalesUid();
  const salesSnap = await getDoc(doc(db, firebaseCollections.users, salesUid));
  const sales = salesSnap.exists() ? salesSnap.data() : {};
  const salesBranch = String(sales.branch ?? '');
  const salesCompanyId = String(sales.companyId ?? '');
  const orderNumber = generateOrderNumber();
  const physical = fulfillment === 'physical';
  const paymentStatus: PaymentStatus = 'pending_payment';
  let orderSource: 'guest' | 'customer' = 'customer';
  let ownerCompanyId = '';
  try {
    const ownerSnap = await getDoc(doc(db, firebaseCollections.users, uid));
    if (ownerSnap.exists()) {
      const owner = ownerSnap.data();
      ownerCompanyId = String(owner.companyId ?? '');
      if (owner.authType === 'anonymous' || owner.plan === 'guest_trial') {
        orderSource = 'guest';
      }
    }
  } catch {
    // Default to customer source.
  }

  const orderRef = await addDoc(collection(db, firebaseCollections.orders), withoutUndefined({
    customerName: input.customerName.trim(),
    cardId,
    ownerId: uid,
    ownerType: orderSource === 'guest' ? 'guest' : 'customer',
    phone: input.phone.trim(),
    email: input.email?.trim().toLowerCase() || undefined,
    company: input.company?.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    productType: input.productType,
    quantity: input.quantity,
    cardDesign: input.cardDesign,
    orderNumber,
    orderSource,
    productionPasscode: physical ? generateProductionPasscode() : undefined,
    cardCode,
    profileUrl,
    companyId: ownerCompanyId || salesCompanyId || undefined,
    nfcEnabled: input.nfcEnabled ?? true,
    qrPrinted: input.qrPrinted ?? true,
    paymentStatus,
    paymentMethod: input.paymentMethod,
    amount: input.amount,
    currency: input.currency,
    fulfillment,
    salesCommission: input.salesCommission,
    salesCommissionCurrency: input.salesCommissionCurrency,
    notes: input.notes?.trim() || undefined,
    status,
    cardStatus: 'active' as OrderCardStatus,
    assignedSalesman: salesUid,
    branch: resolveOrderBranch(salesBranch),
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  await ensureNfcCardAssigned({
    cardId,
    orderId: orderRef.id,
    ownerUserId: uid,
    profileId: uid,
  }).catch(() => undefined);

  await ensureCardIdentity({
    cardId,
    ownerId: uid,
    ownerType: orderSource === 'guest' ? 'guest' : 'customer',
    userId: uid,
    publicSlug: cardId,
    status: physical ? 'ordered' : 'active',
    profile: {
      fullName: input.customerName.trim(),
      role: input.jobTitle?.trim() ?? '',
      company: input.company?.trim() ?? '',
      phone: input.phone.trim(),
      email: input.email?.trim().toLowerCase() ?? '',
    },
    design: {
      cardDesign: input.cardDesign,
      product: input.productType,
      cardChoice: physical ? 'physical' : 'virtual',
    },
    orderId: orderRef.id,
    createdBy: uid,
  }).catch(() => undefined);

  void createStaffNotification({
    userId: salesUid,
    title: 'New order - payment pending',
    message: `${input.customerName.trim()} placed an order. Verify payment before production.`,
    priority: 'high',
    actionUrl: `/order-detail/${orderRef.id}`,
    createdBy: uid,
  }).catch(() => undefined);

  return orderRef.id;
}

/** Customer reorder - clones a delivered/paid order as a new unpaid order. */
export async function createCustomerReorder(sourceOrderId: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to reorder.');

  const source = await getOrder(sourceOrderId);
  if (!source) throw new Error('Original order not found.');
  if (source.createdBy !== uid) throw new Error('You can only reorder your own orders.');

  const pricing = buildOrderPricingFields({
    productType: source.fulfillment === 'digital' ? 'ecard' : 'physical_nfc',
    quantity: source.quantity,
    currency: source.currency ?? 'KHR',
    material:
      source.productType === 'wood_card' ||
      source.productType === 'metal_card' ||
      source.productType === 'pvc_card'
        ? (source.productType as 'wood_card' | 'metal_card' | 'pvc_card')
        : undefined,
  });

  return createCustomerOrder({
    customerName: source.customerName,
    phone: source.phone,
    email: source.email,
    company: source.company,
    jobTitle: source.jobTitle,
    productType: source.productType,
    quantity: source.quantity,
    cardDesign: source.cardDesign,
    nfcEnabled: source.nfcEnabled,
    qrPrinted: source.qrPrinted,
    paymentStatus: 'unpaid',
    paymentMethod: source.paymentMethod,
    amount: pricing.amount,
    currency: source.currency ?? 'KHR',
    salesCommission: pricing.salesCommission,
    salesCommissionCurrency: pricing.salesCommissionCurrency,
    notes: `Reorder of ${source.orderNumber ?? source.id}`,
    fulfillment: source.fulfillment ?? 'physical',
  });
}

export async function listOrders(role: UserRole, userId: string, branch?: string): Promise<Order[]> {
  const { listOrdersPage } = await import('@/src/services/orderListService');
  const page = await listOrdersPage(role, userId, { branch, pageSize: 500 });
  return page.items;
}

export async function listOrdersSimple(role: UserRole, userId: string): Promise<Order[]> {
  return listOrders(role, userId);
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  const normalized = orderNumber.trim().toUpperCase();
  if (!normalized) return null;
  try {
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.orders), where('orderNumber', '==', normalized))
    );
    const first = snapshot.docs[0];
    return first ? mapOrder(first.id, first.data()) : null;
  } catch (error) {
    if (isFirestorePermissionDenied(error)) return null;
    throw error;
  }
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, firebaseCollections.orders, orderId));
  if (!snap.exists()) return null;
  return mapOrder(snap.id, snap.data());
}

function isFirestorePermissionDenied(error: unknown): boolean {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  return code === 'permission-denied';
}

export async function getOrderByCardCode(cardCode: string): Promise<Order | null> {
  const normalized = cardCode.trim().toUpperCase();
  if (!normalized) return null;

  try {
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.orders), where('cardCode', '==', normalized))
    );
    const first = snapshot.docs[0];
    return first ? mapOrder(first.id, first.data()) : null;
  } catch (error) {
    // Firestore rejects queries that could return docs in another branch (printer role).
    if (isFirestorePermissionDenied(error)) return null;
    throw error;
  }
}

export async function findOrderForPrintLookup(input: string): Promise<Order | null> {
  const raw = input.trim();
  if (!raw) return null;
  const normalized = raw.toUpperCase();

  const direct = await getOrder(raw).catch((error) => {
    if (isFirestorePermissionDenied(error)) return null;
    throw error;
  });
  if (direct) return direct;

  const byOrderNumber = await getOrderByOrderNumber(normalized);
  if (byOrderNumber) return byOrderNumber;

  const byCardCode = await getOrderByCardCode(normalized);
  if (byCardCode) return byCardCode;

  const fields: (keyof Pick<Order, 'ownerId' | 'createdBy' | 'cardId'>)[] = ['ownerId', 'createdBy', 'cardId'];
  for (const field of fields) {
    try {
      const snapshot = await getDocs(
        query(collection(db, firebaseCollections.orders), where(field, '==', raw))
      );
      const orders = snapshot.docs.map((d) => mapOrder(d.id, d.data()));
      const firstPrintable = sortNewestFirst(orders).find((order) => (order.cardStatus ?? 'active') !== 'closed');
      if (firstPrintable) return firstPrintable;
    } catch (error) {
      if (isFirestorePermissionDenied(error)) continue;
      throw error;
    }
  }

  return null;
}

export async function assignCardCodeToOrder(
  orderId: string,
  cardCode: string,
  updatedBy?: string
): Promise<Order> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const normalized = cardCode.trim().toUpperCase();
  assertNonEmpty(normalized, 'Card UID is required.');

  const conflict = await getOrderByCardCode(normalized);
  if (conflict && conflict.id !== orderId) {
    throw new Error(`UID ${normalized} is already linked to another order.`);
  }

  const profileUrl = buildProfileUrl(normalized);
  try {
    await updateDoc(doc(db, firebaseCollections.orders, orderId), {
      cardId: normalized,
      cardCode: normalized,
      profileUrl,
      updatedBy: actorId(updatedBy),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (isFirestorePermissionDenied(error)) {
      throw new Error(
        'Cannot link this UID - the order is outside your workshop branch. Add paid orders to your active batch first.'
      );
    }
    throw error;
  }

  const updated = await getOrder(orderId);
  if (!updated) throw new Error('Order not found after UID assignment.');

  await ensureNfcCardAssigned({
    cardId: normalized,
    orderId,
    ownerUserId: updated.createdBy,
    profileId: updated.createdBy,
    chipUID: normalized,
  }).catch(() => undefined);

  await ensureCardIdentity({
    cardId: normalized,
    ownerId: updated.createdBy,
    ownerType: 'customer',
    userId: updated.createdBy,
    publicSlug: normalized,
    status: isPhysicalFulfillment(updated) ? 'ordered' : 'active',
    profile: {
      fullName: updated.customerName,
      role: updated.jobTitle ?? '',
      company: updated.company ?? '',
      phone: updated.phone,
      telegram: updated.telegram ?? '',
      email: updated.email ?? '',
      address: updated.deliveryAddress ?? '',
    },
    design: {
      cardDesign: updated.cardDesign,
      product: updated.productType,
      cardChoice: isPhysicalFulfillment(updated) ? 'physical' : 'virtual',
    },
    orderId,
    createdBy: actorId(updatedBy),
  }).catch(() => undefined);

  return updated;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, updatedBy?: string): Promise<void> {
  const ref = doc(db, firebaseCollections.orders, orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Order not found.');

  const order = mapOrder(snap.id, snap.data());
  if (order.cardStatus === 'closed') {
    throw new Error('Closed cards cannot be advanced. Reopen the card first.');
  }
  assertValidStatusTransition(order.status, status);

  await updateDoc(ref, {
    status,
    updatedBy: actorId(updatedBy),
    updatedAt: serverTimestamp(),
  });
}

function assertValidOrderDetailsUpdate(input: UpdateOrderDetailsInput) {
  if (input.customerName !== undefined) {
    assertNonEmpty(input.customerName, 'Customer name is required.');
  }
  if (input.phone?.trim() && !PHONE_PATTERN.test(input.phone.trim())) {
    throw new Error('Enter a valid phone number.');
  }
  if (input.email?.trim() && !EMAIL_PATTERN.test(input.email.trim().toLowerCase())) {
    throw new Error('Enter a valid customer email.');
  }
  if (input.productType !== undefined && !VALID_PRODUCT_TYPES.has(input.productType)) {
    throw new Error('Choose a valid product type.');
  }
  if (input.quantity !== undefined && (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000)) {
    throw new Error('Quantity must be a whole number from 1 to 1000.');
  }
  if (input.cardDesign !== undefined && !VALID_CARD_DESIGNS.has(input.cardDesign)) {
    throw new Error('Choose a valid card design.');
  }
  if (input.paymentStatus !== undefined && !VALID_PAYMENT_STATUSES.has(input.paymentStatus)) {
    throw new Error('Choose a valid payment status.');
  }
  if (input.priority !== undefined && !VALID_PRIORITIES.has(input.priority)) {
    throw new Error('Choose a valid priority.');
  }
  if (input.depositAmount !== undefined && (Number.isNaN(input.depositAmount) || input.depositAmount < 0 || input.depositAmount > 1000000)) {
    throw new Error('Deposit amount must be between 0 and 1,000,000.');
  }
  if (input.nfcTargetUrl?.trim() && !URL_PATTERN.test(input.nfcTargetUrl.trim())) {
    throw new Error('Enter a valid http or https NFC URL.');
  }
}

function addTrimmedField(payload: Record<string, unknown>, key: keyof UpdateOrderDetailsInput, value: string | undefined) {
  if (value !== undefined) payload[key] = value.trim();
}

const PRINTER_BLOCKED_ORDER_DETAIL_KEYS: (keyof UpdateOrderDetailsInput)[] = [
  'customerName',
  'phone',
  'telegram',
  'whatsapp',
  'email',
  'company',
  'jobTitle',
  'deliveryAddress',
  'paymentStatus',
  'paymentMethod',
  'depositAmount',
];

function isVerifiedPaymentStatus(
  status: PaymentStatus | undefined
): status is 'paid' | 'paid_verified' | 'paid_qr' | 'cash_received' {
  return status === 'paid' || status === 'paid_verified' || status === 'paid_qr' || status === 'cash_received';
}

function isSalesOnlyRole(role: UserRole | undefined): boolean {
  return role === 'sales' || role === 'agent';
}

async function assertPrinterMayEditOrderDetails(input: UpdateOrderDetailsInput) {
  const uid = actorId();
  if (!uid) return;
  const userSnap = await getDoc(doc(db, firebaseCollections.users, uid));
  if (!userSnap.exists()) return;
  const role = userSnap.data().role as UserRole;
  if (!isPrinterOperatorRole(role)) return;
  const blocked = PRINTER_BLOCKED_ORDER_DETAIL_KEYS.some((key) => input[key] !== undefined);
  if (blocked) {
    throw new Error('Printer operators cannot edit customer or payment details.');
  }
}

export async function updateOrderDetails(
  orderId: string,
  input: UpdateOrderDetailsInput,
  updatedBy?: string
): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  assertValidOrderDetailsUpdate(input);
  await assertPrinterMayEditOrderDetails(input);

  const before = input.paymentStatus !== undefined ? await getOrder(orderId) : null;
  const userId = actorId(updatedBy);
  const requestedPaymentStatus = input.paymentStatus;
  const paymentStatusChanged =
    requestedPaymentStatus !== undefined && requestedPaymentStatus !== before?.paymentStatus;

  if (paymentStatusChanged) {
    const role = await getActorRole(userId);
    if (isSalesOnlyRole(role)) {
      throw new Error('Sales cannot edit payment status directly. Use Approve Production to confirm payment.');
    }
    if (!isVerifiedPaymentStatus(requestedPaymentStatus)) {
      throw new Error('Use finance tools for non-paid payment changes.');
    }
  }

  const payload: Record<string, unknown> = {};
  addTrimmedField(payload, 'customerName', input.customerName);
  addTrimmedField(payload, 'phone', input.phone);
  addTrimmedField(payload, 'telegram', input.telegram);
  addTrimmedField(payload, 'whatsapp', input.whatsapp);
  addTrimmedField(payload, 'email', input.email?.toLowerCase());
  addTrimmedField(payload, 'company', input.company);
  addTrimmedField(payload, 'jobTitle', input.jobTitle);
  addTrimmedField(payload, 'deliveryAddress', input.deliveryAddress);
  addTrimmedField(payload, 'paymentMethod', input.paymentMethod);
  addTrimmedField(payload, 'dueDate', input.dueDate);
  addTrimmedField(payload, 'notes', input.notes);
  addTrimmedField(payload, 'nfcTargetUrl', input.nfcTargetUrl);

  if (input.productType !== undefined) payload.productType = input.productType;
  if (input.quantity !== undefined) payload.quantity = input.quantity;
  if (input.cardDesign !== undefined) payload.cardDesign = input.cardDesign;
  if (input.nfcEnabled !== undefined) payload.nfcEnabled = input.nfcEnabled;
  if (input.qrPrinted !== undefined) payload.qrPrinted = input.qrPrinted;
  if (requestedPaymentStatus !== undefined && !paymentStatusChanged) {
    payload.paymentStatus = requestedPaymentStatus as PaymentStatus;
  }
  if (input.depositAmount !== undefined) payload.depositAmount = input.depositAmount;
  if (input.priority !== undefined) payload.priority = input.priority;

  if (Object.keys(payload).length > 0) {
    await updateDoc(doc(db, firebaseCollections.orders, orderId), {
      ...payload,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
  }

  if (paymentStatusChanged && isVerifiedPaymentStatus(requestedPaymentStatus)) {
    await updateDoc(doc(db, firebaseCollections.orders, orderId), {
      paymentStatus: requestedPaymentStatus,
      manualVerificationStatus: 'verified',
      paymentVerifiedBy: userId,
      paymentVerifiedAt: serverTimestamp(),
      paidAt: serverTimestamp(),
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function freezeOrderCard(orderId: string, reason?: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardStatus: 'frozen' as OrderCardStatus,
    freezeReason: reason?.trim() ?? '',
    frozenBy: userId,
    frozenAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function unfreezeOrderCard(orderId: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardStatus: 'active' as OrderCardStatus,
    freezeReason: deleteField(),
    frozenBy: deleteField(),
    frozenAt: deleteField(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function closeOrderCard(orderId: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardStatus: 'closed' as OrderCardStatus,
    closedBy: userId,
    closedAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function reopenOrderCard(orderId: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardStatus: 'active' as OrderCardStatus,
    closedBy: deleteField(),
    closedAt: deleteField(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export function mapPrinterJob(id: string, data: any): PrinterJob {
  return {
    id,
    orderId: String(data.orderId ?? ''),
    cardId: data.cardId ? String(data.cardId) : undefined,
    batchId: data.batchId as string | undefined,
    companyId: data.companyId as string | undefined,
    branch: data.branch as string | undefined,
    printerId: String(data.printerId ?? ''),
    queueNumber: Number(data.queueNumber ?? 0),
    stage: normalizePrinterJobStage(data.stage),
    cardsPrinted: Number(data.cardsPrinted ?? 0),
    failedCards: Number(data.failedCards ?? 0),
    reprintedCards: Number(data.reprintedCards ?? 0),
    failedCardsApproved: Boolean(data.failedCardsApproved ?? false),
    perCardBonus: Number(data.perCardBonus ?? 0.5),
    perOrderBonus: Number(data.perOrderBonus ?? 0),
    salaryStatus: data.salaryStatus ?? 'unpaid',
    notes: data.notes,
    qaVideoUrl: data.qaVideoUrl,
    isReprint: data.isReprint ?? false,
    reprintOfJobId: data.reprintOfJobId,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getPrinterJobByOrderId(orderId: string): Promise<PrinterJob | null> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.printerJobs), where('orderId', '==', orderId))
  );
  if (snapshot.empty) return null;

  const jobs = snapshot.docs
    .map((d) => mapPrinterJob(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const inQualityCheck = jobs.find((job) => job.stage === 'quality_check');
  if (inQualityCheck) return inQualityCheck;

  const active = jobs.find((job) => job.stage !== 'completed' && job.stage !== 'failed');
  return active ?? jobs[0];
}

export function subscribePrinterJobs(
  role: UserRole,
  userId: string,
  callback: (jobs: PrinterJob[]) => void,
  onError?: (error: Error) => void,
  batchId?: string | null
) {
  if (!userId || role === 'guest' || role === 'customer' || role === 'sales' || role === 'agent') {
    callback([]);
    return () => {};
  }

  if (!batchId?.trim()) {
    callback([]);
    return () => {};
  }

  const isPrinterRole =
    role === 'printer' || role === 'printer_operator';

  const jobsQuery = isPrinterRole
    ? query(
        collection(db, firebaseCollections.printerJobs),
        where('batchId', '==', batchId),
        where('printerId', 'in', ['', userId])
      )
    : query(collection(db, firebaseCollections.printerJobs), where('batchId', '==', batchId));

  return onSnapshot(
    jobsQuery,
    (snapshot) => {
      const jobs = snapshot.docs
        .map((d) => mapPrinterJob(d.id, d.data()))
        .sort((a, b) => a.queueNumber - b.queueNumber);
      callback(jobs);
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

function mapNotification(id: string, data: any): AppNotification {
  return {
    id,
    title: data.title ?? 'Notification',
    message: data.message ?? '',
    isRead: Boolean(data.isRead ?? false),
    createdAt: toIso(data.createdAt),
    userId: data.userId,
    priority: data.priority,
    actionUrl: data.actionUrl,
  };
}

export function subscribeNotifications(
  userId: string,
  callback: (items: AppNotification[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId || userId === 'guest') {
    callback([]);
    return () => {};
  }

  const notifQuery = query(collection(db, firebaseCollections.notifications), where('userId', '==', userId));

  return onSnapshot(
    notifQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapNotification(d.id, d.data()));
      callback(sortIsoNewestFirst(items));
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!notificationId?.trim()) return;
  await updateDoc(doc(db, firebaseCollections.notifications, notificationId), {
    isRead: true,
    updatedAt: serverTimestamp(),
    updatedBy: actorId(),
  });
}

export async function updatePrinterJob(
  jobId: string,
  stage: PrinterJobStage,
  extra?: Partial<Pick<PrinterJob, 'cardsPrinted' | 'failedCards' | 'reprintedCards' | 'notes'>>,
  updatedBy?: string
): Promise<void> {
  const ref = doc(db, firebaseCollections.printerJobs, jobId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Printer job not found.');

  const job = mapPrinterJob(snap.id, snap.data());
  const userId = actorId(updatedBy);
  const order = job.orderId ? await getOrder(job.orderId) : null;
  const cardId = job.cardId || order?.cardId || order?.cardCode || '';
  if (!cardId) {
    throw new Error('Printer job is missing cardId.');
  }
  if (order?.cardId && job.cardId && order.cardId !== job.cardId) {
    throw new Error('Production blocked: order.cardId does not match printerJob.cardId.');
  }
  const card = await getCardIdentity(cardId);
  if (!card) {
    throw new Error('Production blocked: card document is missing.');
  }
  const actorRole = await getActorRole(userId);
  if (
    (stage === 'ready_to_ship' || stage === 'completed') &&
    actorRole !== 'qa_inspector' &&
    actorRole !== 'admin' &&
    actorRole !== 'super_admin'
  ) {
    throw new Error('Only a QA inspector can release jobs to shipping.');
  }
  assertValidJobTransition(job.stage, stage);
  if (['printing', 'nfc_encoding', 'quality_check', 'ready_to_ship', 'completed'].includes(stage)) {
    await assertCardReadyForPrint(card.cardId);
  }

  const safeExtra = {
    ...extra,
  };
  for (const key of ['cardsPrinted', 'failedCards', 'reprintedCards'] as const) {
    const value = safeExtra[key];
    if (value !== undefined && (!Number.isInteger(value) || value < 0 || value > 1000)) {
      throw new Error(`${key} must be a whole number from 0 to 1000.`);
    }
  }

  const updatePayload: Record<string, unknown> = {
    cardId: card.cardId,
    stage,
    ...safeExtra,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  };

  if (!job.printerId && userId && stage !== 'received') {
    updatePayload.printerId = userId;
  }

  await updateDoc(ref, updatePayload);

  const nextCardStatus =
    stage === 'printing'
      ? 'printed'
      : stage === 'nfc_encoding'
        ? 'encoded'
        : stage === 'quality_check'
          ? 'verified'
          : stage === 'ready_to_ship' || stage === 'completed'
            ? 'active'
            : null;
  if (nextCardStatus) {
    await updateCardProductionStatus(card.cardId, nextCardStatus, userId, {
      productionJobId: job.id,
      productionOrderId: job.orderId,
    }).catch(() => undefined);
  }
  await recordProductionLog({
    action: `printer_job_${stage}`,
    jobId: job.id,
    orderId: job.orderId,
    cardId: card.cardId,
    actorId: userId,
  }).catch(() => undefined);

  const nextOrderStatus = orderStatusForStage(stage);
  if (nextOrderStatus && job.orderId) {
    await updateOrderStatus(job.orderId, nextOrderStatus, userId);
  }
}

export async function saveQaVideo(jobId: string, videoUri: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(jobId, 'Printer job ID is required.');
  assertNonEmpty(videoUri, 'QA video is required.');
  const remoteUrl = videoUri.startsWith('http') ? videoUri : await uploadQaVideo(jobId, videoUri);
  const ref = doc(db, firebaseCollections.printerJobs, jobId);
  await updateDoc(ref, {
    qaVideoUrl: remoteUrl,
    updatedBy: actorId(updatedBy),
    updatedAt: serverTimestamp(),
  });
  const jobSnap = await getDoc(ref);
  if (jobSnap.exists()) {
    const job = jobSnap.data();
    if (job.orderId) {
      await updateOrderStatus(job.orderId, 'qa_pending', updatedBy);
    }
  }
}

export async function saveNfcWrite(payload: {
  chipUID: string;
  profileUrl: string;
  orderId: string;
  cardCode: string;
  cardId?: string;
  jobId?: string;
  writtenBy: string;
  ownerUserId?: string;
  profileId?: string;
}): Promise<void> {
  const cardId = (payload.cardId || payload.cardCode).trim();
  assertNonEmpty(cardId, 'Card ID is required.');

  const order = payload.orderId ? await getOrder(payload.orderId) : null;
  if (order?.cardId && order.cardId !== cardId) {
    throw new Error('Production blocked: order.cardId does not match NFC cardId.');
  }
  const card = await assertCardReadyForPrint(cardId);
  const chipUrl = card.lockedPublicProfileUrl || card.printProfileUrl || card.publicProfileUrl;
  if (!chipUrl?.trim()) {
    throw new Error('Card public profile URL is missing. Cannot write NFC.');
  }
  if (payload.profileUrl.trim() && payload.profileUrl.trim() !== chipUrl) {
    throw new Error('NFC URL must come from cards/{cardId}.publicProfileUrl.');
  }

  const ref = doc(db, firebaseCollections.nfcCards, cardId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const data = existing.data();
    if (data.profileUrl && data.writtenBy && data.writtenBy !== payload.writtenBy) {
      throw new Error('This card code is already assigned to another user.');
    }
  }

  let profileId = payload.profileId;
  let ownerUserId = payload.ownerUserId;
  if (!profileId && payload.orderId) {
    const orderSnap = await getDoc(doc(db, firebaseCollections.orders, payload.orderId));
    if (orderSnap.exists()) {
      profileId = orderSnap.data().createdBy;
      ownerUserId = orderSnap.data().createdBy;
    }
  }

  await setDoc(
    ref,
    {
      cardId,
      cardCode: cardId,
      chipUID: payload.chipUID,
      profileUrl: chipUrl,
      orderId: payload.orderId,
      jobId: payload.jobId ?? '',
      ownerUserId,
      profileId,
      status: 'encoded',
      verificationStatus: 'written' as NfcStatus,
      writtenBy: payload.writtenBy,
      writtenAt: serverTimestamp(),
      updatedBy: payload.writtenBy,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateCardProductionStatus(cardId, 'encoded', payload.writtenBy, {
    productionOrderId: payload.orderId,
    productionJobId: payload.jobId ?? '',
    encodedAt: serverTimestamp(),
    nfcUrl: chipUrl,
  }).catch(() => undefined);
  await recordProductionLog({
    action: 'nfc_written',
    jobId: payload.jobId,
    orderId: payload.orderId,
    cardId,
    actorId: payload.writtenBy,
  }).catch(() => undefined);
}

export async function updateNfcStatus(cardCode: string, status: NfcStatus, updatedBy?: string): Promise<void> {
  assertNonEmpty(cardCode, 'Card code is required.');
  const lifecycle = verificationToLifecycle(status);
  await setDoc(
    doc(db, firebaseCollections.nfcCards, cardCode),
    {
      cardId: cardCode,
      cardCode,
      verificationStatus: status,
      status: lifecycle,
      updatedBy: actorId(updatedBy),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  if (status === 'verified') {
    await updateCardProductionStatus(cardCode, 'verified', actorId(updatedBy), {
      verifiedAt: serverTimestamp(),
    }).catch(() => undefined);
  } else if (status === 'writing' || status === 'written') {
    await updateCardProductionStatus(cardCode, 'encoded', actorId(updatedBy)).catch(() => undefined);
  }
}

export async function getNfcCard(cardCode: string): Promise<NfcCard | null> {
  const snap = await getDoc(doc(db, firebaseCollections.nfcCards, cardCode));
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
    verificationStatus: data.verificationStatus ?? lifecycleToVerification(data.status ?? 'assigned'),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function listSalaryRecords(printerId: string): Promise<SalaryRecord[]> {
  if (!printerId) return [];
  const salaryQuery = query(
    collection(db, firebaseCollections.salaryRecords),
    where('printerId', '==', printerId)
  );
  const snap = await getDocs(salaryQuery);
  const items = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      printerId: data.printerId,
      printerName: data.printerName,
      period: data.period,
      baseSalary: Number(data.baseSalary ?? 0),
      totalCards: Number(data.totalCards ?? 0),
      failedCards: Number(data.failedCards ?? 0),
      approvedFailedCards: Number(data.approvedFailedCards ?? 0),
      perCardBonus: Number(data.perCardBonus ?? 0),
      qualityBonus: Number(data.qualityBonus ?? 0),
      total: Number(data.total ?? 0),
      status: data.status ?? 'unpaid',
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    } as SalaryRecord;
  });
  return items.sort((a, b) => b.period.localeCompare(a.period));
}

export async function listPayouts(userId: string): Promise<Payout[]> {
  if (!userId || userId === 'guest') return [];
  const payoutQuery = query(
    collection(db, firebaseCollections.payouts),
    where('userId', '==', userId)
  );
  const snap = await getDocs(payoutQuery);
  return sortNewestFirst(
    snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        amount: Number(data.amount ?? 0),
        periodLabel: data.periodLabel,
        status: data.status ?? 'pending',
        createdAt: toIso(data.createdAt),
      } as Payout;
    })
  );
}

export async function upsertBioPage(
  userId: string,
  payload: Omit<BioPage, 'id' | 'userId' | 'updatedAt'>
): Promise<void> {
  assertNonEmpty(userId, 'User ID is required.');
  assertNonEmpty(payload.displayName, 'Display name is required.');
  assertNonEmpty(payload.slug, 'Slug is required.');
  const normalizedSlug = payload.slug.trim().toLowerCase();
  const duplicateSlug = await getDocs(
    query(
      collection(db, firebaseCollections.bioPages),
      where('slug', '==', normalizedSlug),
      where('status', 'in', ['active', 'trial']),
    ),
  );
  if (duplicateSlug.docs.some((page) => page.id !== userId)) {
    throw new Error('That public URL slug is already taken.');
  }

  const [existingBioSnap, ownerSnap] = await Promise.all([
    getDoc(doc(db, firebaseCollections.bioPages, userId)),
    getDoc(doc(db, firebaseCollections.users, userId)),
  ]);
  const existingBio = existingBioSnap.exists() ? existingBioSnap.data() : null;
  const owner = ownerSnap.exists() ? ownerSnap.data() : null;
  const trialStartedAt = owner?.trialStartedAt ? toIso(owner.trialStartedAt) : undefined;
  const trialEndsAt = owner?.trialEndsAt ? toIso(owner.trialEndsAt) : undefined;
  const nowIso = new Date().toISOString();
  const isExpired = Boolean(trialEndsAt && trialEndsAt < nowIso);
  const hasTrialWindow = Boolean(trialEndsAt) || owner?.plan === 'guest_trial';
  const derivedStatus: 'trial' | 'active' | 'expired' = isExpired
    ? 'expired'
    : hasTrialWindow && !isExpired
      ? 'trial'
      : (existingBio?.status === 'trial' ? 'active' : (existingBio?.status ?? 'active'));

  await setDoc(
    doc(db, firebaseCollections.bioPages, userId),
    withoutUndefined({
      ...payload,
      ownerUid: userId,
      publicSlug: normalizedSlug,
      status: derivedStatus,
      trialStartedAt,
      trialEndsAt,
      views: typeof existingBio?.views === 'number' ? existingBio.views : 0,
      taps: typeof existingBio?.taps === 'number' ? existingBio.taps : 0,
      slug: normalizedSlug,
      userId,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );

  await syncProfileFromBio(userId, { ...payload, slug: normalizedSlug }).catch(() => undefined);
  await syncBioToCard(userId, {
    displayName: payload.displayName,
    whatsapp: payload.whatsapp,
    email: payload.email,
    telegram: payload.telegram,
    tagline: payload.tagline,
    photoUrl: payload.photoUrl,
  }).catch(() => undefined);
}

export async function getBioPage(userId: string): Promise<BioPage | null> {
  const snap = await getDoc(doc(db, firebaseCollections.bioPages, userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId ?? userId,
    ownerUid: data.ownerUid,
    slug: data.slug ?? '',
    publicSlug: data.publicSlug,
    status: data.status,
    trialStartedAt: data.trialStartedAt ? toIso(data.trialStartedAt) : undefined,
    trialEndsAt: data.trialEndsAt ? toIso(data.trialEndsAt) : undefined,
    displayName: data.displayName ?? '',
    tagline: data.tagline,
    photoUrl: data.photoUrl,
    whatsapp: data.whatsapp,
    instagram: data.instagram,
    telegram: data.telegram,
    email: data.email,
    website: data.website,
    linkedin: data.linkedin,
    twitter: data.twitter,
    facebook: data.facebook,
    customLinks: data.customLinks ?? [],
    hiddenChannels: Array.isArray(data.hiddenChannels) ? data.hiddenChannels : undefined,
    theme: data.theme ?? 'vibrant_pink',
    views: typeof data.views === 'number' ? data.views : 0,
    taps: typeof data.taps === 'number' ? data.taps : 0,
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getPublicBioPageBySlug(slug: string): Promise<BioPage | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  const pagesQuery = query(
    collection(db, firebaseCollections.bioPages),
    where('slug', '==', normalizedSlug),
    where('status', 'in', ['active', 'trial']),
  );
  const snap = await getDocs(pagesQuery);

  const first = snap.docs[0];
  if (!first) return null;

  const data = first.data();
  return {
    id: first.id,
    userId: data.userId ?? '',
    ownerUid: data.ownerUid,
    slug: data.slug ?? '',
    publicSlug: data.publicSlug,
    status: data.status,
    trialStartedAt: data.trialStartedAt ? toIso(data.trialStartedAt) : undefined,
    trialEndsAt: data.trialEndsAt ? toIso(data.trialEndsAt) : undefined,
    displayName: data.displayName ?? '',
    tagline: data.tagline,
    photoUrl: data.photoUrl,
    whatsapp: data.whatsapp,
    instagram: data.instagram,
    telegram: data.telegram,
    email: data.email,
    website: data.website,
    linkedin: data.linkedin,
    twitter: data.twitter,
    facebook: data.facebook,
    customLinks: data.customLinks ?? [],
    hiddenChannels: Array.isArray(data.hiddenChannels) ? data.hiddenChannels : undefined,
    theme: data.theme ?? 'vibrant_pink',
    views: typeof data.views === 'number' ? data.views : 0,
    taps: typeof data.taps === 'number' ? data.taps : 0,
    updatedAt: toIso(data.updatedAt),
  };
}

export async function trackPublicBioView(pageId: string, cardId?: string): Promise<void> {
  if (!pageId.trim()) return;
  await updateDoc(doc(db, firebaseCollections.bioPages, pageId), {
    views: increment(1),
    updatedAt: serverTimestamp(),
  });
  await recordTapEvent({ profileId: pageId, cardId, source: 'view' }).catch(() => undefined);
}

export async function trackPublicBioTap(pageId: string, cardId?: string): Promise<void> {
  if (!pageId.trim()) return;
  await updateDoc(doc(db, firebaseCollections.bioPages, pageId), {
    taps: increment(1),
    updatedAt: serverTimestamp(),
  });
  await recordTapEvent({ profileId: pageId, cardId, source: 'interaction' }).catch(() => undefined);
}

export async function reassignStaffOrders(fromStaffId: string, toStaffId: string, updatedBy?: string): Promise<number> {
  const q = query(collection(db, firebaseCollections.orders), where('assignedSalesman', '==', fromStaffId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 0;

  const batch = writeBatch(db);
  const userId = actorId(updatedBy);

  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      assignedSalesman: toStaffId,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return snapshot.docs.length;
}
