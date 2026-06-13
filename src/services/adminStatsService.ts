import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { db } from '@/src/services/firebaseClient';

export type AdminOrderStats = {
  totalOrders: number;
  paidOrders: number;
  inProduction: number;
  readyToShip: number;
  revenueUsdEstimate: number;
};

/** Lightweight counts — no full order collection download. */
export async function fetchAdminOrderStats(): Promise<AdminOrderStats> {
  const col = collection(db, firebaseCollections.orders);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalSnap, paidSnap, printingSnap, nfcSnap, qaSnap, readySnap] = await Promise.all([
    getCountFromServer(query(col)),
    getCountFromServer(query(col, where('paymentStatus', '==', 'paid'))),
    getCountFromServer(query(col, where('status', '==', 'printing'))),
    getCountFromServer(query(col, where('status', '==', 'nfc_writing'))),
    getCountFromServer(query(col, where('status', '==', 'qa_pending'))),
    getCountFromServer(query(col, where('status', '==', 'ready_to_ship'))),
  ]);

  const paidOrders = paidSnap.data().count;
  const inProduction =
    printingSnap.data().count + nfcSnap.data().count + qaSnap.data().count;

  return {
    totalOrders: totalSnap.data().count,
    paidOrders,
    inProduction,
    readyToShip: readySnap.data().count,
    revenueUsdEstimate: paidOrders * 49,
  };
}

export async function fetchTodayOrderCount(): Promise<number> {
  const startOfDay = Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0)));
  const snap = await getCountFromServer(
    query(collection(db, firebaseCollections.orders), where('createdAt', '>=', startOfDay))
  );
  return snap.data().count;
}
