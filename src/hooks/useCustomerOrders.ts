import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeCustomerOrders,
} from '@/src/services/firestoreService';
import type { Order } from '@/src/types/models';

/**
 * Live subscription to the signed-in customer's orders.
 *
 * Auto-resubscribes when the auth user changes. Falls back to an empty
 * list (no crash) when the user is null or the listener is denied by
 * rules — the home screen shows the seed fallback instead of an error.
 */
export function useCustomerOrders(userId: string | null | undefined, email: string | null | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Subscribe on identity change. Memoized so a parent re-render doesn't
  // tear down and re-open the socket on every state change elsewhere.
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    unsubRef.current = subscribeCustomerOrders(
      userId,
      email,
      (next) => {
        setOrders(next);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : 'Could not load orders.');
        setLoading(false);
      },
    );
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [userId, email]);

  const refresh = useCallback(() => {
    // onSnapshot already gives us live updates — refresh is a no-op but kept
    // for call sites that import the same shape as the other hooks.
  }, []);

  /**
   * Headline order = the most recent active order (not delivered / not closed).
   * Memoized so the consumer doesn't re-compute the latest order on every
   * unrelated state change.
   */
  const headlineOrder = useMemo(() => {
    for (const order of orders) {
      const status = order.status;
      if (status === 'delivered') continue;
      if (order.cardStatus === 'closed') continue;
      return order;
    }
    return orders[0] ?? null;
  }, [orders]);

  return { orders, loading, error, refresh, headlineOrder };
}
