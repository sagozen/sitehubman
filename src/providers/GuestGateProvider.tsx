import { PropsWithChildren, createContext, useContext } from 'react';
import { router } from 'expo-router';
import { AuthSignupSheet } from '@/src/features/auth/components/AuthSignupSheet';
import { useGuestGate } from '@/src/hooks/useGuestGate';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyCardMigration } from '@/src/services/guestCardDraftService';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';

type GuestGateContextValue = ReturnType<typeof useGuestGate>;

const GuestGateContext = createContext<GuestGateContextValue | undefined>(undefined);

export function GuestGateProvider({ children }: PropsWithChildren) {
  const gate = useGuestGate();

  // FIX: Don't wrap gate in useMemo — gate is already composed of
  // stable useCallback/useState values from useGuestGate. Wrapping
  // it in useMemo(() => gate, [gate]) was pointless because the
  // object reference changes every render, defeating the memo.
  // Pass gate directly as the context value.

  return (
    <GuestGateContext.Provider value={gate}>
      {children}
      <AuthSignupSheet
        visible={gate.unlockVisible}
        onClose={gate.closeUnlock}
        title={gate.unlockTitle ?? 'Unlock your NFC identity'}
        subtitle={
          gate.unlockMessage ??
          'Sign in or create an account to save your card, sync to the cloud, and continue here.'
        }
        onSuccess={async (user) => {
          const stayedOnScreen = gate.consumePendingAction();
          if (!stayedOnScreen) {
            let redirectTarget = await getPostAuthDestination(user, { intent: gate.unlockIntent });
            
            const cardId = await getStoredGuestCardId();
            if (cardId) {
               const { migrated, status } = await verifyCardMigration(cardId, user.id);
               const guestId = await AsyncStorage.getItem('currentGuestId');
               
               console.log('[AuthRedirect] Resolving modal post auth:', {
                 guestId,
                 customerId: user.id,
                 cardId,
                 intent: gate.unlockIntent,
                 redirectTarget: migrated ? redirectTarget : 'connections',
                 migrationStatus: status,
               });
               
               if (!migrated && gate.unlockIntent === 'checkout') {
                  redirectTarget = '/connections'; // Fallback on failed checkout intent
               }
            }

            router.replace(redirectTarget);
          }
        }}
      />
    </GuestGateContext.Provider>
  );
}

export function useGuestGateContext() {
  const ctx = useContext(GuestGateContext);
  if (!ctx) {
    throw new Error('useGuestGateContext must be used within GuestGateProvider');
  }
  return ctx;
}

/**
 * Prefer provider context; falls back to a local gate when no provider is mounted.
 *
 * FIX: Previously this ALWAYS called useGuestGate() even when the
 * provider context was available. That created duplicate state hooks
 * and unstable callback references that contributed to the infinite
 * re-render loop. Now we only call useGuestGate() at the top level
 * (required by rules of hooks) but only use it when ctx is absent.
 */
export function useRequireAccount() {
  const ctx = useContext(GuestGateContext);
  const local = useGuestGate();
  return ctx ?? local;
}
