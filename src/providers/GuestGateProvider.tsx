import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
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

  const value = useMemo(() => gate, [gate]);

  return (
    <GuestGateContext.Provider value={value}>
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
                  redirectTarget = '/(tabs)/connections'; // Fallback on failed checkout intent
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

/** Prefer provider context; falls back to a local gate when no provider is mounted. */
export function useRequireAccount() {
  const ctx = useContext(GuestGateContext);
  const local = useGuestGate();
  return ctx ?? local;
}
