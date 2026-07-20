import { useCallback } from 'react';
import { type Href, router } from 'expo-router';
import {
  CUSTOMER_FLOWS,
  type CustomerFlowId,
} from '@/src/constants/customerFlows';
import { recordCustomerFlowOpen } from '@/src/services/customerFlowStorage';
type LauncherOptions = {
  bioSlug?: string | null;
  cardId?: string | null;
};

export function useCustomerFlowLauncher(options: LauncherOptions = {}) {
  const { bioSlug } = options;

  const launch = useCallback(
    async (flowId: CustomerFlowId) => {
      await recordCustomerFlowOpen(flowId);

      let target: Href = CUSTOMER_FLOWS[flowId].route;

      if (flowId === 'preview' && bioSlug?.trim()) {
        target = `/public/${bioSlug.trim()}` as Href;
      }

      router.push(target);
    },
    [bioSlug],
  );

  return { launch };
}
