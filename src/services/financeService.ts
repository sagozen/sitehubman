import {
  Timestamp,
  collection,
  getDocs,
  limit as limitResults,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseCollections } from '@/src/constants/collections';
import { db, firebaseApp } from '@/src/services/firebaseClient';
import type {
  InvoiceLineItem,
  InvoiceRecord,
  InvoiceStatus,
  PaymentIntentStatus,
  RefundRecord,
  RefundStatus,
} from '@/src/types/models';

type CurrencyCode = 'USD' | 'KHR';

export interface FinancePaymentIntent {
  id: string;
  orderId: string;
  userId: string;
  methodId: string;
  amount: number;
  currency: CurrencyCode;
  status: PaymentIntentStatus;
  provider?: string;
  providerRef?: string;
  qrPayload?: string;
  abaDeeplink?: string | null;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  expiresAt?: string;
}

export interface FinanceSnapshot {
  intents: FinancePaymentIntent[];
  refunds: RefundRecord[];
  invoices: InvoiceRecord[];
}

export interface RefundResponse {
  refundId: string;
  amount: number;
  currency: CurrencyCode;
  status: RefundStatus;
  fullyRefunded: boolean;
}

export interface InvoiceResponse {
  invoiceId: string;
  invoiceNumber: string;
  pdfUrl?: string | null;
  status: InvoiceStatus;
}

type DataRecord = Record<string, unknown>;

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
  );
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return (value as any).toDate().toISOString();
  if (isTimestampLike(value)) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return '';
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function optionalNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return optionalString(value);
}

function currency(value: unknown): CurrencyCode {
  return value === 'USD' ? 'USD' : 'KHR';
}

function lineItems(value: unknown): InvoiceLineItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = (item ?? {}) as DataRecord;
    return {
      description: String(row.description ?? ''),
      quantity: Number(row.quantity ?? 1),
      unitAmount: Number(row.unitAmount ?? 0),
      amount: Number(row.amount ?? 0),
      currency: currency(row.currency),
    };
  });
}

function mapIntent(id: string, data: DataRecord): FinancePaymentIntent {
  return {
    id,
    orderId: String(data.orderId ?? ''),
    userId: String(data.userId ?? ''),
    methodId: String(data.methodId ?? ''),
    amount: Number(data.amount ?? 0),
    currency: currency(data.currency),
    status: (data.status as PaymentIntentStatus) ?? 'pending',
    provider: optionalString(data.provider),
    providerRef: optionalString(data.providerRef),
    qrPayload: optionalString(data.qrPayload),
    abaDeeplink: optionalNullableString(data.abaDeeplink),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt) || undefined,
    paidAt: toIso(data.paidAt) || undefined,
    expiresAt: toIso(data.expiresAt) || undefined,
  };
}

function mapRefund(id: string, data: DataRecord): RefundRecord {
  return {
    id,
    orderId: String(data.orderId ?? ''),
    userId: String(data.userId ?? ''),
    assignedSalesman: optionalString(data.assignedSalesman),
    paymentIntentId: optionalString(data.paymentIntentId),
    amount: Number(data.amount ?? 0),
    currency: currency(data.currency),
    reason: String(data.reason ?? ''),
    status: (data.status as RefundStatus) ?? 'pending',
    provider: optionalString(data.provider),
    providerRef: optionalString(data.providerRef),
    createdBy: String(data.createdBy ?? ''),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt) || undefined,
    refundedAt: toIso(data.refundedAt) || undefined,
  };
}

function mapInvoice(id: string, data: DataRecord): InvoiceRecord {
  return {
    id,
    orderId: String(data.orderId ?? ''),
    userId: String(data.userId ?? ''),
    assignedSalesman: optionalString(data.assignedSalesman),
    invoiceNumber: String(data.invoiceNumber ?? ''),
    lineItems: lineItems(data.lineItems),
    amount: Number(data.amount ?? 0),
    currency: currency(data.currency),
    status: (data.status as InvoiceStatus) ?? 'issued',
    pdfPath: optionalString(data.pdfPath),
    pdfUrl: optionalNullableString(data.pdfUrl),
    pdfError: optionalNullableString(data.pdfError),
    issuedAt: toIso(data.issuedAt),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt) || undefined,
    createdBy: optionalString(data.createdBy),
  };
}

export async function fetchFinanceSnapshot(options?: {
  paymentLimit?: number;
  refundLimit?: number;
  invoiceLimit?: number;
}): Promise<FinanceSnapshot> {
  const [intentSnap, refundSnap, invoiceSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, firebaseCollections.paymentIntents),
        orderBy('createdAt', 'desc'),
        limitResults(options?.paymentLimit ?? 60)
      )
    ),
    getDocs(
      query(
        collection(db, firebaseCollections.refunds),
        orderBy('createdAt', 'desc'),
        limitResults(options?.refundLimit ?? 30)
      )
    ),
    getDocs(
      query(
        collection(db, firebaseCollections.invoices),
        orderBy('issuedAt', 'desc'),
        limitResults(options?.invoiceLimit ?? 30)
      )
    ),
  ]);

  return {
    intents: intentSnap.docs.map((doc) => mapIntent(doc.id, doc.data() as DataRecord)),
    refunds: refundSnap.docs.map((doc) => mapRefund(doc.id, doc.data() as DataRecord)),
    invoices: invoiceSnap.docs.map((doc) => mapInvoice(doc.id, doc.data() as DataRecord)),
  };
}

export async function requestOrderRefund(input: {
  orderId: string;
  amount?: number;
  reason: string;
}): Promise<RefundResponse> {
  const callable = httpsCallable<typeof input, RefundResponse>(
    getFunctions(firebaseApp),
    'initiateRefund'
  );
  const result = await callable(input);
  return result.data;
}

export async function fetchInvoiceForOrder(orderId: string): Promise<InvoiceRecord | null> {
  const snap = await getDocs(
    query(
      collection(db, firebaseCollections.invoices),
      where('orderId', '==', orderId),
      orderBy('issuedAt', 'desc'),
      limitResults(1)
    )
  );
  const first = snap.docs[0];
  return first ? mapInvoice(first.id, first.data() as DataRecord) : null;
}

export async function generateOrderInvoice(orderId: string): Promise<InvoiceResponse> {
  const callable = httpsCallable<{ orderId: string }, InvoiceResponse>(
    getFunctions(firebaseApp),
    'generateInvoice'
  );
  const result = await callable({ orderId });
  return result.data;
}

export function formatFinanceAmount(amount: number, currencyCode: CurrencyCode): string {
  if (currencyCode === 'USD') return `$${amount.toFixed(2)}`;
  return `${Math.round(amount).toLocaleString()} KHR`;
}
