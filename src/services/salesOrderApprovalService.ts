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
import { auth, db } from '@/src/services/firebaseClient';
import { getOrder } from '@/src/services/firestoreService';
import { approveOrderForProduction } from '@/src/services/productionService';
import type {
  LedgerTransactionType,
  LedgerWallet,
  Order,
  OrderPaymentRecordStatus,
  OrderStatus,
  SalesPaymentConfirmation,
  UserRole,
} from '@/src/types/models';
import { getOrderTotalUsd } from '@/src/utils/orderPricing';
import { isPhysicalFulfillment, needsSalesApproval } from '@/src/utils/orderProduction';

function actorId(fallback?: string) {
  return auth.currentUser?.uid || fallback || '';
}

async function getActorRole(userId: string): Promise<UserRole | undefined> {
  if (!userId) return undefined;
  const snap = await getDoc(doc(db, firebaseCollections.users, userId));
  return snap.exists() ? (snap.data().role as UserRole | undefined) : undefined;
}

function canConfirmSalesPayment(role: UserRole | undefined): boolean {
  return role === 'sales' || role === 'agent' || role === 'admin' || role === 'super_admin';
}

function paymentRecordStatus(confirmation: SalesPaymentConfirmation): OrderPaymentRecordStatus {
  if (confirmation === 'qr_paid') return 'paid_qr';
  return 'cash_received';
}

function orderPaymentStatus(confirmation: SalesPaymentConfirmation): Order['paymentStatus'] {
  if (confirmation === 'qr_paid') return 'paid_qr';
  return 'cash_received';
}

function resolvesToProduction(confirmation: SalesPaymentConfirmation): boolean {
  return confirmation === 'qr_paid' || confirmation === 'cash_received';
}

async function bumpWallet(
  walletId: string,
  wallet: LedgerWallet,
  amount: number,
  currency: 'USD' | 'KHR'
): Promise<void> {
  const ref = doc(db, firebaseCollections.companyWallets, walletId);
  const snap = await getDoc(ref);
  const empty = {
    revenueUsd: 0,
    revenueKhr: 0,
    cashOnHandUsd: 0,
    cashOnHandKhr: 0,
    bankUsd: 0,
    bankKhr: 0,
  };
  const base = snap.exists() ? { ...empty, ...(snap.data() as Record<string, number>) } : empty;

  const field =
    wallet === 'revenue'
      ? currency === 'USD'
        ? 'revenueUsd'
        : 'revenueKhr'
      : wallet === 'company_cash'
        ? currency === 'USD'
          ? 'cashOnHandUsd'
          : 'cashOnHandKhr'
        : currency === 'USD'
          ? 'bankUsd'
          : 'bankKhr';

  const payload = {
    ...base,
    [field]: Number(base[field] ?? 0) + amount,
    updatedAt: serverTimestamp(),
  };

  if (snap.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, payload);
  }
}

async function createLedgerTransaction(input: {
  orderId: string;
  paymentId: string;
  type: LedgerTransactionType;
  amount: number;
  currency: 'USD' | 'KHR';
  wallet: LedgerWallet;
  settlementRequired?: boolean;
  companyId?: string;
  branch?: string;
  createdBy: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, firebaseCollections.ledgerTransactions), {
    orderId: input.orderId,
    paymentId: input.paymentId,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    wallet: input.wallet,
    settlementRequired: input.settlementRequired === true,
    companyId: input.companyId ?? '',
    branch: input.branch ?? '',
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  });
  const walletId = input.companyId?.trim() || 'default';
  await bumpWallet(walletId, input.wallet, input.amount, input.currency);
  return ref.id;
}

