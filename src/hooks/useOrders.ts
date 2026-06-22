/**
 * useOrders — stable hook with no infinite loop.
 *
 * Fix: `refresh` uses a ref internally so the useEffect dependency
 * array stays stable. This prevents the double-fetch loop that caused
 * visible lag on every auth state change.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CreateOrderInput, createOrder, listOrders } from '@/src/services/firestoreService';
import { Order, UserRole } from '@/src/types/models';
import { getAuthErrorMessage } from '@/src/services/authService';

export function useOrders(role: UserRole, userId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep latest role/userId in a ref so refresh() always reads current values
  // without needing to be in the dependency array.
  const ctxRef = useRef({ role, userId });
  useEffect(() => { ctxRef.current = { role, userId }; }, [role, userId]);

  const refresh = useCallback(async () => {
    const { role: r, userId: uid } = ctxRef.current;
    if (!uid || uid === 'guest' || r === 'guest') {
      setOrders([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await listOrders(r, uid);
      setOrders(result);
    } catch (err) {
      setOrders([]);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []); // stable — no deps needed because we use ctxRef

  // Fetch once when userId or role changes
  useEffect(() => {
    if (!userId || userId === 'guest' || role === 'guest') {
      setOrders([]);
      return;
    }
    void refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role]); // intentionally NOT including refresh

  const submitOrder = useCallback(
    async (input: CreateOrderInput) => {
      setError(null);
      await createOrder(input);
      await refresh();
    },
    [refresh]
  );

  return { orders, isLoading, error, refresh, submitOrder };
}
