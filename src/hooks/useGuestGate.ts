import { useCallback, useRef, useState } from 'react';
import { useIsGuest } from '@/src/hooks/useIsGuest';

export function useGuestGate() {
  const isGuest = useIsGuest();
  const [unlockVisible, setUnlockVisible] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | undefined>(undefined);
  const [unlockTitle, setUnlockTitle] = useState<string | undefined>(undefined);
  const [unlockIntent, setUnlockIntent] = useState<'checkout' | 'connections' | undefined>(undefined);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const closeUnlock = useCallback(() => {
    setUnlockVisible(false);
    setUnlockMessage(undefined);
    setUnlockTitle(undefined);
    setUnlockIntent(undefined);
    pendingActionRef.current = null;
  }, []);

  const showUnlock = useCallback((options?: { message?: string; title?: string; intent?: 'checkout' | 'connections' }) => {
    setUnlockMessage(options?.message);
    setUnlockTitle(options?.title);
    setUnlockIntent(options?.intent);
    setUnlockVisible(true);
  }, []);

  const requireAccount = useCallback(
    (onAllowed?: () => void, options?: { message?: string; title?: string; intent?: 'checkout' | 'connections' }) => {
      if (!isGuest) {
        onAllowed?.();
        return true;
      }
      pendingActionRef.current = onAllowed ?? null;
      showUnlock({ message: options?.message, title: options?.title, intent: options?.intent });
      return false;
    },
    [isGuest, showUnlock]
  );

  /** Runs the action passed to requireAccount, if any. Returns true when an action ran. */
  const consumePendingAction = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (!action) return false;
    action();
    return true;
  }, []);

  return {
    isGuest,
    unlockVisible,
    unlockMessage,
    unlockTitle,
    unlockIntent,
    closeUnlock,
    showUnlock,
    requireAccount,
    consumePendingAction,
  };
}
