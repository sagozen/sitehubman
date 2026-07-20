import { useCallback } from 'react';
import { type Href, router } from 'expo-router';
import { CUSTOMER_FLOWS, type CustomerFlowId } from '@/src/constants/customerFlows';
import { appRoutes } from '@/src/constants/navigation';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { recordCustomerFlowOpen } from '@/src/services/customerFlowStorage';

type Options = {
  bioSlug?: string | null;
  cardId?: string | null;
  onPreview?: () => void;
  onCheckout?: () => void;
};

export function useGuestFlowLauncher(options: Options = {}) {
  const { requireAccount } = useRequireAccount();
  const { bioSlug, onPreview } = options;

  const launch = useCallback(
    async (flowId: CustomerFlowId) => {
      await recordCustomerFlowOpen(flowId);

      if (flowId === 'preview') {
        if (bioSlug?.trim()) {
          router.push(`/public/${bioSlug.trim()}` as Href);
          return;
        }
        onPreview?.();
        return;
      }

      if (flowId === 'order') {
        router.push(appRoutes.guestDesign);
        return;
      }

      if (flowId === 'connections' || flowId === 'orders' || flowId === 'profile') {
        requireAccount(undefined, {
          message: 'Sign in to manage connections and orders.',
          intent: 'connections',
        });
        return;
      }

      router.push(CUSTOMER_FLOWS[flowId].route);
    },
    [bioSlug, onPreview, requireAccount],
  );

  const launchNfcDemo = useCallback(() => {
    router.push(appRoutes.nfcDemo);
  }, []);

  return { launch, launchNfcDemo };
}