async function createPaymentRecord(input: {
  orderId: string;
  orderNumber?: string;
  amount: number;
  currency: 'USD' | 'KHR';
  confirmation: SalesPaymentConfirmation;
  companyId?: string;
  branch?: string;
  confirmedBy: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, firebaseCollections.orderPayments), {
    orderId: input.orderId,
    orderNumber: input.orderNumber ?? '',
    amount: input.amount,
    currency: input.currency,
    status: paymentRecordStatus(input.confirmation),
    confirmationType: input.confirmation,
    companyId: input.companyId ?? '',
    branch: input.branch ?? '',
    confirmedBy: input.confirmedBy,
    confirmedAt: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Sales confirms payment and approves production in ONE tap.
 * Simplified flow: pending_payment → production_approved (skips payment_verified).
 */
export async function confirmSalesProductionApproval(
  orderId: string,
  confirmation: SalesPaymentConfirmation,
  salesUserId?: string
): Promise<Order> {
  const userId = actorId(salesUserId);
  if (!userId) throw new Error('Sign in required.');
  if (confirmation !== 'qr_paid' && confirmation !== 'cash_received') {
    throw new Error('Choose Cash received or QR paid.');
  }

  const role = await getActorRole(userId);
  if (!canConfirmSalesPayment(role)) {
    throw new Error('Only sales or admin can approve production.');
  }

  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (!isPhysicalFulfillment(order)) {
    throw new Error('E-card orders publish automatically — no production approval needed.');
  }
  if (order.salesApprovedAt) {
    throw new Error('Order is already approved for production.');
  }
  if (!needsSalesApproval(order)) {
    throw new Error('Order status does not require sales approval.');
  }

  const amount =
    typeof order.amount === 'number' && order.amount > 0
      ? order.amount
      : getOrderTotalUsd(order);
  const currency = order.currency ?? 'USD';
  const paymentStatus = orderPaymentStatus(confirmation);

  // Create payment record
  const paymentId = await createPaymentRecord({
    orderId,
    orderNumber: order.orderNumber,
    amount,
    currency,
    confirmation,
    companyId: order.companyId,
    branch: order.branch,
    confirmedBy: userId,
  });

  const now = new Date().toISOString();

  // Single write: mark payment + skip straight to production_approved
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    status: 'production_approved' as OrderStatus,
    paymentStatus,
    manualVerificationStatus: 'verified',
    onHold: false,
    salesHoldAt: null,
    salesHoldBy: null,
    paymentVerifiedBy: userId,
    paymentVerifiedAt: now,
    paidAt: now,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  // Record ledger
  if (confirmation === 'qr_paid') {
    await createLedgerTransaction({
      orderId, paymentId, type: 'revenue', amount, currency,
      wallet: 'revenue', companyId: order.companyId, branch: order.branch, createdBy: userId,
    });
  } else {
    await createLedgerTransaction({
      orderId, paymentId, type: 'cash_on_hand', amount, currency,
      wallet: 'company_cash', settlementRequired: true,
      companyId: order.companyId, branch: order.branch, createdBy: userId,
    });
  }

  // Delegate to production approval (creates printer job)
  return approveOrderForProduction(orderId, userId);
}

export function salesPaymentConfirmationLabel(confirmation: SalesPaymentConfirmation): string {
  switch (confirmation) {
    case 'qr_paid':
      return 'Scan QR paid';
    case 'cash_received':
      return 'Cash received';
    default:
      return confirmation;
  }
}

export async function cancelOrder(orderId: string, reason: string, staffUserId?: string): Promise<void> {
  const userId = actorId(staffUserId);
  if (!userId) throw new Error('Sign in required.');

  const role = await getActorRole(userId);
  if (!canConfirmSalesPayment(role)) {
    throw new Error('Only sales or admin can cancel an order.');
  }

  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');

  if (order.batchId) {
    const batchRef = doc(db, firebaseCollections.productionBatches, order.batchId);
    const batchSnap = await getDoc(batchRef);
    if (batchSnap.exists()) {
      const bData = batchSnap.data();
      const updatedOrderIds = (bData.orderIds || []).filter((id: string) => id !== orderId);
      await updateDoc(batchRef, { orderIds: updatedOrderIds, updatedAt: serverTimestamp() });
    }
  }

  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    status: 'cancelled',
    freezeReason: reason,
    frozenAt: new Date().toISOString(),
    frozenBy: userId,
    closedAt: new Date().toISOString(),
    closedBy: userId,
    batchId: '',
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}
