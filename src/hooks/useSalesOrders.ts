/**
 * useSalesOrders — live subscription to orders scoped to the current sales rep.
 *
 * Uses onSnapshot so the dashboard updates the moment production / printer /
 * customer status changes — without needing pull-to-refresh. Auto-resubscribes
 * when the auth user changes. Falls back to an empty list (no crash) if the
 * listener is denied or offline.
 */
import { useEffect, useRef, useState } from 'react';
import {
  collection,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { firebaseCollections } from '@/src/constants/collections';
import { mapOrder } from '@/src/services/orderMappers';
import type { Order, UserRole } from '@/src/types/models';

type Snapshot = ReturnType<typeof onSnapshot>;

export function useSalesOrders(role: UserRole, userId: string, pageSize = 80) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    if (!userId || userId === 'guest' || role === 'guest') {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    // Sales reps see orders they themselves created OR orders assigned to
    // their branch. createdBy gives a stable per-user scope; we add a second
    // listener for ownerId in case orders are reassigned.
    const unsubs: Snapshot[] = [];
    const collected: Order[] = [];
    const seen = new Set<string>();
    const collect = (next: { docs: { id: string; data: () => Record<string, unknown> }[] }) => {
      for (const d of next.docs) {
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        collected.push(mapOrder(d.id, d.data()));
      }
      setOrders(
        collected
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      );
      setIsLoading(false);
    };
    const onErr = (e: Error) => {
      setError(e.message);
      setIsLoading(false);
    };

    const createdBy = query(
      collection(db, firebaseCollections.orders),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc'),
      fbLimit(pageSize),
    );
    unsubs.push(onSnapshot(createdBy, collect, onErr));

    const owner = query(
      collection(db, firebaseCollections.orders),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc'),
      fbLimit(pageSize),
    );
    unsubs.push(onSnapshot(owner, collect, onErr));

    unsubRef.current = (() => () => {
      for (const u of unsubs) {
        try { u(); } catch { /* best-effort */ }
      }
    })() as unknown as Snapshot;

    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch { /* ignore */ }
        unsubRef.current = null;
      }
    };
  }, [role, userId, pageSize]);

  return { orders, isLoading, error };
}
