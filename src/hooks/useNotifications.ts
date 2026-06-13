import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNotification } from '@/src/types/models';
import { markNotificationRead, subscribeNotifications } from '@/src/services/firestoreService';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id ?? '';
  const shouldSubscribe = Boolean(
    userId && !user?.isGuest && user?.authType !== 'anonymous' && user?.role !== 'guest'
  );

  useEffect(() => {
    if (!shouldSubscribe) {
      setItems([]);
      setError(null);
      return () => {};
    }

    const unsubscribe = subscribeNotifications(
      userId,
      (next) => {
        setItems(next);
        setError(null);
      },
      (err) => setError(err.message)
    );

    return unsubscribe;
  }, [shouldSubscribe, userId]);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  }, []);

  return { items, unreadCount, error, markRead };
}
