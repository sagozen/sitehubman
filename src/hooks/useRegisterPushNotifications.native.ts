import { useEffect } from 'react';
import { registerPushNotifications } from '@/src/services/pushNotificationService';

export function useRegisterPushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId || userId === 'guest') return;
    void registerPushNotifications(userId).catch(() => undefined);
  }, [userId]);
}
