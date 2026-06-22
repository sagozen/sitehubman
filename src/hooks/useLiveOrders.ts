/**
 * useLiveOrders — live subscription to a Firestore query that produces Order[].
 *
 * Used by the QA queue, shipping queue, sales dashboard, and any other
 * surface that needs real-time order updates. Auto-resubscribes when the
 * `subscribe` callback changes, and cleans up the listener on unmount.
 */
import { useEffect, useRef, useState } from 'react';
import type { Order } from '@/src/types/models';

type Unsubscribe = () => void;

export function useLiveOrders(
  subscribe: ((cb: (orders: Order[]) => void, onError?: (e: Error) => void) => Unsubscribe) | null,
  deps: ReadonlyArray<unknown> = [],
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    if (!subscribe) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    unsubRef.current = subscribe(
      (next) => {
        setOrders(next);
        setLoading(false);
      },
      (e) => {
        setError(e instanceof Error ? e.message : 'Subscription failed');
        setLoading(false);
      },
    );
    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch { /* ignore */ }
        unsubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { orders, loading, error };
}
