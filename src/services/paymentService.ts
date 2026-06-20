import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db, firebaseApp } from '@/src/services/firebaseClient';

export type PaymentIntentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'expired' | 'refunded';

export type PaymentIntentRecord = {
  intentId: string;
  orderId: string;
  userId: string;
  methodId: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  qrPayload: string;
  abaDeeplink?: string | null;
  expiresAt?: string;
  providerRef?: string;
  failureReason?: string;
};

type CreatePaymentIntentResponse = {
  intentId: string;
  qrPayload: string;
  abaDeeplink?: string | null;
  expiresAt: string;
  status: PaymentIntentStatus;
};

function mapIntent(id: string, data: Record<string, unknown>): PaymentIntentRecord {
  return {
    intentId: id,
    orderId: String(data.orderId ?? ''),
    userId: String(data.userId ?? ''),
    methodId: String(data.methodId ?? ''),
    amount: Number(data.amount ?? 0),
    currency: data.currency === 'USD' ? 'USD' : 'KHR',
    status: (data.status as PaymentIntentStatus) ?? 'pending',
    qrPayload: String(data.qrPayload ?? ''),
    abaDeeplink: data.abaDeeplink ? String(data.abaDeeplink) : null,
    expiresAt: typeof data.expiresAt === 'object' && data.expiresAt && 'toDate' in (data.expiresAt as object)
      ? (data.expiresAt as { toDate: () => Date }).toDate().toISOString()
      : typeof data.expiresAt === 'string'
        ? data.expiresAt
        : undefined,
    providerRef: data.providerRef ? String(data.providerRef) : undefined,
    failureReason: data.failureReason ? String(data.failureReason) : undefined,
  };
}

export async function initiatePayment(orderId: string, methodId: string): Promise<PaymentIntentRecord> {
  if (!auth.currentUser) throw new Error('Sign in to pay.');
  const functions = getFunctions(firebaseApp);
  const callable = httpsCallable<{ orderId: string; methodId: string }, CreatePaymentIntentResponse>(
    functions,
    'createPaymentIntent'
  );
  const result = await callable({ orderId, methodId });
  const data = result.data;
  return {
    intentId: data.intentId,
    orderId,
    userId: auth.currentUser.uid,
    methodId,
    amount: 0,
    currency: 'KHR',
    status: data.status,
    qrPayload: data.qrPayload,
    abaDeeplink: data.abaDeeplink,
    expiresAt: data.expiresAt,
  };
}

export async function getPaymentIntent(intentId: string): Promise<PaymentIntentRecord | null> {
  const snap = await getDoc(doc(db, firebaseCollections.paymentIntents, intentId));
  if (!snap.exists()) return null;
  return mapIntent(snap.id, snap.data() as Record<string, unknown>);
}

export function subscribePaymentIntent(
  intentId: string,
  onChange: (intent: PaymentIntentRecord | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(db, firebaseCollections.paymentIntents, intentId),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      onChange(mapIntent(snap.id, snap.data() as Record<string, unknown>));
    },
    (err) => {
      onChange(null);
      onError?.(err);
    }
  );
}
