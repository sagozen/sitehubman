import { doc, getDoc, serverTimestamp, updateDoc, runTransaction } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { theme } from '@/src/constants/theme';
import { uploadImageToCloudinary } from '@/src/services/cloudinaryService';
import { auth, db } from '@/src/services/firebaseClient';
import type { AppUser, Order, PaymentStatus, UserRole } from '@/src/types/models';
import { normalizeRole } from '@/src/utils/authFlow';

type UploadPaymentProofInput = {
  orderId: string;
  fileUri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

function actorId() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required.');
  return uid;
}

async function getActorRole(userId: string): Promise<UserRole> {
  const snap = await getDoc(doc(db, firebaseCollections.users, userId));
  return normalizeRole(snap.exists() ? snap.data().role : undefined);
}

function canVerifyPayment(role: UserRole) {
  return role === 'admin' || role === 'super_admin' || role === 'sales' || role === 'agent';
}

async function assertPaymentVerifier(userId: string): Promise<void> {
  const role = await getActorRole(userId);
  if (!canVerifyPayment(role)) {
    throw new Error('Only sales or admin can verify payments.');
  }
}

export function isPaymentVerified(order: Pick<Order, 'paymentStatus'> | null | undefined): boolean {
  const status = order?.paymentStatus;
  return (
    status === 'paid_verified'
    || status === 'paid'
    || status === 'paid_qr'
    || status === 'cash_received'
  );
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'Pending payment';
    case 'under_review':
      return 'Under review';
    case 'paid_verified':
      return 'Paid verified';
    case 'partial':
      return 'Partial';
    case 'paid':
      return 'Paid';
    case 'paid_qr':
      return 'QR / Bank paid';
    case 'cash_received':
      return 'Cash received';
    case 'unpaid':
    default:
      return 'Unpaid';
  }
}

export function getPaymentStatusBadgeColor(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
    case 'paid_verified':
    case 'paid_qr':
    case 'cash_received':
      return theme.status.success;
    case 'under_review':
      return theme.status.warning;
    case 'pending_payment':
    case 'partial':
      return theme.status.pending;
    case 'unpaid':
    default:
      return theme.status.error;
  }
}

export async function uploadPaymentProof(input: UploadPaymentProofInput): Promise<{ url: string; path: string }> {
  const userId = actorId();
  const orderId = input.orderId.trim();
  if (!orderId) throw new Error('Order ID is required.');
  if (!input.fileUri?.trim()) throw new Error('Payment proof image is required.');

  const uploaded = await uploadImageToCloudinary({
    uri: input.fileUri,
    folder: `sitehub/payment-proofs/${userId}/${orderId}`,
    fileName: input.fileName,
    mimeType: input.mimeType,
    tags: ['payment', 'proof'],
  });

  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    paymentProofUrl: uploaded.url,
    paymentProofPath: uploaded.publicId,
    paymentStatus: 'under_review' satisfies PaymentStatus,
    manualVerificationStatus: 'proof_submitted',
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  return { url: uploaded.url, path: uploaded.publicId };
}

export async function submitPaymentReference(orderId: string, reference: string): Promise<void> {
  const userId = actorId();
  const trimmedOrderId = orderId.trim();
  const trimmedReference = reference.trim();
  if (!trimmedOrderId) throw new Error('Order ID is required.');
  if (!trimmedReference) throw new Error('Payment reference is required.');

  await updateDoc(doc(db, firebaseCollections.orders, trimmedOrderId), {
    paymentReference: trimmedReference,
    paymentStatus: 'under_review' satisfies PaymentStatus,
    manualVerificationStatus: 'reference_submitted',
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

export async function verifyPayment(orderId: string, note?: string): Promise<void> {
  const userId = actorId();
  await assertPaymentVerifier(userId);
  const trimmedOrderId = orderId.trim();
  if (!trimmedOrderId) throw new Error('Order ID is required.');

  const orderRef = doc(db, firebaseCollections.orders, trimmedOrderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) {
      throw new Error('Order not found.');
    }
    const orderData = snap.data();
    if (orderData.paymentStatus === 'paid_verified') {
      throw new Error('Payment has already been verified.');
    }

    transaction.update(orderRef, {
      paymentStatus: 'paid_verified' satisfies PaymentStatus,
      manualVerificationStatus: 'verified',
      paymentVerifiedBy: userId,
      paymentVerifiedAt: new Date().toISOString(),
      paymentReviewNote: note?.trim() || '',
      paidAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  });
}

export async function rejectPayment(orderId: string, reason: string): Promise<void> {
  const userId = actorId();
  await assertPaymentVerifier(userId);
  const trimmedOrderId = orderId.trim();
  const trimmedReason = reason.trim();
  if (!trimmedOrderId) throw new Error('Order ID is required.');
  if (!trimmedReason) throw new Error('Rejection reason is required.');

  await updateDoc(doc(db, firebaseCollections.orders, trimmedOrderId), {
    paymentStatus: 'pending_payment' satisfies PaymentStatus,
    manualVerificationStatus: 'rejected',
    paymentVerifiedBy: userId,
    paymentVerifiedAt: new Date().toISOString(),
    paymentReviewNote: trimmedReason,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

export function userCanVerifyPayments(user: AppUser | null | undefined): boolean {
  return Boolean(user && canVerifyPayment(user.role));
}
