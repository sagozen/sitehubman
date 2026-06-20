import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db } from '@/src/services/firebaseClient';
import type { CompanyWalletBalances, LedgerTransaction, UserRole } from '@/src/types/models';

function actorId() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required.');
  return uid;
}

async function getActorRole(userId: string): Promise<UserRole | undefined> {
  const snap = await getDoc(doc(db, firebaseCollections.users, userId));
  return snap.exists() ? (snap.data().role as UserRole | undefined) : undefined;
}

function canManageFinance(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'finance';
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function mapTransaction(id: string, data: Record<string, unknown>): LedgerTransaction {
  return {
    id,
    orderId: String(data.orderId ?? ''),
    paymentId: String(data.paymentId ?? ''),
    type: (data.type as LedgerTransaction['type']) ?? 'cash_on_hand',
    amount: Number(data.amount ?? 0),
    currency: data.currency === 'USD' ? 'USD' : 'KHR',
    wallet: (data.wallet as LedgerTransaction['wallet']) ?? 'company_cash',
    settlementRequired: data.settlementRequired === true,
    settledAt: typeof data.settledAt === 'string' ? data.settledAt : undefined,
    settledBy: typeof data.settledBy === 'string' ? data.settledBy : undefined,
    companyId: typeof data.companyId === 'string' ? data.companyId : undefined,
    branch: typeof data.branch === 'string' ? data.branch : undefined,
    createdBy: String(data.createdBy ?? ''),
    createdAt: toIso(data.createdAt),
  };
}

function mapWallet(id: string, data: Record<string, unknown>): CompanyWalletBalances {
  return {
    id,
    revenueUsd: Number(data.revenueUsd ?? 0),
    revenueKhr: Number(data.revenueKhr ?? 0),
    cashOnHandUsd: Number(data.cashOnHandUsd ?? 0),
    cashOnHandKhr: Number(data.cashOnHandKhr ?? 0),
    bankUsd: Number(data.bankUsd ?? 0),
    bankKhr: Number(data.bankKhr ?? 0),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function fetchPendingCashSettlements(companyId = 'default'): Promise<LedgerTransaction[]> {
  const userId = actorId();
  const role = await getActorRole(userId);
  if (!canManageFinance(role)) throw new Error('Only finance admin can view settlements.');

  const snap = await getDocs(
    query(collection(db, firebaseCollections.ledgerTransactions), where('type', '==', 'cash_on_hand'))
  );

  return snap.docs
    .map((d) => mapTransaction(d.id, d.data() as Record<string, unknown>))
    .filter(
      (row) =>
        row.settlementRequired
        && !row.settledAt
        && (!companyId || !row.companyId || row.companyId === companyId)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function fetchCompanyWallet(companyId = 'default'): Promise<CompanyWalletBalances> {
  const userId = actorId();
  const role = await getActorRole(userId);
  if (!canManageFinance(role)) throw new Error('Only finance admin can view wallet balances.');

  const snap = await getDoc(doc(db, firebaseCollections.companyWallets, companyId));
  if (!snap.exists()) {
    return {
      id: companyId,
      revenueUsd: 0,
      revenueKhr: 0,
      cashOnHandUsd: 0,
      cashOnHandKhr: 0,
      bankUsd: 0,
      bankKhr: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return mapWallet(snap.id, snap.data() as Record<string, unknown>);
}

async function adjustWallet(
  walletId: string,
  deltas: Partial<Record<keyof Omit<CompanyWalletBalances, 'id' | 'updatedAt'>, number>>
): Promise<void> {
  const ref = doc(db, firebaseCollections.companyWallets, walletId);
  const snap = await getDoc(ref);
  const base = snap.exists()
    ? (snap.data() as Record<string, number>)
    : {
        revenueUsd: 0,
        revenueKhr: 0,
        cashOnHandUsd: 0,
        cashOnHandKhr: 0,
        bankUsd: 0,
        bankKhr: 0,
      };

  const next: Record<string, unknown> = { updatedAt: serverTimestamp() };
  for (const [key, delta] of Object.entries(deltas)) {
    if (typeof delta === 'number') {
      next[key] = Math.max(0, Number(base[key] ?? 0) + delta);
    }
  }

  if (snap.exists()) {
    await updateDoc(ref, next);
  } else {
    await setDoc(ref, {
      revenueUsd: 0,
      revenueKhr: 0,
      cashOnHandUsd: 0,
      cashOnHandKhr: 0,
      bankUsd: 0,
      bankKhr: 0,
      ...next,
    });
  }
}

/** Finance clears cash collected by sales — moves cash_on_hand to bank wallet. */
export async function settleCashDeposit(transactionId: string): Promise<void> {
  const userId = actorId();
  const role = await getActorRole(userId);
  if (!canManageFinance(role)) throw new Error('Only finance admin can settle cash deposits.');

  const txRef = doc(db, firebaseCollections.ledgerTransactions, transactionId);
  const txSnap = await getDoc(txRef);
  if (!txSnap.exists()) throw new Error('Transaction not found.');

  const tx = mapTransaction(txSnap.id, txSnap.data() as Record<string, unknown>);
  if (tx.type !== 'cash_on_hand' || !tx.settlementRequired) {
    throw new Error('This transaction does not require cash settlement.');
  }
  if (tx.settledAt) throw new Error('Cash deposit already settled.');

  const walletId = tx.companyId?.trim() || 'default';
  const cashField = tx.currency === 'USD' ? 'cashOnHandUsd' : 'cashOnHandKhr';
  const bankField = tx.currency === 'USD' ? 'bankUsd' : 'bankKhr';

  await adjustWallet(walletId, {
    [cashField]: -tx.amount,
    [bankField]: tx.amount,
  });

  const depositRef = doc(collection(db, firebaseCollections.ledgerTransactions));
  await setDoc(depositRef, {
    orderId: tx.orderId,
    paymentId: tx.paymentId,
    type: 'cash_deposit',
    amount: tx.amount,
    currency: tx.currency,
    wallet: 'bank',
    settlementRequired: false,
    companyId: tx.companyId ?? '',
    branch: tx.branch ?? '',
    createdBy: userId,
    createdAt: serverTimestamp(),
  });

  await updateDoc(txRef, {
    settledAt: new Date().toISOString(),
    settledBy: userId,
  });
}
