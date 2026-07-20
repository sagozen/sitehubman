import { useCallback, useEffect, useState } from 'react';
import { type Href, router } from 'expo-router';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';
import { loadGuestCardDraft } from '@/src/services/guestDraftService';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';

export function useGuestActionStats() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [hasDraft, setHasDraft] = useState(false);
  const [insights, setInsights] = useState<CustomerInsights | null>(null);

  const refreshDraft = useCallback(async () => {
    const draft = await loadGuestCardDraft();
    setHasDraft(Boolean(draft));
  }, []);

  const refreshInsights = useCallback(async () => {
    if (isGuest || !user?.id) {
      setInsights(null);
      return;
    }
    try {
      setInsights(await getCustomerInsights(user.id));
    } catch {
      setInsights(null);
    }
  }, [isGuest, user?.id]);

  useEffect(() => {
    void refreshDraft();
    void refreshInsights();
  }, [refreshDraft, refreshInsights]);

  function openPreview() {
    if (insights?.bioSlug) {
      router.push(`/public/${insights.bioSlug}`);
      return;
    }
    requireAccount(undefined, {
      message: 'Sign in and publish your e-card to preview your live NFC profile.',
    });
  }

  async function openCheckout() {
    const cardId = await getStoredGuestCardId();
    if (cardId) {
      router.push(`/checkout/${encodeURIComponent(cardId)}` as Href);
      return;
    }
    router.push(appRoutes.guestDesign);
  }

  return {
    hasDraft,
    insights,
    openPreview,
    openCheckout: () => void openCheckout(),
    refresh: () => {
      void refreshDraft();
      void refreshInsights();
    },
  };
}
