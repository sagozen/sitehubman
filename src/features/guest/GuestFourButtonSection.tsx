import { useEffect, useState } from 'react';
import { GuestFlowHub } from '@/src/components/GuestFlowHub';
import type { IconFlowMetrics } from '@/src/components/IconFlowHub';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';
import type { CustomerInsights } from '@/src/services/customerInsightsService';

type ChromeColors = {
  textPrimary: string;
  textMuted: string;
  border: string;
};

type Props = {
  colors: ChromeColors;
  hasDraft: boolean;
  insights: CustomerInsights | null;
  onPreview: () => void;
  onCheckout: () => void;
  showMetrics?: boolean;
  showActions?: boolean;
  compact?: boolean;
};

/** Guest icon hub — replaces the old boxed 2×2 grid. */
export function GuestFourButtonSection({
  colors,
  hasDraft,
  insights,
  onPreview,
  onCheckout,
  showMetrics = true,
  showActions = true,
  compact = false,
}: Props) {
  const [cardId, setCardId] = useState<string | null>(null);

  useEffect(() => {
    void getStoredGuestCardId().then(setCardId);
  }, []);

  if (!showActions && !showMetrics) return null;

  const metrics: IconFlowMetrics = {
    order: hasDraft ? 'Saved' : '—',
    preview: insights?.bioSlug ? 'Live' : '—',
    track: `${insights?.totalOrders ?? 0}`,
    connections: insights?.bioSlug ? '1' : '0',
  };

  return (
    <GuestFlowHub
      bioSlug={insights?.bioSlug}
      cardId={cardId}
      metrics={metrics}
      showMetrics={showMetrics}
      showActions={showActions}
      onPreview={onPreview}
      onCheckout={onCheckout}
      textColor={colors.textPrimary}
      mutedColor={colors.textMuted}
      title={compact ? 'Quick actions' : 'Start your NFC journey'}
      subtitle={
        compact
          ? 'Design · preview · order · track'
          : 'Tap an icon — no boxes, just your next step'
      }
    />
  );
}
