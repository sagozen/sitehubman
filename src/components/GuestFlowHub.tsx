import { IconFlowHub, type IconFlowMetrics } from '@/src/components/IconFlowHub';
import { GUEST_METRIC_FLOWS, GUEST_PRIMARY_FLOWS } from '@/src/constants/guestFlows';
import { useGuestFlowLauncher } from '@/src/hooks/useGuestFlowLauncher';

type Props = {
  bioSlug?: string | null;
  cardId?: string | null;
  metrics?: IconFlowMetrics;
  onPreview: () => void;
  onCheckout: () => void;
  textColor?: string;
  mutedColor?: string;
  title?: string;
  subtitle?: string;
  showMetrics?: boolean;
  showActions?: boolean;
};

export function GuestFlowHub({
  bioSlug,
  cardId,
  metrics = {},
  onPreview,
  onCheckout,
  textColor,
  mutedColor,
  title = 'Quick actions',
  subtitle = 'My card · preview · track · connections',
  showMetrics = true,
  showActions = true,
}: Props) {
  const { launch } = useGuestFlowLauncher({ bioSlug, cardId, onPreview, onCheckout });

  return (
    <IconFlowHub
      title={title}
      subtitle={subtitle}
      primaryFlows={showActions ? GUEST_PRIMARY_FLOWS : []}
      metricFlows={showMetrics ? GUEST_METRIC_FLOWS : []}
      metrics={metrics}
      onLaunch={(id) => void launch(id)}
      textColor={textColor}
      mutedColor={mutedColor}
    />
  );
}
