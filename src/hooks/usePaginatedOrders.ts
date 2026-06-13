import { useCallback, useEffect, useState } from 'react';
import { listOrdersPage } from '@/src/services/orderListService';
import { getAuthErrorMessage } from '@/src/services/authService';
import type { Order, UserRole } from '@/src/types/models';

export function usePaginatedOrders(role: UserRole, userId: string, branch?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || userId === 'guest' || role === 'guest') {
      setOrders([]);
      setCursor(null);
      setHasMore(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const page = await listOrdersPage(role, userId, { branch, cursorOrderId: null });
      setOrders(page.items);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setOrders([]);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [role, userId, branch]);

  const loadMore = useCallback(async () => {
    if (!cursor || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await listOrdersPage(role, userId, { branch, cursorOrderId: cursor });
      setOrders((prev) => {
        const seen = new Set(prev.map((o) => o.id));
        const merged = [...prev];
        for (const item of page.items) {
          if (!seen.has(item.id)) merged.push(item);
        }
        return merged;
      });
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }, [branch, cursor, hasMore, isLoadingMore, role, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { orders, isLoading, isLoadingMore, error, hasMore, refresh, loadMore };
}
