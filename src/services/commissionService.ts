import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { db } from '@/src/services/firebaseClient';
import type { Order } from '@/src/types/models';

function currentPeriodLabel(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Accrue sales commission once when a paid order is delivered. */
export async function accrueSalesCommissionOnDelivery(order: Order): Promise<void> {
  if (order.paymentStatus !== 'paid') return;
  if (order.commissionAccruedAt) return;
  if (!order.assignedSalesman?.trim()) return;

  const amount = order.salesCommission;
  if (amount == null || amount <= 0) return;

  const salesUid = order.assignedSalesman.trim();
  const periodLabel = currentPeriodLabel();

  const existing = await getDocs(
    query(
      collection(db, firebaseCollections.payouts),
      where('userId', '==', salesUid),
      where('periodLabel', '==', periodLabel),
      where('status', '==', 'pending')
    )
  );

  if (existing.empty) {
    await addDoc(collection(db, firebaseCollections.payouts), {
      userId: salesUid,
      amount,
      periodLabel,
      status: 'pending',
      orderIds: [order.id],
      currency: order.salesCommissionCurrency ?? order.currency ?? 'USD',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    const payoutDoc = existing.docs[0];
    const data = payoutDoc.data();
    const priorAmount = typeof data.amount === 'number' ? data.amount : 0;
    const priorOrders = Array.isArray(data.orderIds) ? (data.orderIds as string[]) : [];
    await updateDoc(payoutDoc.ref, {
      amount: priorAmount + amount,
      orderIds: priorOrders.includes(order.id) ? priorOrders : [...priorOrders, order.id],
      updatedAt: serverTimestamp(),
    });
  }

  await updateDoc(doc(db, firebaseCollections.orders, order.id), {
    commissionAccruedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}
